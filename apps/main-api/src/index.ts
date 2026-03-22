import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()
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
  console.log(`[main-api] Received /intent request`, {
    text,
    delayMs
  })

  await wait(delayMs)

  console.log(`[main-api] Responding to /intent request`, {
    text,
    delayMs
  })

  return c.json(
    {
      success: true,
      receivedText: text,
      delayMs
    },
    200
  )
})

export default app
