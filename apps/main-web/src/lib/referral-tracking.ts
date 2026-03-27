export type AffiliateLandingEvent = {
  event: 'affiliate';
  username: string;
  campaign: string;
};

export function parseAffiliateLandingEvent(url: URL): AffiliateLandingEvent | null {
  if (url.pathname !== '/r') {
    return null;
  }

  const username = url.searchParams.get('pid')?.trim() ?? '';
  const campaign = url.searchParams.get('cmp')?.trim() ?? '';

  if (!username || !campaign) {
    return null;
  }

  return {
    event: 'affiliate',
    username,
    campaign,
  };
}
