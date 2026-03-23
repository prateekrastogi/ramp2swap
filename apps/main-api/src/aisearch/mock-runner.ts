import { callBoundRagAiService, type MainApiBindings } from './client'
import { MOCK_AI_SEARCH_CASES } from './mock-queries'

type ExecutionContextLike = {
  waitUntil(promise: Promise<unknown>): void
}

const DEFAULT_INTERVAL_MS = 60_000

let startupRunTriggered = false
let repeatingRunRegistered = false

export function ensureAiSearchMockRunner(env: MainApiBindings, executionContext: ExecutionContextLike) {
  if (!startupRunTriggered) {
    startupRunTriggered = true
    executionContext.waitUntil(runMockQueries(env, 'startup'))
  }

  if (!repeatingRunRegistered) {
    repeatingRunRegistered = true

    setInterval(() => {
      void runMockQueries(env, 'interval')
    }, DEFAULT_INTERVAL_MS)
  }
}

export async function runMockQueries(env: MainApiBindings, reason: 'startup' | 'interval' | 'manual') {
  console.log('[main-api] Starting AI Search mock run', {
    reason,
    cases: MOCK_AI_SEARCH_CASES.length
  })

  for (const mockCase of MOCK_AI_SEARCH_CASES) {
    const startedAt = Date.now()

    try {
      const result = await callBoundRagAiService(env, {
        query: mockCase.query
      })

      console.log(
        `[main-api] AI Search mock response\n${JSON.stringify(
          {
            reason,
            caseId: mockCase.id,
            query: mockCase.query,
            durationMs: Date.now() - startedAt,
            status: result.status,
            widgetFormValues: result.body.widgetFormValues
          },
          null,
          2
        )}`
      )
    } catch (error) {
      console.error(
        `[main-api] AI Search mock response failed\n${JSON.stringify(
          {
            reason,
            caseId: mockCase.id,
            query: mockCase.query,
            durationMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error)
          },
          null,
          2
        )}`
      )
    }
  }
}
