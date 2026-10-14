/** Intent for one idempotent fulfilled-Appointment to parent-Encounter transition. */
export type CareJourneyTransition = Readonly<{
  idempotencyKey: string
  appointmentReference: string
  encounterEntryId: string
  subjectReference: string
  serviceProviderReference: string
  locationReference: string
  occurredAt: string
}>

/** Validates data only; it does not authorize access or create transport state. */
export function normalizeCareJourneyTransition(input: CareJourneyTransition): CareJourneyTransition {
  return Object.freeze({
    idempotencyKey: token(input.idempotencyKey, 'care_journey_idempotency_key_required'),
    appointmentReference: reference(input.appointmentReference, 'Appointment', 'care_journey_appointment_reference_invalid'),
    encounterEntryId: token(input.encounterEntryId, 'care_journey_encounter_entry_id_required'),
    subjectReference: reference(input.subjectReference, undefined, 'care_journey_subject_reference_invalid'),
    serviceProviderReference: reference(input.serviceProviderReference, 'Organization', 'care_journey_service_provider_reference_invalid'),
    locationReference: reference(input.locationReference, 'Location', 'care_journey_location_reference_invalid'),
    occurredAt: instant(input.occurredAt, 'care_journey_occurred_at_invalid'),
  })
}

/** Server-side emergency correlation; raw destinations and credentials are forbidden. */
export type EmergencyIntake = Readonly<{
  idempotencyKey: string
  serviceRequestEntryId: string
  triageTaskEntryId: string
  subjectReference: string
  requesterReference: string
  targetServiceReference: string
  triageOwnerReference: string
  jurisdiction: string
  receivedAt: string
  communicationThreadId: string
}>

export function normalizeEmergencyIntake(input: EmergencyIntake): EmergencyIntake {
  rejectForbiddenTransportKeys(input)
  return Object.freeze({
    idempotencyKey: token(input.idempotencyKey, 'emergency_intake_idempotency_key_required'),
    serviceRequestEntryId: token(input.serviceRequestEntryId, 'emergency_intake_service_request_entry_id_required'),
    triageTaskEntryId: token(input.triageTaskEntryId, 'emergency_intake_triage_task_entry_id_required'),
    subjectReference: reference(input.subjectReference, undefined, 'emergency_intake_subject_reference_invalid'),
    requesterReference: reference(input.requesterReference, undefined, 'emergency_intake_requester_reference_invalid'),
    targetServiceReference: referenceOneOf(input.targetServiceReference, ['HealthcareService', 'Organization'], 'emergency_intake_target_service_reference_invalid'),
    triageOwnerReference: reference(input.triageOwnerReference, 'Group', 'emergency_intake_triage_group_reference_invalid'),
    jurisdiction: normalizeJurisdiction(input.jurisdiction),
    receivedAt: instant(input.receivedAt, 'emergency_intake_received_at_invalid'),
    communicationThreadId: token(input.communicationThreadId, 'emergency_intake_communication_thread_id_required'),
  })
}

export type GovernedAlertCampaign = Readonly<{
  campaignId: string
  campaignKind: 'blood-donation' | 'public-risk'
  groupDefinitionReference: string
  requesterReference: string
  requiredSubscriptionTopicReference: string
  jurisdiction: string
  bloodGroupCodes?: readonly string[]
  minimumDaysSinceLastDonation?: number
  eligibilityCriteria?: readonly GovernedAlertEligibilityCriterion[]
  excludedSubjectReferences: readonly string[]
  preferredLanguages: readonly string[]
}>

/** One server-authorized FHIR SearchParameter predicate used to evaluate a definitional Group. */
export type GovernedAlertEligibilityCriterion = Readonly<{
  resourceType: string
  searchParameter: string
  value: string
}>

