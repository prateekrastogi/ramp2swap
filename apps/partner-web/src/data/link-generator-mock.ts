export type LinkGeneratorDraft = {
  baseUrl: string;
  partnerId: string;
  campaignTag: string;
  generatedUrl: string;
};

export type SavedCampaignLink = {
  id: string;
  name: string;
  tag: string;
  url: string;
  clicks: string;
  conversions: string;
};

// Mock link generator data is isolated here so backend/API wiring can replace it later.
export const linkGeneratorDraft: LinkGeneratorDraft = {
  baseUrl: 'https://ramp2swap.com/r',
  partnerId: 'partner_2swap_019',
  campaignTag: 'spring-launch-2026',
  generatedUrl: 'https://ramp2swap.com/r?pid=partner_2swap_019&cmp=spring-launch-2026',
};

export const savedCampaignLinks: SavedCampaignLink[] = [
  {
    id: 'main-campaign',
    name: 'Main Campaign',
    tag: 'website-header',
    url: 'https://ramp2swap.com/r?pid=partner_2swap_019&cmp=website-header',
    clicks: '18,420',
    conversions: '1,204',
  },
  {
    id: 'creator-drop',
    name: 'Creator Drop',
    tag: 'tg-creator-01',
    url: 'https://ramp2swap.com/r?pid=partner_2swap_019&cmp=tg-creator-01',
    clicks: '9,860',
    conversions: '688',
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    tag: 'email-mar-w2',
    url: 'https://ramp2swap.com/r?pid=partner_2swap_019&cmp=email-mar-w2',
    clicks: '7,240',
    conversions: '451',
  },
];
