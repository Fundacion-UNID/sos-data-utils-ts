import { STANDARD_DEVICE_CONTENT_EXPIRY_MINUTES } from './directed-message-delivery.data.js'

export { STANDARD_DEVICE_CONTENT_EXPIRY_MINUTES } from './directed-message-delivery.data.js'

/** Legal/business recipient selected before technical routing is resolved. */
export const DirectedMessageRecipientKind = Object.freeze({
  Individual: 'individual',
  AuthorizedPerson: 'authorized-person',
  ExplicitGroupMember: 'explicit-group-member',
  EmergencyService: 'emergency-service',
} as const)

/** Exact cryptographic delivery boundary. One route always names one target. */
export const DirectedMessageTargetKind = Object.freeze({
  ProfileDevice: 'profile-device',
  ServiceEndpoint: 'service-endpoint',
} as const)

/** User-visible scope used to resolve an explicit snapshot of authorized devices. */
export const DirectedMessageDeviceSelectionMode = Object.freeze({
  CurrentDevice: 'current-device',
  SelectedDevices: 'selected-devices',
  AllAuthorizedDevices: 'all-authorized-devices',
} as const)

/** Care-delivery setting of the selected emergency HealthcareService. */
export const EmergencyServiceDeliverySetting = Object.freeze({
  Mobile: 'mobile',
  Fixed: 'fixed',
} as const)

export type DirectedMessageRecipient =
  | Readonly<{
      kind: typeof DirectedMessageRecipientKind.Individual
      recipientReference: `Patient/${string}`
    }>
  | Readonly<{
      kind: typeof DirectedMessageRecipientKind.AuthorizedPerson
      recipientReference: `RelatedPerson/${string}`
    }>
  | Readonly<{
      kind: typeof DirectedMessageRecipientKind.ExplicitGroupMember
      groupReference: `Group/${string}`
      recipientReference: `Patient/${string}` | `RelatedPerson/${string}` | `PractitionerRole/${string}`
    }>
  | Readonly<{
      kind: typeof DirectedMessageRecipientKind.EmergencyService
      recipientReference: `HealthcareService/${string}`
      deliverySetting: typeof EmergencyServiceDeliverySetting[keyof typeof EmergencyServiceDeliverySetting]
    }>

export type DirectedMessageTarget =
  | Readonly<{
      kind: typeof DirectedMessageTargetKind.ProfileDevice
      /** Opaque recipient key identifier. It is not a telephone number or a clinical identity. */
      keyId: string
    }>
  | Readonly<{
      kind: typeof DirectedMessageTargetKind.ServiceEndpoint
      /** Opaque service-endpoint key identifier resolved from the admitted service offer. */
      keyId: string
    }>

export type DirectedMessageDeliveryInput = Readonly<{
  recipient: DirectedMessageRecipient
  target: DirectedMessageTarget
  issuedAt: string
  requestedContentLifetimeMinutes: number
  /** Provider policy can shorten, never lengthen, the sender's request. */
  serviceMaximumContentLifetimeMinutes?: number
  /** The selected device can impose a still shorter local-retention policy. */
  deviceMaximumContentLifetimeMinutes?: number
}>

export type DirectedMessageDelivery = Readonly<{
  recipient: Readonly<{
    kind: DirectedMessageRecipient['kind']
    /** FHIR Communication.recipient: exact Patient/RelatedPerson/HealthcareService or the intentional Group. */
    communicationRecipientReference: string
    /** Exact person, professional role or service for this single delivery receipt. Never a Group. */
    deliveryRecipientReference: string
    groupReference?: string
    serviceDeliverySetting?: typeof EmergencyServiceDeliverySetting[keyof typeof EmergencyServiceDeliverySetting]
  }>
  target: DirectedMessageTarget
  issuedAt: string
  expiresAt: string
  effectiveContentLifetimeMinutes: number
  contentPolicy: Readonly<{
    fanOut: 'forbidden'
    notificationPreview: 'hidden'
    deleteEncryptedContentAtExpiry: true
    retainContentFreeAudit: true
  }>
}>

type DirectedMessageProfileRecipient = Exclude<
  DirectedMessageRecipient,
  Readonly<{ kind: typeof DirectedMessageRecipientKind.EmergencyService }>
>

