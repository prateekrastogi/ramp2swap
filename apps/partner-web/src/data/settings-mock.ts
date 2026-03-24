export type ProfileSettings = {
  displayName: string;
  email: string;
  profilePhotoLabel: string;
  timezone: string;
  language: string;
};

export type PayoutSettings = {
  walletAsset: string;
  walletAddress: string;
  network: string;
  minimumThreshold: string;
  autoPayoutSchedule: string;
  payoutRate: string;
};

export const profileSettings: ProfileSettings = {
  displayName: 'Ramp2Swap Partner Account',
  email: 'partners@ramp2swap.com',
  profilePhotoLabel: 'Logo profile photo uploaded',
  timezone: 'Asia/Kolkata (UTC+05:30)',
  language: 'English',
};

export const payoutSettings: PayoutSettings = {
  walletAsset: 'USDC',
  walletAddress: '0x7d2f...91c4',
  network: 'Solana',
  minimumThreshold: '$10',
  autoPayoutSchedule: 'Weekly',
  payoutRate: '0.15%',
};
