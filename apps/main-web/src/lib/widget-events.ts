import type { Route, RouteExecutionUpdate } from '@lifi/widget';

export type WidgetExecutionEventName =
  | 'RouteExecutionStarted'
  | 'RouteExecutionCompleted'
  | 'RouteExecutionFailed';

type RouteLike = Record<string, unknown>;
type ProcessLike = Record<string, unknown>;

type WidgetExecutionFailedPayload = {
  route?: RouteLike;
  process?: ProcessLike;
};

export type WidgetExecutionEventLog = {
  event: WidgetExecutionEventName;
  route: RouteLike | null;
  process: ProcessLike | null;
};

export type WidgetTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type WidgetTransactionLog = {
  status: WidgetTransactionStatus;
  amount: string | null;
  transaction_id: string | null;
  from: string | null;
  to: string | null;
  walletAddress: string | null;
  timestamp: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const widgetEventMappers: Record<
  WidgetExecutionEventName,
  (event: Route | RouteExecutionUpdate) => WidgetExecutionEventLog
> = {
  RouteExecutionStarted: (event) => ({
    event: 'RouteExecutionStarted',
    route: isRecord(event) ? event : null,
    process: null,
  }),
  RouteExecutionCompleted: (event) => ({
    event: 'RouteExecutionCompleted',
    route: isRecord(event) ? event : null,
    process: null,
  }),
  RouteExecutionFailed: (event) => {
    const payload = isRecord(event) ? (event as WidgetExecutionFailedPayload) : null;

    return {
      event: 'RouteExecutionFailed',
      route: payload?.route && isRecord(payload.route) ? payload.route : null,
      process: payload?.process && isRecord(payload.process) ? payload.process : null,
    };
  },
};

const widgetTransactionStatusMap: Record<WidgetExecutionEventName, WidgetTransactionStatus> = {
  RouteExecutionStarted: 'PENDING',
  RouteExecutionCompleted: 'COMPLETED',
  RouteExecutionFailed: 'FAILED',
};

const getStringField = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value : null;

export const mapWidgetExecutionEvent = (
  eventName: WidgetExecutionEventName,
  event: Route | RouteExecutionUpdate,
) => widgetEventMappers[eventName](event);

export const mapWidgetExecutionEventToTransaction = (
  mappedEvent: WidgetExecutionEventLog,
  timestamp: number,
): WidgetTransactionLog => {
  const route = mappedEvent.route;
  const fromToken = route?.fromToken;
  const toToken = route?.toToken;

  return {
    status: widgetTransactionStatusMap[mappedEvent.event],
    amount: getStringField(route?.fromAmountUSD),
    transaction_id: getStringField(route?.id),
    from: isRecord(fromToken) ? getStringField(fromToken.symbol) : null,
    to: isRecord(toToken) ? getStringField(toToken.symbol) : null,
    walletAddress: getStringField(route?.fromAddress),
    timestamp,
  };
};
