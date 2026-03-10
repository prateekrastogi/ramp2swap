export type PerformanceSnapshotMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  delta: string;
  accent?: 'mint';
};

// Mock performance snapshot data lives here so backend wiring can replace it cleanly later.
export const performanceSnapshotMetrics: PerformanceSnapshotMetric[] = [
  {
    id: 'total-clicks',
    label: 'Total Clicks',
    value: '48,220',
    detail: 'Last 30 days across all referral links',
    delta: '+12.4% vs prior period',
  },
  {
    id: 'conversions',
    label: 'Conversions',
    value: '3,124',
    detail: 'Completed ramp transactions attributed',
    delta: '+8.1% vs prior period',
  },
  {
    id: 'volume-driven',
    label: 'Volume Driven',
    value: '$4.2M',
    detail: 'Total partner-driven fiat to crypto volume',
    delta: '+18.7% vs prior period',
  },
  {
    id: 'commission-balance',
    label: 'Commission Balance',
    value: '$28,940',
    detail: 'Available plus pending commission earnings',
    delta: '$21,520 available now',
    accent: 'mint',
  },
];
