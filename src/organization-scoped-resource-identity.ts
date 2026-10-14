import { encodeMultibaseSha3 } from 'gdc-common-utils-ts/utils/multibasehash'

export type OrganizationScopedResourceKind = 'department' | 'service' | 'place' | 'schedule'

export type OrganizationScopedResourceIdentity = Readonly<{
  /** Exact canonical URN persisted as the logical Identifier. */
  identifier: string
  /** Bounded FHIR Resource.id derived from the exact Identifier bytes. */
  id: string
}>

type OrganizationScopedResourceUrnInput = Readonly<{
  parentUrn: string
  kind: OrganizationScopedResourceKind
  resourceUuid: string
}>

type ScheduleSlotIdentityInput = Readonly<{
  scheduleUrn: string
  /** FHIR instant with an explicit UTC offset. Fractional seconds are discarded. */
  start: string
  /** FHIR instant with an explicit UTC offset. Fractional seconds are discarded. */
  end: string
}>

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
const FHIR_ID_PATTERN = /^[A-Za-z0-9\-.]{1,64}$/u
const CDS_ORGANIZATION_URN_SOURCE = 'urn:cds-[a-z]{2}(?:-[a-z0-9]{2,3})?:v[1-9][0-9]*:organization:[a-z][a-z0-9-]*:[^:]+'

const kindSuffix = (kind: OrganizationScopedResourceKind): string =>
  `:${kind}:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}`

const parentPattern = (kind: OrganizationScopedResourceKind): RegExp => {
  const organization = CDS_ORGANIZATION_URN_SOURCE
  const department = `${organization}${kindSuffix('department')}`
  const service = `${department}${kindSuffix('service')}`
  if (kind === 'department') return new RegExp(`^${organization}$`, 'u')
  if (kind === 'service' || kind === 'place') return new RegExp(`^${department}$`, 'u')
  return new RegExp(`^${service}$`, 'u')
}

/**
 * Builds the canonical, host-independent URN of a resource owned by a legal
 * organization. The hierarchy is identity; Location, Device and
 * PractitionerRole assignments remain independent claims.
 */
export function buildOrganizationScopedResourceUrn(
  input: OrganizationScopedResourceUrnInput,
): string {
  const parentUrn = String(input.parentUrn ?? '').trim()
  const resourceUuid = String(input.resourceUuid ?? '').trim().toLowerCase()
  if (!parentPattern(input.kind).test(parentUrn)) {
    throw new TypeError('organization_scoped_resource_parent_invalid')
  }
  if (!UUID_PATTERN.test(resourceUuid)) {
    throw new TypeError('organization_scoped_resource_uuid_invalid')
  }
  return `${parentUrn}:${input.kind}:${resourceUuid}`
}

/** Derives a FHIR-safe id as multibase(base58btc(multihash(SHA3-256(URN)))). */
export function deriveFhirResourceIdFromUrn(identifier: string): string {
  const normalizedIdentifier = String(identifier ?? '').trim()
  if (!normalizedIdentifier.startsWith('urn:')) {
    throw new TypeError('organization_scoped_resource_identifier_invalid')
  }
  const id = encodeMultibaseSha3(normalizedIdentifier, 256)
  if (!FHIR_ID_PATTERN.test(id)) {
    throw new TypeError('organization_scoped_resource_fhir_id_invalid')
  }
  return id
}

/** Returns the full logical Identifier and its deterministic bounded FHIR id. */
export function buildOrganizationScopedResourceIdentity(
  input: OrganizationScopedResourceUrnInput,
): OrganizationScopedResourceIdentity {
  const identifier = buildOrganizationScopedResourceUrn(input)
  return Object.freeze({ identifier, id: deriveFhirResourceIdFromUrn(identifier) })
}

const epochSeconds = (instant: string): number => {
  const normalized = String(instant ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(normalized)) {
    throw new TypeError('schedule_slot_instant_invalid')
  }
  const epochMilliseconds = Date.parse(normalized)
  if (!Number.isFinite(epochMilliseconds)) throw new TypeError('schedule_slot_instant_invalid')
  return Math.floor(epochMilliseconds / 1000)
}

/**
 * Builds a Slot identity from its Schedule and one second-precision interval
 * segment: `<scheduleUrn>:slot:<startEpochSeconds>-<endEpochSeconds>`.
 */
export function buildScheduleSlotIdentity(
  input: ScheduleSlotIdentityInput,
): OrganizationScopedResourceIdentity {
  const scheduleUrn = String(input.scheduleUrn ?? '').trim()
  const organization = CDS_ORGANIZATION_URN_SOURCE
  const schedulePattern = new RegExp(
    `^${organization}${kindSuffix('department')}${kindSuffix('service')}${kindSuffix('schedule')}$`,
    'u',
  )
  if (!schedulePattern.test(scheduleUrn)) throw new TypeError('schedule_slot_parent_invalid')
  const startEpochSeconds = epochSeconds(input.start)
  const endEpochSeconds = epochSeconds(input.end)
  if (endEpochSeconds <= startEpochSeconds) throw new TypeError('schedule_slot_interval_invalid')
  const identifier = `${scheduleUrn}:slot:${startEpochSeconds}-${endEpochSeconds}`
  return Object.freeze({ identifier, id: deriveFhirResourceIdFromUrn(identifier) })
}
