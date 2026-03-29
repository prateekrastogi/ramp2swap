import type { APIRoute } from 'astro';
import { getPartnerApiBaseUrl } from '../../../lib/runtime-env';

const SESSION_COOKIE_NAME = 'partner_session';

export const POST: APIRoute = async ({ cookies }) => {
  const partnerApiBaseUrl = await getPartnerApiBaseUrl();
  if (!partnerApiBaseUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'PARTNER_API_BASE_URL is not configured.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value ?? '';
  if (!sessionToken) {
    return new Response(JSON.stringify({ ok: false, error: 'Session expired or invalid.' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  let response: Response;
  try {
    response = await fetch(`${partnerApiBaseUrl}/settlement/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Partner API is unavailable. Start partner-api and try again.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