export type DirectedMessageDeviceAudience = Readonly<{
  recipient: DirectedMessageProfileRecipient
  deviceSelectionMode: typeof DirectedMessageDeviceSelectionMode[keyof typeof DirectedMessageDeviceSelectionMode]
  /** Explicit authorized snapshot. Even "all" is resolved by the server before calling this helper. */
  profileDeviceKeyIds: readonly string[]
}>

export type DirectedMessageAudienceDelivery = DirectedMessageDelivery & Readonly<{
  deviceSelectionMode: DirectedMessageDeviceAudience['deviceSelectionMode']
}>

export type DirectedMessageAudienceInput = Readonly<{
  audiences: readonly DirectedMessageDeviceAudience[]
  issuedAt: string
  requestedContentLifetimeMinutes: number
  serviceMaximumContentLifetimeMinutes?: number
  deviceMaximumContentLifetimeMinutes?: number
}>

const FHIR_ID = '[A-Za-z0-9.-]{1,64}'

function assertReference(value: string, resourceType: string, errorCode: string): void {
  if (!new RegExp(`^${resourceType}/${FHIR_ID}$`, 'u').test(value)) throw new TypeError(errorCode)
}
function positiveInteger(value: number | undefined, errorCode: string): number | undefined {
  if (value === undefined) return undefined
  if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(errorCode)
  return value
}

function exactTarget(input: DirectedMessageDeliveryInput): DirectedMessageTarget {
  const keyId = String(input.target.keyId || '').trim()
  if (!keyId || /\s/u.test(keyId)) throw new TypeError('directed_message_target_key_invalid')
  if (input.recipient.kind === DirectedMessageRecipientKind.EmergencyService) {
    if (input.target.kind !== DirectedMessageTargetKind.ServiceEndpoint) throw new TypeError('directed_message_service_target_invalid')
  } else if (input.target.kind !== DirectedMessageTargetKind.ProfileDevice) {
    throw new TypeError('directed_message_profile_device_target_invalid')
  }
  return Object.freeze({ ...input.target, keyId })
}

function exactRecipient(recipient: DirectedMessageRecipient): DirectedMessageDelivery['recipient'] {
  if (recipient.kind === DirectedMessageRecipientKind.Individual) {
    assertReference(recipient.recipientReference, 'Patient', 'directed_message_individual_reference_invalid')
    return Object.freeze({
      kind: recipient.kind,
      communicationRecipientReference: recipient.recipientReference,
      deliveryRecipientReference: recipient.recipientReference,
    })
  }
  if (recipient.kind === DirectedMessageRecipientKind.AuthorizedPerson) {
    assertReference(recipient.recipientReference, 'RelatedPerson', 'directed_message_authorized_person_reference_invalid')
    return Object.freeze({
      kind: recipient.kind,
      communicationRecipientReference: recipient.recipientReference,
      deliveryRecipientReference: recipient.recipientReference,
    })
  }
  if (recipient.kind === DirectedMessageRecipientKind.EmergencyService) {
    assertReference(recipient.recipientReference, 'HealthcareService', 'directed_message_emergency_service_reference_invalid')
    if (!Object.values(EmergencyServiceDeliverySetting).includes(recipient.deliverySetting)) {
      throw new TypeError('directed_message_emergency_service_delivery_setting_invalid')
    }
    return Object.freeze({
      kind: recipient.kind,
      communicationRecipientReference: recipient.recipientReference,
      deliveryRecipientReference: recipient.recipientReference,
      serviceDeliverySetting: recipient.deliverySetting,
    })
  }
  assertReference(recipient.groupReference, 'Group', 'directed_message_group_reference_invalid')
  if (!/^(?:Patient|RelatedPerson|PractitionerRole)\/[A-Za-z0-9.-]{1,64}$/u.test(recipient.recipientReference)) {
    throw new TypeError('directed_message_group_member_reference_invalid')
  }
  return Object.freeze({
    kind: recipient.kind,
    communicationRecipientReference: recipient.groupReference,
    deliveryRecipientReference: recipient.recipientReference,
    groupReference: recipient.groupReference,
  })
}

