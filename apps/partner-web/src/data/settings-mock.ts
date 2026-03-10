export type ProfileSettings = {
  displayName: string;
  email: string;
  profilePhotoLabel: string;
  timezone: string;
  language: string;
};

export type KybDocument = {
  name: string;
  status: 'uploaded' | 'needs-update';
};

export type ComplianceSettings = {
  kybStatus: 'verified' | 'pending' | 'rejected';
  complianceTier: string;
  documents: KybDocument[];
  taxForm: string;
};

export type PayoutSettings = {
  walletAsset: string;
  walletAddress: string;
  network: string;
  minimumThreshold: string;
  autoPayoutSchedule: string;
  payoutHistoryLabel: string;
};

export type NotificationSettings = {
  newConversions: boolean;
  payoutReceived: boolean;
  weeklySummary: boolean;
  kybStatusChange: boolean;
  highValueThreshold: string;
};

export const profileSettings: ProfileSettings = {
  displayName: 'Ramp2Swap Partner Account',
  email: 'partners@ramp2swap.com',
  profilePhotoLabel: 'Logo profile photo uploaded',
  timezone: 'Asia/Kolkata (UTC+05:30)',
  language: 'English',
};

export const complianceSettings: ComplianceSettings = {
  kybStatus: 'verified',
  complianceTier: 'Tier 2 Partner',
  documents: [
    { name: 'Certificate of Incorporation', status: 'uploaded' },
    { name: 'Director Identity Document', status: 'uploaded' },
    { name: 'Proof of Address', status: 'needs-update' },
  ],
  taxForm: 'W-8BEN-E uploaded',
};

export const payoutSettings: PayoutSettings = {
  walletAsset: 'USDC',
  walletAddress: '0x7d2f...91c4',
  network: 'ERC20',
  minimumThreshold: '$2,500',
  autoPayoutSchedule: 'Weekly',
  payoutHistoryLabel: 'View payout history',
};

export const notificationSettings: NotificationSettings = {
  newConversions: true,
  payoutReceived: true,
  weeklySummary: true,
  kybStatusChange: true,
  highValueThreshold: '$5,000',
};
