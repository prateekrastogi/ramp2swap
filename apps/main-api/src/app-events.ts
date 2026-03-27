export type AppEventName = 'affiliate'

export type AffiliateAppEvent = {
  event: 'affiliate'
  username: string | null
  campaign: string | null
  timestamp: number
}

export type AppEventLog = AffiliateAppEvent

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getStringField = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const appEventMappers: Record<AppEventName, (event: unknown) => AppEventLog> = {
  affiliate: (event) => {
    const payload = isRecord(event) ? event : null

    return {
      event: 'affiliate',
      username: getStringField(payload?.username),
      campaign: getStringField(payload?.campaign),
      timestamp: Date.now()
    }
  }
}

export const isAppEventName = (value: string): value is AppEventName =>
  value in appEventMappers

export const mapAppEvent = (
  eventName: AppEventName,
  event: unknown
) => appEventMappers[eventName](event)