/**
 * Build one fail-closed delivery route for an already-authorized Communication.
 *
 * Authorization of the recipient, relationship, group membership, purpose and
 * selected key happens before this helper. This function deliberately cannot
 * expand a Group or discover another device: callers invoke it once for every
 * exact delivery receipt. Content expiry directs cooperating clients to erase
 * encrypted content and keys; it cannot prevent an already-compromised device
 * from taking an external copy. Audit metadata remains content-free.
 */
export function buildDirectedMessageDelivery(input: DirectedMessageDeliveryInput): DirectedMessageDelivery {
  const issuedAtMs = Date.parse(input.issuedAt)
  if (!Number.isFinite(issuedAtMs)) throw new TypeError('directed_message_issued_at_invalid')
  const lifetimes = [
    positiveInteger(input.requestedContentLifetimeMinutes, 'directed_message_content_lifetime_invalid'),
    positiveInteger(input.serviceMaximumContentLifetimeMinutes, 'directed_message_content_lifetime_invalid'),
    positiveInteger(input.deviceMaximumContentLifetimeMinutes, 'directed_message_content_lifetime_invalid'),
  ].filter((value): value is number => value !== undefined)
  const effectiveContentLifetimeMinutes = Math.min(...lifetimes)
  const expiresAt = new Date(issuedAtMs + effectiveContentLifetimeMinutes * 60_000).toISOString()

  return Object.freeze({
    recipient: exactRecipient(input.recipient),
    target: exactTarget(input),
    issuedAt: new Date(issuedAtMs).toISOString(),
    expiresAt,
    effectiveContentLifetimeMinutes,
    contentPolicy: Object.freeze({
      fanOut: 'forbidden' as const,
      notificationPreview: 'hidden' as const,
      deleteEncryptedContentAtExpiry: true as const,
      retainContentFreeAudit: true as const,
    }),
  })
}

/**
 * Expand an explicitly selected audience into independently encrypted routes.
 *
 * `all-authorized-devices` is never a discovery instruction. The server first
 * resolves and authorizes an atomic device snapshot, then passes those opaque
 * key identifiers here. A professional department, service or role Group may
 * be the operational sender or an explicitly selected functional recipient.
 * A recipient Group expands only to its authorized Patient, RelatedPerson or
 * PractitionerRole member snapshot. Duplicate devices fail closed to prevent
 * repeated delivery and accidental audience overlap.
 */
export function buildDirectedMessageAudienceDeliveries(
  input: DirectedMessageAudienceInput,
): readonly DirectedMessageAudienceDelivery[] {
  if (!Array.isArray(input.audiences) || input.audiences.length === 0) {
    throw new TypeError('directed_message_audience_required')
  }

  const usedKeyIds = new Set<string>()
  const deliveries: DirectedMessageAudienceDelivery[] = []
  for (const audience of input.audiences) {
    if (!Array.isArray(audience.profileDeviceKeyIds) || audience.profileDeviceKeyIds.length === 0) {
      throw new TypeError('directed_message_audience_devices_required')
    }
    if (
      audience.deviceSelectionMode === DirectedMessageDeviceSelectionMode.CurrentDevice
      && audience.profileDeviceKeyIds.length !== 1
    ) {
      throw new TypeError('directed_message_current_device_must_be_exact')
    }
    if (!Object.values(DirectedMessageDeviceSelectionMode).includes(audience.deviceSelectionMode)) {
      throw new TypeError('directed_message_device_selection_mode_invalid')
    }

    for (const keyId of audience.profileDeviceKeyIds) {
      const delivery = buildDirectedMessageDelivery({
        recipient: audience.recipient,
        target: { kind: DirectedMessageTargetKind.ProfileDevice, keyId },
        issuedAt: input.issuedAt,
        requestedContentLifetimeMinutes: input.requestedContentLifetimeMinutes,
        serviceMaximumContentLifetimeMinutes: input.serviceMaximumContentLifetimeMinutes,
        deviceMaximumContentLifetimeMinutes: input.deviceMaximumContentLifetimeMinutes,
      })
      if (usedKeyIds.has(delivery.target.keyId)) throw new TypeError('directed_message_duplicate_device_target')
      usedKeyIds.add(delivery.target.keyId)
      deliveries.push(Object.freeze({ ...delivery, deviceSelectionMode: audience.deviceSelectionMode }))
    }
  }
  return Object.freeze(deliveries)
}
