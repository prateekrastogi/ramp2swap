import type { APIRoute } from 'astro';
import { getPartnerApiBaseUrl } from '../../../lib/runtime-env';

const SESSION_COOKIE_NAME = 'partner_session';

export const POST: APIRoute = async ({ request, cookies, locals, url }) => {
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

  const requestPayload = await request.json().catch(() => null);
  const email = typeof requestPayload?.email === 'string' ? requestPayload.email : '';
  const otp = typeof requestPayload?.otp === 'string' ? requestPayload.otp : '';

  let response: Response;
  try {
    response = await fetch(`${partnerApiBaseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
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

  const responsePayload = (await response.json().catch(() => null)) as
    | { ok?: boolean; sessionToken?: string; expiresAt?: number; email?: string; error?: string }
    | null;

  if (!response.ok || !responsePayload?.ok || !responsePayload.sessionToken || !responsePayload.expiresAt) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: responsePayload?.error ?? 'Unable to verify OTP.',
      }),
      {
        status: response.status || 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  cookies.set(SESSION_COOKIE_NAME, responsePayload.sessionToken, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    expires: new Date(responsePayload.expiresAt),
  });

  return new Response(
    JSON.stringify({
      ok: true,
      email: responsePayload.email,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  );
};
