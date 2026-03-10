export type TransactionFeedItem = {
  id: string;
  status: 'completed' | 'pending' | 'failed';
  amount: string;
  pair: string;
  timestamp: string;
  user: string;
};

// Mock transaction feed data is isolated here for later API replacement.
export const transactionFeedItems: TransactionFeedItem[] = [
  {
    id: 'TX-91A2',
    status: 'completed',
    amount: '$1,250.00',
    pair: 'USDC -> ETH',
    timestamp: '2026-03-10 08:42 UTC',
    user: 'usr_x3f9•••',
  },
  {
    id: 'TX-91A3',
    status: 'pending',
    amount: '$480.00',
    pair: 'EUR -> USDT',
    timestamp: '2026-03-10 08:31 UTC',
    user: 'usr_k2b1•••',
  },
  {
    id: 'TX-91A4',
    status: 'failed',
    amount: '$2,040.00',
    pair: 'USD -> BTC',
    timestamp: '2026-03-10 08:09 UTC',
    user: 'usr_p8c7•••',
  },
  {
    id: 'TX-91A5',
    status: 'completed',
    amount: '$320.00',
    pair: 'GBP -> SOL',
    timestamp: '2026-03-10 07:58 UTC',
    user: 'usr_w5m2•••',
  },
  {
    id: 'TX-91A6',
    status: 'completed',
    amount: '$760.00',
    pair: 'USD -> MATIC',
    timestamp: '2026-03-10 07:41 UTC',
    user: 'usr_d1l4•••',
  },
];
