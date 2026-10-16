export type GatewayApplicationIdentity = Readonly<{
  appId: string
  appVersion?: string
}>

/** Converts a stable portal URL to the reverse-DNS AppId expected by SOS GW. */
export function normalizeGatewayApplicationId(value: string): string {
  const source = String(value || '').trim()
  if (!source) throw new TypeError('gateway_application_id_invalid')
  if (!source.includes('://')) return source
  let url: URL
  try {
    url = new URL(source)
  } catch {
    throw new TypeError('gateway_application_id_invalid')
  }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new TypeError('gateway_application_url_insecure')
  }
  const labels = url.hostname.toLowerCase().split('.').filter(Boolean)
  if (labels.length < 2) throw new TypeError('gateway_application_id_invalid')
  return labels.reverse().join('.')
}

/** Builds the two stable application headers shared by portal BFF clients. */
export function buildGatewayApplicationHeaders(
  identity: GatewayApplicationIdentity,
): Readonly<{ AppId: string; AppVersion: string }> {
  const appVersion = String(identity.appVersion || '').trim() || 'v1.0'
  return Object.freeze({
    AppId: normalizeGatewayApplicationId(identity.appId),
    AppVersion: appVersion,
  })
}