/** Normalizes the bounded donor filters configured by a governed campaign owner. */
export function normalizeGovernedAlertCampaign(input: GovernedAlertCampaign): GovernedAlertCampaign {
  if (input.campaignKind !== 'blood-donation' && input.campaignKind !== 'public-risk') {
    throw new TypeError('alert_campaign_kind_invalid')
  }
  const bloodGroupCodes = input.bloodGroupCodes === undefined
    ? undefined
    : unique(input.bloodGroupCodes.map(value => coding(value, 'alert_campaign_blood_group_code_invalid')))
  const eligibilityCriteria = input.eligibilityCriteria === undefined
    ? undefined
    : uniqueCriteria(input.eligibilityCriteria)
  if (input.minimumDaysSinceLastDonation !== undefined
    && (!Number.isInteger(input.minimumDaysSinceLastDonation) || input.minimumDaysSinceLastDonation < 1)) {
    throw new TypeError('alert_campaign_minimum_donation_days_invalid')
  }
  if (input.campaignKind === 'blood-donation'
    && (!bloodGroupCodes?.length || input.minimumDaysSinceLastDonation === undefined)) {
    throw new TypeError('alert_campaign_donation_filters_required')
  }
  if (input.campaignKind === 'public-risk' && !eligibilityCriteria?.length) {
    throw new TypeError('alert_campaign_eligibility_criteria_required')
  }
  return Object.freeze({
    campaignId: token(input.campaignId, 'alert_campaign_id_required'),
    campaignKind: input.campaignKind,
    groupDefinitionReference: reference(input.groupDefinitionReference, 'Group', 'alert_campaign_group_definition_reference_invalid'),
    requesterReference: reference(input.requesterReference, 'Organization', 'alert_campaign_requester_reference_invalid'),
    requiredSubscriptionTopicReference: reference(input.requiredSubscriptionTopicReference, 'SubscriptionTopic', 'alert_campaign_subscription_topic_reference_invalid'),
    jurisdiction: normalizeJurisdiction(input.jurisdiction),
    ...(bloodGroupCodes ? { bloodGroupCodes } : {}),
    ...(input.minimumDaysSinceLastDonation !== undefined ? { minimumDaysSinceLastDonation: input.minimumDaysSinceLastDonation } : {}),
    ...(eligibilityCriteria ? { eligibilityCriteria } : {}),
    excludedSubjectReferences: unique(input.excludedSubjectReferences.map(value => reference(value, undefined, 'alert_campaign_excluded_subject_reference_invalid'))),
    preferredLanguages: unique(input.preferredLanguages.map(normalizeLanguage)),
  })
}

export type GovernedAlertCohortSnapshot = Readonly<{
  campaignId: string
  groupDefinitionReference: string
  snapshotGroupReference: string
  evaluatedAt: string
  evaluationFingerprint: string
  eligibleSubjectReferences: readonly string[]
}>

/** Freezes an evaluation result; the snapshot itself is not delivery authority. */
export function freezeGovernedAlertCohort(input: Readonly<{
  campaign: GovernedAlertCampaign
  snapshotGroupReference: string
  evaluatedAt: string
  evaluationFingerprint: string
  eligibleSubjectReferences: readonly string[]
}>): GovernedAlertCohortSnapshot {
  const eligibleSubjectReferences = unique(input.eligibleSubjectReferences.map(value => reference(value, undefined, 'alert_cohort_subject_reference_invalid')), 'alert_cohort_subject_required')
  const excluded = new Set(input.campaign.excludedSubjectReferences)
  if (eligibleSubjectReferences.some(value => excluded.has(value))) throw new TypeError('alert_cohort_excluded_subject_forbidden')
  return Object.freeze({
    campaignId: input.campaign.campaignId,
    groupDefinitionReference: input.campaign.groupDefinitionReference,
    snapshotGroupReference: reference(input.snapshotGroupReference, 'Group', 'alert_cohort_snapshot_group_reference_invalid'),
    evaluatedAt: instant(input.evaluatedAt, 'alert_cohort_evaluated_at_invalid'),
    evaluationFingerprint: token(input.evaluationFingerprint, 'alert_cohort_evaluation_fingerprint_required'),
    eligibleSubjectReferences,
  })
}

export type GovernedAlertDeliveryAudit = Readonly<{
  campaignId: string
  snapshotGroupReference: string
  recipientReference: string
  communicationReference: string
  evaluatedAt: string
  eligibilityCurrent: boolean
  exclusionCurrent: boolean
  consentReference?: string
  channelAuthorizationReference?: string
  outcome: 'sent' | 'suppressed'
}>

