export type AnalyticsRangeKey = '10D' | '30D' | '90D';

export type AnalyticsSummary = {
  conversionRate: string;
  timeRangeLabel: string;
  bars: number[];
};

export type AnalyticsBreakdownItem = {
  label: string;
  pct: number;
};

// Mock analytics data is isolated here for later API replacement.
export const analyticsSummaries: Record<AnalyticsRangeKey, AnalyticsSummary> = {
  '10D': {
    conversionRate: '5.92%',
    timeRangeLabel: 'Last 10 days',
    bars: [46, 61, 58, 72, 69, 77, 64, 71, 74, 68],
  },
  '30D': {
    conversionRate: '6.48%',
    timeRangeLabel: 'Last 30 days',
    bars: [42, 60, 55, 72, 65, 84, 68, 76, 58, 80],
  },
  '90D': {
    conversionRate: '7.11%',
    timeRangeLabel: 'Last 90 days',
    bars: [28, 36, 41, 52, 49, 63, 58, 67, 61, 74],
  },
};

export const topPerformingLinks: AnalyticsBreakdownItem[] = [
  { label: 'Main Campaign', pct: 32 },
  { label: 'Creator Drop', pct: 24 },
  { label: 'Telegram Push', pct: 18 },
  { label: 'Email Flow', pct: 15 },
  { label: 'Partner Blog', pct: 11 },
];

export const geographicBreakdown: AnalyticsBreakdownItem[] = [
  { label: 'India', pct: 34 },
  { label: 'UAE', pct: 21 },
  { label: 'UK', pct: 18 },
  { label: 'US', pct: 16 },
  { label: 'Other', pct: 11 },
];
