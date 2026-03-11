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

// Mock analytics data is isolated here for later API replacement.
export const analyticsSummaries: Record<AnalyticsRangeKey, AnalyticsSummary> = {
  '10D': {
    timeRangeLabel: 'Last 10 days',
    points: [
      { label: 'Day 1', clicks: 184, conversionRate: '4.88%', height: 46 },
      { label: 'Day 2', clicks: 244, conversionRate: '5.21%', height: 61 },
      { label: 'Day 3', clicks: 232, conversionRate: '5.04%', height: 58 },
      { label: 'Day 4', clicks: 288, conversionRate: '5.93%', height: 72 },
      { label: 'Day 5', clicks: 276, conversionRate: '5.76%', height: 69 },
      { label: 'Day 6', clicks: 308, conversionRate: '6.18%', height: 77 },
      { label: 'Day 7', clicks: 256, conversionRate: '5.42%', height: 64 },
      { label: 'Day 8', clicks: 284, conversionRate: '5.81%', height: 71 },
      { label: 'Day 9', clicks: 296, conversionRate: '6.02%', height: 74 },
      { label: 'Day 10', clicks: 272, conversionRate: '5.67%', height: 68 },
    ],
  },
  '30D': {
    timeRangeLabel: 'Last 30 days',
    points: [
      { label: 'Days 1-3', clicks: 420, conversionRate: '5.44%', height: 42 },
      { label: 'Days 4-6', clicks: 600, conversionRate: '6.08%', height: 60 },
      { label: 'Days 7-9', clicks: 550, conversionRate: '5.91%', height: 55 },
      { label: 'Days 10-12', clicks: 720, conversionRate: '6.54%', height: 72 },
      { label: 'Days 13-15', clicks: 650, conversionRate: '6.22%', height: 65 },
      { label: 'Days 16-18', clicks: 840, conversionRate: '6.91%', height: 84 },
      { label: 'Days 19-21', clicks: 680, conversionRate: '6.33%', height: 68 },
      { label: 'Days 22-24', clicks: 760, conversionRate: '6.71%', height: 76 },
      { label: 'Days 25-27', clicks: 580, conversionRate: '6.04%', height: 58 },
      { label: 'Days 28-30', clicks: 800, conversionRate: '6.63%', height: 80 },
    ],
  },
  '90D': {
    timeRangeLabel: 'Last 90 days',
    points: [
      { label: 'Days 1-9', clicks: 560, conversionRate: '6.24%', height: 28 },
      { label: 'Days 10-18', clicks: 720, conversionRate: '6.48%', height: 36 },
      { label: 'Days 19-27', clicks: 820, conversionRate: '6.71%', height: 41 },
      { label: 'Days 28-36', clicks: 1040, conversionRate: '6.92%', height: 52 },
      { label: 'Days 37-45', clicks: 980, conversionRate: '6.86%', height: 49 },
      { label: 'Days 46-54', clicks: 1260, conversionRate: '7.18%', height: 63 },
      { label: 'Days 55-63', clicks: 1160, conversionRate: '7.06%', height: 58 },
      { label: 'Days 64-72', clicks: 1340, conversionRate: '7.32%', height: 67 },
      { label: 'Days 73-81', clicks: 1220, conversionRate: '7.11%', height: 61 },
      { label: 'Days 82-90', clicks: 1480, conversionRate: '7.44%', height: 74 },
    ],
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
