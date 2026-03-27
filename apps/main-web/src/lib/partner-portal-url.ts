export function getPartnerPortalUrl(currentUrl: URL, fallbackAppUrl: string) {
  const fallbackUrl = new URL(fallbackAppUrl);
  const normalizedUrl = new URL(currentUrl.toString());
  const currentHost = normalizedUrl.hostname.toLowerCase();
  const hostLabels = currentHost.split('.');
  const isLocalHost =
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    currentHost === '[::1]';
  const isEnvironmentHost =
    hostLabels.length >= 3 &&
    (hostLabels[0] === 'staging' || hostLabels[0] === 'test');

  if (currentHost.startsWith('partner.') || hostLabels[1] === 'partner') {
    normalizedUrl.pathname = '/';
    normalizedUrl.search = '';
    normalizedUrl.hash = '';
    return normalizedUrl.toString();
  }

  if (isLocalHost) {
    fallbackUrl.hostname = `partner.${fallbackUrl.hostname}`;
    fallbackUrl.pathname = '/';
    fallbackUrl.search = '';
    fallbackUrl.hash = '';
    return fallbackUrl.toString();
  }

  if (isEnvironmentHost) {
    normalizedUrl.hostname = [hostLabels[0], 'partner', ...hostLabels.slice(1)].join('.');
  } else {
    normalizedUrl.hostname = `partner.${currentHost}`;
  }
  normalizedUrl.pathname = '/';
  normalizedUrl.search = '';
  normalizedUrl.hash = '';
  return normalizedUrl.toString();
}
