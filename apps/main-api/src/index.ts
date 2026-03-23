import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { callBoundRagAiService, type MainApiBindings } from './aisearch/client'
import { ensureAiSearchMockRunner, runMockQueries } from './aisearch/mock-runner'
import { pickMockWidgetFormValues } from './intent-mock'

const app = new Hono<{ Bindings: MainApiBindings }>()
const MIN_INTENT_DELAY_MS = 5_000
const MAX_INTENT_DELAY_MS = 10_000

function wait(durationMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

function getIntentDelayMs() {
  return Math.floor(Math.random() * (MAX_INTENT_DELAY_MS - MIN_INTENT_DELAY_MS + 1)) + MIN_INTENT_DELAY_MS
}

app.use(
  '*',
  cors({
    origin: ['http://localhost:1234', 'http://127.0.0.1:1234'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type']
  })
)

app.use('*', async (c, next) => {
  ensureAiSearchMockRunner(c.env, c.executionCtx)

  console.log('[main-api] Incoming request', {
    method: c.req.method,
    path: c.req.path
  })

  await next()
})

app.post('/intent', async (c) => {
  const body = await c.req.json<{ text?: unknown }>().catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (!text) {
    console.warn('[main-api] Rejected /intent request with empty text')

    return c.json(
      {
        success: false,
        error: 'Intent text is required.'
      },
      400
    )
  }

  const delayMs = getIntentDelayMs()
  const { profile, widgetFormValues } = pickMockWidgetFormValues()
  console.log(`[main-api] Received /intent request`, {
    text,
    delayMs,
    profile,
    widgetFormValues
  })

  await wait(delayMs)

  console.log(`[main-api] Responding to /intent request`, {
    text,
    delayMs,
    profile,
    widgetFormValues
  })

  return c.json(
    {
      success: true,
      receivedText: text,
      delayMs,
      mock: true,
      widgetFormValues
    },
    200
  )
})

app.post('/aisearch', async (c) => {
  const body = await c.req
    .json<{
      query?: unknown
      model?: unknown
      max_num_results?: unknown
      rewrite_query?: unknown
    }>()
    .catch(() => null)

  const query = typeof body?.query === 'string' ? body.query.trim() : ''

  if (!query) {
    return c.json(
      {
        success: false,
        error: 'AI Search query is required.'
      },
      400
    )
  }

  try {
    const result = await callBoundRagAiService(c.env, {
      query,
      model: typeof body?.model === 'string' ? body.model : undefined,
      max_num_results: typeof body?.max_num_results === 'number' ? body.max_num_results : undefined,
      rewrite_query: typeof body?.rewrite_query === 'boolean' ? body.rewrite_query : undefined
    })

    return c.json(
      {
        success: true,
        query,
        widgetFormValues: result.body.widgetFormValues
      },
      200
    )
  } catch (error) {
    console.error('[main-api] /aisearch proxy failed', {
      query,
      error: error instanceof Error ? error.message : String(error)
    })

    return c.json(
      {
        success: false,
        query,
        error: error instanceof Error ? error.message : 'Unknown AI Search proxy error'
      },
      502
    )
  }
})

app.post('/aisearch/mock-run', async (c) => {
  c.executionCtx.waitUntil(runMockQueries(c.env, 'manual'))

  return c.json(
    {
      success: true,
      message: 'AI Search mock batch started. Check main-api logs for responses.'
    },
    202
  )
})

export default app
