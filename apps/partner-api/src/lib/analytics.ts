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
  clicks: number;
  conversions: number;
  conversionRate: string;
};

export type PartnerAnalyticsPayload = {
  username: string;
  ranges: Record<AnalyticsRangeKey, AnalyticsSummary>;
  topLinks: Record<AnalyticsRangeKey, AnalyticsBreakdownItem[]>;
  geography: Record<AnalyticsRangeKey, AnalyticsBreakdownItem[]>;
};

type CountRow = {
  bucket_index: number | string;
  total: number | string;
};

type BreakdownRow = {
  key: string | null;
  total: number | string;
};

type BreakdownMaps = {
  clicks: Map<string, number>;
  conversions: Map<string, number>;
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

const formatPercentage = (count: number, total: number) => {
  if (total <= 0) {
    return 0;
  }

  return Math.round(((count / total) * 100) * 10) / 10;
};

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

const queryBreakdownMap = async (
  db: D1Database,
  table: 'clicks' | 'conversions',
  field: 'campaign' | 'country',
  username: string,
  rangeStart: number,
  rangeEnd: number,
) => {
  const rows = await db
    .prepare(
      `
        SELECT ${field} AS key, COUNT(*) AS total
        FROM ${table}
        WHERE username = ?
          AND timestamp >= ?
          AND timestamp < ?
          AND ${field} IS NOT NULL
          AND TRIM(${field}) != ''
        GROUP BY ${field}
        ORDER BY total DESC, ${field} ASC
      `,
    )
    .bind(username, rangeStart, rangeEnd)
    .all<BreakdownRow>();

  return new Map(
    (rows.results ?? []).map((row) => [row.key?.trim() ?? '', toNumber(row.total)] as const).filter(([key]) => key !== ''),
  );
};

const queryBreakdownMaps = async (
  db: D1Database,
  field: 'campaign' | 'country',
  username: string,
  rangeStart: number,
  rangeEnd: number,
): Promise<BreakdownMaps> => {
  const [clicks, conversions] = await Promise.all([
    queryBreakdownMap(db, 'clicks', field, username, rangeStart, rangeEnd),
    queryBreakdownMap(db, 'conversions', field, username, rangeStart, rangeEnd),
  ]);

  return { clicks, conversions };
};

const listTopLinks = (
  { clicks, conversions }: BreakdownMaps,
  linkLabelMap: Map<string, string>,
) => {
  const orderedCampaigns = Array.from(clicks.entries()).sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  });
  const totalClicks = orderedCampaigns.reduce((sum, [_campaign, count]) => sum + count, 0);
  if (totalClicks === 0) {
    return [];
  }

  return orderedCampaigns.slice(0, 5).map(([campaign, count]) => {
    const conversionCount = conversions.get(campaign) ?? 0;
    return {
      label: linkLabelMap.get(campaign) ?? campaign,
      pct: formatPercentage(count, totalClicks),
      clicks: count,
      conversions: conversionCount,
      conversionRate: formatConversionRate(count, conversionCount),
    };
  });
};

const listGeographicBreakdown = ({ clicks, conversions }: BreakdownMaps) => {
  const orderedCountries = Array.from(clicks.entries()).sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  });
  const totalClicks = orderedCountries.reduce((sum, [_country, count]) => sum + count, 0);
  if (totalClicks === 0) {
    return [];
  }

  const topCountries = orderedCountries.slice(0, 4);
  const otherCountries = orderedCountries.slice(4);
  const items = topCountries.map(([countryKey, count]) => {
    const countryCode = countryKey.trim().toUpperCase();
    const conversionCount = conversions.get(countryKey) ?? conversions.get(countryCode) ?? 0;
    return {
      label: regionNames.of(countryCode) ?? countryCode,
      pct: formatPercentage(count, totalClicks),
      clicks: count,
      conversions: conversionCount,
      conversionRate: formatConversionRate(count, conversionCount),
    };
  });

  if (otherCountries.length > 0) {
    const otherClicks = otherCountries.reduce((sum, [_country, count]) => sum + count, 0);
    const otherConversions = otherCountries.reduce(
      (sum, [country]) => sum + (conversions.get(country) ?? conversions.get(country.toUpperCase()) ?? 0),
      0,
    );
    items.push({
      label: 'Other',
      pct: formatPercentage(otherClicks, totalClicks),
      clicks: otherClicks,
      conversions: otherConversions,
      conversionRate: formatConversionRate(otherClicks, otherConversions),
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

  const topLinks = Object.fromEntries(
    await Promise.all(
      RANGE_DEFINITIONS.map(async (definition) => {
        const rangeEnd = now + 1;
        const rangeStart = now - definition.totalDays * DAY_MS;
        const maps = await queryBreakdownMaps(db, 'campaign', normalizedUsername, rangeStart, rangeEnd);
        return [definition.key, listTopLinks(maps, linkLabelMap)] as const;
      }),
    ),
  ) as Record<AnalyticsRangeKey, AnalyticsBreakdownItem[]>;

  const geography = Object.fromEntries(
    await Promise.all(
      RANGE_DEFINITIONS.map(async (definition) => {
        const rangeEnd = now + 1;
        const rangeStart = now - definition.totalDays * DAY_MS;
        const maps = await queryBreakdownMaps(db, 'country', normalizedUsername, rangeStart, rangeEnd);
        return [definition.key, listGeographicBreakdown(maps)] as const;
      }),
    ),
  ) as Record<AnalyticsRangeKey, AnalyticsBreakdownItem[]>;

  return {
    username: normalizedUsername,
    ranges,
    topLinks,
    geography,
  };
};
