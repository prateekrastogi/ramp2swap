export type PayoutDisplaySettings = {
  walletAsset: string;
  network: string;
  minimumThreshold: string;
};

export const payoutDisplaySettings: PayoutDisplaySettings = {
  walletAsset: 'USDC',
  network: 'Solana',
  minimumThreshold: '$10',
};
