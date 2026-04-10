import type { APIRoute } from 'astro';
import { forwardToMainApi } from '../../lib/main-api-proxy';

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';

  console.log('[Web Intent API] Forwarding text:', text);

  if (!text) {
    console.error('[Web Intent API] Error: Intent text is required.');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Intent text is required.',
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
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ text }),
  };

  return forwardToMainApi(request, '/intent', init);
};