/** Records checks; `sent` fails closed unless every current authority exists. */
export function recordGovernedAlertDelivery(input: GovernedAlertDeliveryAudit): GovernedAlertDeliveryAudit {
  if (input.outcome === 'sent') {
    if (!input.eligibilityCurrent) throw new TypeError('alert_delivery_eligibility_required')
    if (!input.exclusionCurrent) throw new TypeError('alert_delivery_exclusion_check_required')
    if (!input.consentReference) throw new TypeError('alert_delivery_consent_required')
    if (!input.channelAuthorizationReference) throw new TypeError('alert_delivery_channel_authorization_required')
  }
  return Object.freeze({
    campaignId: token(input.campaignId, 'alert_delivery_campaign_id_required'),
    snapshotGroupReference: reference(input.snapshotGroupReference, 'Group', 'alert_delivery_snapshot_group_reference_invalid'),
    recipientReference: reference(input.recipientReference, undefined, 'alert_delivery_recipient_reference_invalid'),
    communicationReference: reference(input.communicationReference, 'Communication', 'alert_delivery_communication_reference_invalid'),
    evaluatedAt: instant(input.evaluatedAt, 'alert_delivery_evaluated_at_invalid'),
    eligibilityCurrent: input.eligibilityCurrent === true,
    exclusionCurrent: input.exclusionCurrent === true,
    ...(input.consentReference ? { consentReference: reference(input.consentReference, 'Consent', 'alert_delivery_consent_reference_invalid') } : {}),
    ...(input.channelAuthorizationReference ? { channelAuthorizationReference: reference(input.channelAuthorizationReference, 'Consent', 'alert_delivery_channel_authorization_reference_invalid') } : {}),
    outcome: input.outcome,
  })
}

function rejectForbiddenTransportKeys(input: object): void {
  const forbidden = new Set(['phone', 'email', 'recipientEndpoint', 'sdp', 'ice', 'turnCredentials', 'encryptionKey'])
  if (Object.keys(input).some(key => forbidden.has(key))) throw new TypeError('emergency_intake_transport_state_forbidden')
}

function reference(value: unknown, expectedType: string | undefined, error: string): string {
  const normalized = token(value, error)
  const match = /^([A-Z][A-Za-z0-9]+)\/([A-Za-z0-9.-]{1,128})$/.exec(normalized)
  if (!match || (expectedType && match[1] !== expectedType)) throw new TypeError(error)
  return normalized
}

function referenceOneOf(value: unknown, expectedTypes: readonly string[], error: string): string {
  const normalized = reference(value, undefined, error)
  if (!expectedTypes.some(type => normalized.startsWith(`${type}/`))) throw new TypeError(error)
  return normalized
}

function uniqueCriteria(values: readonly GovernedAlertEligibilityCriterion[]): readonly GovernedAlertEligibilityCriterion[] {
  const criteria = values.map(value => {
    if (!value || typeof value !== 'object') throw new TypeError('alert_campaign_eligibility_criterion_invalid')
    const resourceType = token(value.resourceType, 'alert_campaign_eligibility_resource_type_invalid')
    const searchParameter = token(value.searchParameter, 'alert_campaign_eligibility_search_parameter_invalid')
    const criterionValue = requiredText(value.value, 'alert_campaign_eligibility_value_invalid')
    if (!/^[A-Z][A-Za-z0-9]+$/.test(resourceType)) throw new TypeError('alert_campaign_eligibility_resource_type_invalid')
    if (!/^[a-z][a-z0-9-]*$/.test(searchParameter)) throw new TypeError('alert_campaign_eligibility_search_parameter_invalid')
    return Object.freeze({ resourceType, searchParameter, value: criterionValue })
  })
  const byIdentity = new Map(criteria.map(value => [`${value.resourceType}\u0000${value.searchParameter}\u0000${value.value}`, value]))
  return Object.freeze([...byIdentity.values()])
}

function coding(value: unknown, error: string): string {
  const normalized = token(value, error)
  const separator = normalized.indexOf('|')
  if (separator < 1 || separator === normalized.length - 1 || normalized.indexOf('|', separator + 1) >= 0) throw new TypeError(error)
  return normalized
}

function instant(value: unknown, error: string): string {
  const normalized = token(value, error)
  if (!/^\d{4}-\d{2}-\d{2}T/.test(normalized) || Number.isNaN(Date.parse(normalized))) throw new TypeError(error)
  return normalized
}

function normalizeJurisdiction(value: unknown): string {
  const normalized = token(value, 'jurisdiction_invalid').toUpperCase()
  if (!/^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(normalized)) throw new TypeError('jurisdiction_invalid')
  return normalized
}

function normalizeLanguage(value: unknown): string {
  const normalized = token(value, 'alert_campaign_language_invalid')
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(normalized)) throw new TypeError('alert_campaign_language_invalid')
  return normalized
}

function unique(values: readonly string[], emptyError?: string): readonly string[] {
  const normalized = [...new Set(values)]
  if (emptyError && !normalized.length) throw new TypeError(emptyError)
  return Object.freeze(normalized)
}

function token(value: unknown, error: string): string {
  if (typeof value !== 'string' || !value.trim() || value.includes(',')) throw new TypeError(error)
  return value.trim()
}

function requiredText(value: unknown, error: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(error)
  return value.trim()
}
