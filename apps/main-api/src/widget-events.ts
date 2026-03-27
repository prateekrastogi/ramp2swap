export type WidgetExecutionEventName =
  | 'RouteExecutionStarted'
  | 'RouteExecutionCompleted'
  | 'RouteExecutionFailed'

export type WidgetTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

export type WidgetTransactionLog = {
  status: WidgetTransactionStatus
  amount: string | null
  transaction_id: string | null
  from: string | null
  to: string | null
  walletAddress: string | null
  timestamp: number
}

export const isWidgetExecutionEventName = (
  value: string
): value is WidgetExecutionEventName => value in widgetEventMappers

const widgetEventMappers: Record<WidgetExecutionEventName, true> = {
  RouteExecutionStarted: true,
  RouteExecutionCompleted: true,
  RouteExecutionFailed: true
}

const isWidgetTransactionStatus = (value: unknown): value is WidgetTransactionStatus =>
  value === 'PENDING' || value === 'COMPLETED' || value === 'FAILED'

const getStringField = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const getNullableStringField = (value: unknown) =>
  value === null ? null : getStringField(value)

export const mapWidgetTransaction = (value: unknown): WidgetTransactionLog => {
  const payload =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

  return {
    status: isWidgetTransactionStatus(payload.status) ? payload.status : 'FAILED',
    amount: getNullableStringField(payload.amount),
    transaction_id: getNullableStringField(payload.transaction_id),
    from: getNullableStringField(payload.from),
    to: getNullableStringField(payload.to),
    walletAddress: getNullableStringField(payload.walletAddress),
    timestamp: typeof payload.timestamp === 'number' && Number.isFinite(payload.timestamp)
      ? payload.timestamp
      : Date.now()
  }
}
