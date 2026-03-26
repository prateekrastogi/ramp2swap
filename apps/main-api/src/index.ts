import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { callBoundRagAiService, type MainApiBindings } from './aisearch/client'
import { mockTransactions } from './mock-transactions'
import {
  isWidgetExecutionEventName,
  mapWidgetExecutionEvent,
  mapWidgetExecutionEventToTransaction,
} from './widget-events'

const app = new Hono<{ Bindings: MainApiBindings }>()

const MOCK_TRANSACTION_LOG_INTERVAL_MS = 30_000
const globalLoggerState = globalThis as typeof globalThis & {
  __lastMockTransactionLogAt__?: number
}

const logMockTransactionsIfDue = () => {
  const now = Date.now()
  const lastLoggedAt = globalLoggerState.__lastMockTransactionLogAt__ ?? 0

  if (now - lastLoggedAt < MOCK_TRANSACTION_LOG_INTERVAL_MS) {
    return
  }

  globalLoggerState.__lastMockTransactionLogAt__ = now
  console.log('[Mock Transactions]', mockTransactions)
}

app.use(
  '*',
  cors({
    origin: ['http://localhost:1234', 'http://127.0.0.1:1234'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type']
  })
)

app.use('*', async (_c, next) => {
  logMockTransactionsIfDue()
  await next()
})

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

app.post('/widget-event', async (c) => {
  const body = await c.req.json<{ eventName?: unknown; event?: unknown }>().catch(() => null)
  const eventName = typeof body?.eventName === 'string' ? body.eventName.trim() : ''

  if (!eventName || !isWidgetExecutionEventName(eventName)) {
    return c.json(
      {
        success: false,
        error:
          'eventName is required and must be one of RouteExecutionStarted, RouteExecutionCompleted, or RouteExecutionFailed.'
      },
      400
    )
  }

  const mappedEvent = mapWidgetExecutionEvent(eventName, body?.event)
  const transaction = mapWidgetExecutionEventToTransaction(mappedEvent, Date.now())

  console.log(`[LI.FI Widget Event] ${mappedEvent.event}`, {
    event: mappedEvent,
    transaction
  })

  return c.json(
    {
      success: true
    },
    200
  )
})

export default app
