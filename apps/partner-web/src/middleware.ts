import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './lib/auth-session';
import { getSessionSecret } from './lib/runtime-env';

const SESSION_COOKIE_NAME = 'partner_session';

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  if (pathname.startsWith('/_astro') || pathname.startsWith('/api/auth/') || pathname.startsWith('/favicon')) {
    return next();
  }

  const sessionToken = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionSecret = getSessionSecret(context.locals);

  let hasValidSession = false;
  if (sessionToken && sessionSecret) {
    hasValidSession = (await verifySessionToken(sessionToken, sessionSecret)) !== null;
  }

  if (pathname === '/login' && hasValidSession) {
    return context.redirect('/');
  }

  if (pathname === '/' && !hasValidSession) {
    return context.redirect('/login');
  }

  return next();
});
