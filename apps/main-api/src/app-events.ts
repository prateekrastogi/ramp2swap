export type AppEventName = 'affiliate' | 'conversion'

export type AffiliateAppEvent = {
  event: 'affiliate'
  username: string | null
  campaign: string | null
  country: string | null
  timestamp: number
}

export type ConversionAppEvent = {
  event: 'conversion'
  transaction_id: string | null
  username: string | null
  campaign: string | null
  country: string | null
  timestamp: number
}

export type AppEventLog = AffiliateAppEvent | ConversionAppEvent

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getStringField = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const getNullableCountry = (value: unknown) => {
  const country = getStringField(value)?.toUpperCase() ?? null
  return country && /^[A-Z]{2}$/.test(country) ? country : null
}

const appEventMappers: Record<AppEventName, (event: unknown) => AppEventLog> = {
  affiliate: (event) => {
    const payload = isRecord(event) ? event : null

    return {
      event: 'affiliate',
      username: getStringField(payload?.username),
      campaign: getStringField(payload?.campaign),
      country: getNullableCountry(payload?.country),
      timestamp: Date.now()
    }
  },
  conversion: (event) => {
    const payload = isRecord(event) ? event : null

    return {
      event: 'conversion',
      transaction_id: getStringField(payload?.transaction_id),
      username: getStringField(payload?.username),
      campaign: getStringField(payload?.campaign),
      country: getNullableCountry(payload?.country),
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
