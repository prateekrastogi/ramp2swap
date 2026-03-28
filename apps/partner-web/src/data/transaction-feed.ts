export type TransactionFeedItem = {
  id: string;
  status: 'completed' | 'pending' | 'failed';
  amount: string;
  pair: string;
  timestamp: string;
  user: string;
};

type TransactionFeedPayload = {
  ok?: boolean;
  transactions?: TransactionFeedItem[];
};

export const loadTransactionFeed = async ({
  partnerApiBaseUrl,
  sessionToken,
  username,
}: {
  partnerApiBaseUrl: string;
  sessionToken: string;
  username: string;
}) => {
  if (!partnerApiBaseUrl || !sessionToken || !username) {
    return [] as TransactionFeedItem[];
  }

  const response = await fetch(`${partnerApiBaseUrl}/transaction/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionToken,
      username,
    }),
  });

  const payload = (await response.json().catch(() => null)) as TransactionFeedPayload | null;

  if (!response.ok || !payload?.ok || !Array.isArray(payload.transactions)) {
    return [] as TransactionFeedItem[];
  }

  return payload.transactions;
};
