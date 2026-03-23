import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { callBoundRagAiService, type MainApiBindings } from './aisearch/client'

const app = new Hono<{ Bindings: MainApiBindings }>()

app.use(
  '*',
  cors({
    origin: ['http://localhost:1234', 'http://127.0.0.1:1234'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type']
  })
)

app.post('/intent', async (c) => {
  const body = await c.req.json<{ text?: unknown }>().catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (!text) {
    return c.json(
      {
        success: false,
        error: 'Intent text is required.'
      },
      400
    )
  }

  try {
    const result = await callBoundRagAiService(c.env, {
      query: text
    })

    const responsePayload = {
      success: true,
      receivedText: text,
      widgetFormValues: result.body.widgetFormValues
    }

    return c.json(
      responsePayload,
      200
    )
  } catch (error) {
    const fallbackResponse = {
      success: true,
      receivedText: text,
      widgetFormValues: {}
    }

    return c.json(
      fallbackResponse,
      200
    )
  }
})

export default app
