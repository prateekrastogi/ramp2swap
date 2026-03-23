import type { APIRoute } from 'astro';
import { getPartnerApiBaseUrl } from '../../../lib/runtime-env';

const SESSION_COOKIE_NAME = 'partner_session';

export const POST: APIRoute = async ({ cookies }) => {
  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  const partnerApiBaseUrl = await getPartnerApiBaseUrl();

  if (partnerApiBaseUrl && sessionToken) {
    try {
      await fetch(`${partnerApiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken }),
      });
    } catch (error) {
      console.warn('[auth] partner-api logout request failed', error);
    }
  }

  cookies.delete(SESSION_COOKIE_NAME, {
    path: '/',
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
