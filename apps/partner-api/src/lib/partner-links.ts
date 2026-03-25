import { createRandomToken } from './auth';

type PartnerLinkRow = {
  id: string;
  user_uid: string;
  campaign_name: string;
  campaign_tag: string;
  generated_url: string;
  created_at: number;
  updated_at: number;
};

export type PartnerLinkRecord = {
  id: string;
  campaignName: string;
  campaignTag: string;
  generatedUrl: string;
  createdAt: number;
  updatedAt: number;
};

export const normalizeCampaignName = (value: string) => value.trim();
export const normalizeCampaignTag = (value: string) => value.trim();

const toPartnerLinkRecord = (row: PartnerLinkRow): PartnerLinkRecord => ({
  id: row.id,
  campaignName: row.campaign_name,
  campaignTag: row.campaign_tag,
  generatedUrl: row.generated_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const buildGeneratedPartnerLink = (baseUrl: string, username: string, campaignTag: string) => {
  const url = new URL(baseUrl);
  url.searchParams.set('pid', username.trim());
  url.searchParams.set('cmp', campaignTag.trim());
  return url.toString();
};

export const listPartnerLinks = async (db: D1Database, userUid: string): Promise<PartnerLinkRecord[]> => {
  const rows = await db
    .prepare(
      `
        SELECT id, user_uid, campaign_name, campaign_tag, generated_url, created_at, updated_at
        FROM links
        WHERE user_uid = ?
        ORDER BY created_at DESC, id DESC
      `,
    )
    .bind(userUid)
    .all<PartnerLinkRow>();

  return (rows.results ?? []).map(toPartnerLinkRecord);
};

export const deletePartnerLink = async (db: D1Database, userUid: string, linkId: string) => {
  const normalizedLinkId = linkId.trim();

  if (!normalizedLinkId) {
    throw new Error('Link id is required.');
  }

  const existingLink = await db
    .prepare(
      `
        SELECT id, user_uid, campaign_name, campaign_tag, generated_url, created_at, updated_at
        FROM links
        WHERE id = ? AND user_uid = ?
        LIMIT 1
      `,
    )
    .bind(normalizedLinkId, userUid)
    .first<PartnerLinkRow>();

  if (!existingLink) {
    return null;
  }

  await db
    .prepare('DELETE FROM links WHERE id = ? AND user_uid = ?')
    .bind(normalizedLinkId, userUid)
    .run();

  return toPartnerLinkRecord(existingLink);
};

export const generatePartnerLink = async (
  db: D1Database,
  {
    userUid,
    username,
    campaignName,
    campaignTag,
    baseUrl,
    now = Date.now(),
  }: {
    userUid: string;
    username: string;
    campaignName: string;
    campaignTag: string;
    baseUrl: string;
    now?: number;
  },
) => {
  const normalizedCampaignName = normalizeCampaignName(campaignName);
  const normalizedCampaignTag = normalizeCampaignTag(campaignTag);

  if (!normalizedCampaignName) {
    throw new Error('Campaign name is required.');
  }

  if (!normalizedCampaignTag) {
    throw new Error('Campaign tag is required.');
  }

  const existingLink = await db
    .prepare(
      `
        SELECT id, user_uid, campaign_name, campaign_tag, generated_url, created_at, updated_at
        FROM links
        WHERE user_uid = ?
          AND (
            campaign_tag = ?
            OR campaign_name = ?
          )
        LIMIT 1
      `,
    )
    .bind(userUid, normalizedCampaignTag, normalizedCampaignName)
    .first<PartnerLinkRow>();

  if (existingLink) {
    return {
      duplicate: true,
      link: toPartnerLinkRecord(existingLink),
    };
  }

  const generatedUrl = buildGeneratedPartnerLink(baseUrl, username, normalizedCampaignTag);
  const id = `lnk_${createRandomToken(18)}`;

  await db
    .prepare(
      `
        INSERT INTO links (
          id,
          user_uid,
          campaign_name,
          campaign_tag,
          generated_url,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .bind(id, userUid, normalizedCampaignName, normalizedCampaignTag, generatedUrl, now, now)
    .run()
    .catch(async (error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes('unique')) {
        throw error;
      }

      const duplicateLink = await db
        .prepare(
          `
            SELECT id, user_uid, campaign_name, campaign_tag, generated_url, created_at, updated_at
            FROM links
            WHERE user_uid = ?
              AND (
                campaign_tag = ?
                OR campaign_name = ?
              )
            LIMIT 1
          `,
        )
        .bind(userUid, normalizedCampaignTag, normalizedCampaignName)
        .first<PartnerLinkRow>();

      if (!duplicateLink) {
        throw error;
      }

      return duplicateLink;
    });

  const racedDuplicate = await db
    .prepare(
      `
        SELECT id, user_uid, campaign_name, campaign_tag, generated_url, created_at, updated_at
        FROM links
        WHERE user_uid = ?
          AND (
            campaign_tag = ?
            OR campaign_name = ?
          )
        LIMIT 1
      `,
    )
    .bind(userUid, normalizedCampaignTag, normalizedCampaignName)
    .first<PartnerLinkRow>();

  if (racedDuplicate && racedDuplicate.id !== id) {
    return {
      duplicate: true,
      link: toPartnerLinkRecord(racedDuplicate),
    };
  }

  const createdLink = await db
    .prepare(
      `
        SELECT id, user_uid, campaign_name, campaign_tag, generated_url, created_at, updated_at
        FROM links
        WHERE id = ?
        LIMIT 1
      `,
    )
    .bind(id)
    .first<PartnerLinkRow>();

  if (!createdLink) {
    throw new Error('Generated link could not be loaded after creation.');
  }

  return {
    duplicate: false,
    link: toPartnerLinkRecord(createdLink),
  };
};
