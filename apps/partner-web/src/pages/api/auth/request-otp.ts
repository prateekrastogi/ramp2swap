import type { APIRoute } from 'astro';
import { getPartnerApiBaseUrl } from '../../../lib/runtime-env';

export const POST: APIRoute = async ({ request, locals }) => {
  const partnerApiBaseUrl = getPartnerApiBaseUrl(locals);
  if (!partnerApiBaseUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'PARTNER_API_BASE_URL is not configured.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  const payload = await request.json().catch(() => null);
  const email = typeof payload?.email === 'string' ? payload.email : '';

  let response: Response;
  try {
    response = await fetch(`${partnerApiBaseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
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
