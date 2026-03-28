import type { APIRoute } from 'astro';
import { buildMainApiProxyHeaders, forwardToMainApi } from '../../lib/main-api-proxy';

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text().catch(() => '');

  if (!rawBody.trim()) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Request body is required.',
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  }

  const init: RequestInit = {
    method: 'POST',
    headers: buildMainApiProxyHeaders(request),
    body: rawBody,
  };

  return forwardToMainApi(request, '/widget-event', init);
};
