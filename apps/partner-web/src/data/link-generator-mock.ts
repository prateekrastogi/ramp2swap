export type LinkGeneratorDraft = {
  baseUrl: string;
  campaignName: string;
  campaignTag: string;
};

// Mock link generator data is isolated here so backend/API wiring can replace it later.
export const linkGeneratorDraft: LinkGeneratorDraft = {
  baseUrl: 'https://ramp2swap.com/r',
  campaignName: 'Spring Launch 2026',
  campaignTag: 'spring-launch-2026',
};
