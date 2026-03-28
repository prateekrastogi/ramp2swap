import { listPartnerLinks } from './partner-links';

export type AnalyticsRangeKey = '10D' | '30D' | '90D';

export type AnalyticsChartPoint = {
  label: string;
  clicks: number;
  conversionRate: string;
  height: number;
};

export type AnalyticsSummary = {
  timeRangeLabel: string;
  points: AnalyticsChartPoint[];
};

export type AnalyticsBreakdownItem = {
  label: string;
  pct: number;
};

export type PartnerAnalyticsPayload = {
  username: string;
  ranges: Record<AnalyticsRangeKey, AnalyticsSummary>;
  topLinks: AnalyticsBreakdownItem[];
  geography: AnalyticsBreakdownItem[];
};

type CountRow = {
  bucket_index: number | string;
  total: number | string;
};

type BreakdownRow = {
  key: string | null;
  total: number | string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DEFINITIONS: Array<{
  key: AnalyticsRangeKey;
  totalDays: number;
  bucketDays: number;
  label: string;
}> = [
  { key: '10D', totalDays: 10, bucketDays: 1, label: 'Last 10 days' },
  { key: '30D', totalDays: 30, bucketDays: 3, label: 'Last 30 days' },
  { key: '90D', totalDays: 90, bucketDays: 9, label: 'Last 90 days' },
];

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0) || 0;

const formatConversionRate = (clicks: number, conversions: number) =>
  clicks > 0 ? `${((conversions / clicks) * 100).toFixed(2)}%` : '0.00%';

const formatDateLabel = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

const formatBucketLabel = (start: number, endExclusive: number, bucketDays: number) => {
  if (bucketDays === 1) {
    return formatDateLabel(start);
  }

  const inclusiveEnd = endExclusive - 1;
  return `${formatDateLabel(start)}-${formatDateLabel(inclusiveEnd)}`;
};

const buildBuckets = (
  clicksByBucket: Map<number, number>,
  conversionsByBucket: Map<number, number>,
  rangeStart: number,
  bucketDays: number,
) => {
  const bucketMs = bucketDays * DAY_MS;
  const rawClicks = Array.from({ length: 10 }, (_value, index) => clicksByBucket.get(index) ?? 0);
  const maxClicks = Math.max(...rawClicks, 0);

  return rawClicks.map((clicks, index) => {
    const conversions = conversionsByBucket.get(index) ?? 0;
    const bucketStart = rangeStart + index * bucketMs;
    const bucketEnd = bucketStart + bucketMs;

    return {
      label: formatBucketLabel(bucketStart, bucketEnd, bucketDays),
      clicks,
      conversionRate: formatConversionRate(clicks, conversions),
      height: clicks === 0 || maxClicks === 0 ? 10 : Math.max(14, Math.round((clicks / maxClicks) * 100)),
    };
  });
};

const queryCountsByBucket = async (
  db: D1Database,
  table: 'clicks' | 'conversions',
  username: string,
  rangeStart: number,
  rangeEnd: number,
  bucketMs: number,
) => {
  const rows = await db
    .prepare(
      `
        SELECT
          CAST((timestamp - ?) / ? AS INTEGER) AS bucket_index,
          COUNT(*) AS total
        FROM ${table}
        WHERE username = ?
          AND timestamp >= ?
          AND timestamp < ?
        GROUP BY bucket_index
      `,
    )
    .bind(rangeStart, bucketMs, username, rangeStart, rangeEnd)
    .all<CountRow>();

  return new Map(
    (rows.results ?? [])
      .map((row) => [toNumber(row.bucket_index), toNumber(row.total)] as const)
      .filter(([bucketIndex]) => bucketIndex >= 0 && bucketIndex < 10),
  );
};

const listTopLinks = async (
  db: D1Database,
  username: string,
  linkLabelMap: Map<string, string>,
) => {
  const rows = await db
    .prepare(
      `
        SELECT campaign AS key, COUNT(*) AS total
        FROM clicks
        WHERE username = ?
          AND campaign IS NOT NULL
          AND TRIM(campaign) != ''
        GROUP BY campaign
        ORDER BY total DESC, campaign ASC
        LIMIT 5
      `,
    )
    .bind(username)
    .all<BreakdownRow>();

  const results = rows.results ?? [];
  const total = results.reduce((sum, row) => sum + toNumber(row.total), 0);
  if (total === 0) {
    return [];
  }

  return results.map((row) => {
    const campaign = row.key?.trim() ?? '';
    const count = toNumber(row.total);
    return {
      label: linkLabelMap.get(campaign) ?? campaign,
      pct: Math.max(1, Math.round((count / total) * 100)),
    };
  });
};

const listGeographicBreakdown = async (db: D1Database, username: string) => {
  const rows = await db
    .prepare(
      `
        SELECT country AS key, COUNT(*) AS total
        FROM clicks
        WHERE username = ?
          AND country IS NOT NULL
          AND TRIM(country) != ''
        GROUP BY country
        ORDER BY total DESC, country ASC
      `,
    )
    .bind(username)
    .all<BreakdownRow>();

  const results = rows.results ?? [];
  const total = results.reduce((sum, row) => sum + toNumber(row.total), 0);
  if (total === 0) {
    return [];
  }

  const topCountries = results.slice(0, 4);
  const otherCount = results.slice(4).reduce((sum, row) => sum + toNumber(row.total), 0);
  const items = topCountries.map((row) => {
    const countryCode = row.key?.trim().toUpperCase() ?? '';
    const count = toNumber(row.total);
    return {
      label: regionNames.of(countryCode) ?? countryCode,
      pct: Math.max(1, Math.round((count / total) * 100)),
    };
  });

  if (otherCount > 0) {
    items.push({
      label: 'Other',
      pct: Math.max(1, Math.round((otherCount / total) * 100)),
    });
  }

  return items.slice(0, 5);
};

export const getPartnerAnalytics = async (
  db: D1Database,
  {
    userUid,
    username,
    now = Date.now(),
  }: {
    userUid: string;
    username: string;
    now?: number;
  },
): Promise<PartnerAnalyticsPayload> => {
  const normalizedUsername = username.trim();
  const links = await listPartnerLinks(db, userUid);
  const linkLabelMap = new Map(links.map((link) => [link.campaignTag, link.campaignName]));

  const ranges = Object.fromEntries(
    await Promise.all(
      RANGE_DEFINITIONS.map(async (definition) => {
        const rangeEnd = now + 1;
        const rangeStart = now - definition.totalDays * DAY_MS;
        const bucketMs = definition.bucketDays * DAY_MS;

        const [clicksByBucket, conversionsByBucket] = await Promise.all([
          queryCountsByBucket(db, 'clicks', normalizedUsername, rangeStart, rangeEnd, bucketMs),
          queryCountsByBucket(db, 'conversions', normalizedUsername, rangeStart, rangeEnd, bucketMs),
        ]);

        return [
          definition.key,
          {
            timeRangeLabel: definition.label,
            points: buildBuckets(clicksByBucket, conversionsByBucket, rangeStart, definition.bucketDays),
          },
        ] as const;
      }),
    ),
  ) as Record<AnalyticsRangeKey, AnalyticsSummary>;

  const [topLinks, geography] = await Promise.all([
    listTopLinks(db, normalizedUsername, linkLabelMap),
    listGeographicBreakdown(db, normalizedUsername),
  ]);

  return {
    username: normalizedUsername,
    ranges,
    topLinks,
    geography,
  };
};
