import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { callBoundRagAiService, type MainApiBindings } from './aisearch/client'
import { isAppEventName, mapAppEvent } from './app-events'
import {
  isWidgetExecutionEventName,
  mapWidgetTransaction,
} from './widget-events'
import { getRequestCountry } from './lib/request-country'

const app = new Hono<{ Bindings: MainApiBindings }>()
const DEFAULT_LOCAL_PARTNER_API_ORIGIN = 'http://127.0.0.1:8787'

function getPartnerApiBaseUrl(env: MainApiBindings) {
  const configuredBaseUrl = env.PARTNER_API_BASE_URL?.trim()
  return configuredBaseUrl && configuredBaseUrl.length > 0
    ? configuredBaseUrl.replace(/\/$/, '')
    : DEFAULT_LOCAL_PARTNER_API_ORIGIN
}

async function forwardTransactionToPartnerApi(
  env: MainApiBindings,
  transaction: unknown
) {
  try {
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(transaction)
    }

    if (env.PARTNER_API) {
      await env.PARTNER_API.fetch('https://partner-api/transaction', init)
      return
    }

    await fetch(`${getPartnerApiBaseUrl(env)}/transaction`, init)
  } catch {}
}

async function forwardAffiliateClickToPartnerApi(
  env: MainApiBindings,
  payload: unknown
) {
  try {
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    }

    if (env.PARTNER_API) {
      await env.PARTNER_API.fetch('https://partner-api/click', init)
      return
    }

    await fetch(`${getPartnerApiBaseUrl(env)}/click`, init)
  } catch {}
}

async function forwardConversionToPartnerApi(
  env: MainApiBindings,
  payload: unknown
) {
  try {
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    }

    if (env.PARTNER_API) {
      await env.PARTNER_API.fetch('https://partner-api/conversion', init)
      return
    }

    await fetch(`${getPartnerApiBaseUrl(env)}/conversion`, init)
  } catch {}
}

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

app.post('/widget-event', async (c) => {
  const body = await c.req.json<{ eventName?: unknown; transaction?: unknown }>().catch(() => null)
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

  const transaction = mapWidgetTransaction(body?.transaction)

  c.executionCtx.waitUntil(forwardTransactionToPartnerApi(c.env, transaction))

  return c.json(
    {
      success: true
    },
    200
  )
})

app.post('/app-event', async (c) => {
  const body = await c.req.json<{ event?: unknown }>().catch(() => null)
  const eventName = typeof body?.event === 'string' ? body.event.trim() : ''

  if (!eventName || !isAppEventName(eventName)) {
    return c.json(
      {
        success: false,
        error:
          'eventName is required and must be one of the supported app event types.'
      },
      400
    )
  }

  const country = getRequestCountry(c.req.raw)
  const mappedEvent = mapAppEvent(eventName, {
    ...(body ?? {}),
    country
  })

  if (mappedEvent.event === 'affiliate') {
    c.executionCtx.waitUntil(forwardAffiliateClickToPartnerApi(c.env, mappedEvent))
  }

  if (mappedEvent.event === 'conversion') {
    c.executionCtx.waitUntil(forwardConversionToPartnerApi(c.env, mappedEvent))
  }

  console.log(`[App Event] ${mappedEvent.event}`, {
    ...mappedEvent
  })

  return c.json(
    {
      success: true
    },
    200
  )
})

export default app
