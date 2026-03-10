export type EarningsSummary = {
  commissionRate: string;
  pendingBalance: string;
  availableBalance: string;
  totalPaidOut: string;
};

export type PayoutHistoryEntry = {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'processing';
  destination: string;
};

// Mock earnings and payout data is isolated here for later API replacement.
export const earningsSummary: EarningsSummary = {
  commissionRate: '18%',
  pendingBalance: '$7,420',
  availableBalance: '$21,520',
  totalPaidOut: '$58,140',
};

export const payoutHistoryEntries: PayoutHistoryEntry[] = [
  {
    id: 'po-0310',
    date: '2026-03-01',
    amount: '$8,600',
    status: 'paid',
    destination: 'USDC wallet •••91C4',
  },
  {
    id: 'po-0215',
    date: '2026-02-15',
    amount: '$7,900',
    status: 'paid',
    destination: 'USDC wallet •••91C4',
  },
  {
    id: 'po-0201',
    date: '2026-02-01',
    amount: '$6,870',
    status: 'paid',
    destination: 'USDC wallet •••91C4',
  },
  {
    id: 'po-0118',
    date: '2026-01-18',
    amount: '$5,440',
    status: 'processing',
    destination: 'USDC wallet •••91C4',
  },
];
