import systemPrompt from './system-prompt'

type AutoRagAiSearchParams = {
  query: string
  model?: string
  system_prompt?: string
  rewrite_query?: boolean
  max_num_results?: number
  ranking_options?: {
    score_threshold?: number
  }
  reranking?: {
    enabled?: boolean
    model?: string
  }
  stream?: boolean
}

export type AiSearchRequestPayload = {
  query: string
  model?: string
  max_num_results?: number
  rewrite_query?: boolean
  timeoutMs?: number
}

export type WidgetFormValues = Partial<{
  fromAmount: string
  fromChain: number
  fromToken: string
  toChain: number
  toToken: string
  toAddress: string
}>

export type WidgetFormValuesResponse = {
  widgetFormValues: WidgetFormValues
}

type AutoRagService = {
  aiSearch(params: AutoRagAiSearchParams): Promise<unknown>
}

type AiBinding = {
  autorag(name: string): AutoRagService
}

type ServiceBinding = {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>
}

export type MainApiBindings = {
  AI?: AiBinding
  RAG_AI_NAME?: string
  PARTNER_API_BASE_URL?: string
  PARTNER_API?: ServiceBinding
  AI_SEARCH_TIMEOUT_MS?: string
}

const DEFAULT_RAG_AI_NAME = 'rag-ai'
const DEFAULT_GENERATION_MODEL = '@cf/zai-org/glm-4.7-flash'
const FALLBACK_AI_SEARCH_TIMEOUT_MS = 25_000

export function getAiSearchName(env: MainApiBindings) {
  const configuredName = env.RAG_AI_NAME?.trim()
  if (!configuredName) {
    return DEFAULT_RAG_AI_NAME
  }

  return configuredName
}

export function buildRagAiPayload(payload: AiSearchRequestPayload) {
  return {
    query: payload.query,
    system_prompt: buildRuntimeSystemPrompt(),
    model: payload.model ?? DEFAULT_GENERATION_MODEL,
    rewrite_query: payload.rewrite_query ?? true,
    max_num_results: payload.max_num_results ?? 6,
    ranking_options: {
      score_threshold: 0.2
    },
    reranking: {
      enabled: true,
      model: '@cf/baai/bge-reranker-base'
    },
    stream: false
  }
}

function buildRuntimeSystemPrompt() {
  return [
    systemPrompt,
    '',
    'RUNTIME INSTRUCTIONS:',
    '- The active user request is provided only in the query field for this call.',
    '- Parse only the current query for this request.',
    '- Never copy example values unless the current query matches them exactly.',
    '- Proactively scan the user request for every possible widgetFormValues field, including phrasing variants for source, destination, amount, token, chain, and address.',
    '- If a field is not explicitly present or cannot be grounded from retrieval, omit it.',
    '- Eagerly compute and return every grounded widgetFormValues field independently: fromAmount, fromChain, fromToken, toChain, toToken, and toAddress.',
    '- Always attempt a best-effort grounded fill for fromChain, fromToken, toChain, and toToken; include fromAmount and toAddress when the request gives a grounded amount or wallet address.',
    '- Omit only the specific fields that are clearly missing from the request or cannot be safely grounded from retrieval.',
    '- Return only strict JSON with a top-level "widgetFormValues" object.'
  ].join('\n')
}

export async function callBoundRagAiService(env: MainApiBindings, payload: AiSearchRequestPayload) {
  if (!env.AI) {
    throw new Error('Missing Cloudflare AI binding `AI` in main-api.')
  }

  const requestBody = buildRagAiPayload(payload)
  const ragAiName = getAiSearchName(env)
  
  // Use environment variable if present, otherwise fall back to code constant
  const envTimeout = env.AI_SEARCH_TIMEOUT_MS ? parseInt(env.AI_SEARCH_TIMEOUT_MS, 10) : undefined
  const finalTimeoutMs = payload.timeoutMs ?? envTimeout ?? FALLBACK_AI_SEARCH_TIMEOUT_MS

  const rawBody = await waitForAiSearch(
    env.AI.autorag(ragAiName).aiSearch(requestBody),
    finalTimeoutMs
  )

  const parsedBody = extractWidgetFormValuesResponse(rawBody)

  return {
    ok: true,
    status: 200,
    body: parsedBody
  }
}

function waitForAiSearch<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`AI Search request timed out after ${timeoutMs}ms.`))
      }, timeoutMs)
    })
  ]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}

export function extractWidgetFormValuesResponse(value: unknown): WidgetFormValuesResponse {
  const direct = asWidgetFormValuesResponse(value)
  if (direct) {
    return direct
  }

  if (isRecord(value)) {
    const nestedResponse = parseUnknownJson(value.response)
    const fromResponse = asWidgetFormValuesResponse(nestedResponse)
    if (fromResponse) {
      return fromResponse
    }

    const nestedResult = parseUnknownJson(value.result)
    const fromResult = asWidgetFormValuesResponse(nestedResult)
    if (fromResult) {
      return fromResult
    }
  }

  return {
    widgetFormValues: {}
  }
}

function asWidgetFormValuesResponse(value: unknown): WidgetFormValuesResponse | null {
  if (!isRecord(value)) {
    return null
  }

  const candidate = value.widgetFormValues
  if (!isRecord(candidate)) {
    return null
  }

  return {
    widgetFormValues: sanitizeWidgetFormValues(candidate)
  }
}

function sanitizeWidgetFormValues(value: Record<string, unknown>): WidgetFormValues {
  const widgetFormValues: WidgetFormValues = {}

  if (typeof value.fromAmount === 'string') {
    widgetFormValues.fromAmount = value.fromAmount
  }

  if (typeof value.fromChain === 'number') {
    widgetFormValues.fromChain = value.fromChain
  }

  if (typeof value.fromToken === 'string') {
    widgetFormValues.fromToken = value.fromToken
  }

  if (typeof value.toChain === 'number') {
    widgetFormValues.toChain = value.toChain
  }

  if (typeof value.toToken === 'string') {
    widgetFormValues.toToken = value.toToken
  }

  if (typeof value.toAddress === 'string') {
    widgetFormValues.toAddress = value.toAddress
  }

  return widgetFormValues
}

function parseUnknownJson(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
