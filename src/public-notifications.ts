import { communicationRequestFormDataToFlatClaims } from 'fhir-data-utils-ts/data';

export const PublicNotificationStatuses = Object.freeze(['active', 'cancelled', 'expired'] as const);
export type PublicNotificationStatus = (typeof PublicNotificationStatuses)[number];

export const PublicNotificationDeliveryChannels = Object.freeze(['web', 'push', 'email', 'sms'] as const);
export type PublicNotificationDeliveryChannel = (typeof PublicNotificationDeliveryChannels)[number];

export const PublicNotificationClaim = Object.freeze({
  Identifier: 'PublicNotification.identifier', DatasetName: 'PublicNotification.datasetName',
  IssuerReference: 'PublicNotification.issuerReference', IssuerName: 'PublicNotification.issuerName',
  Subject: 'PublicNotification.subject', BodyMarkdown: 'PublicNotification.bodyMarkdown',
  Attachment: 'PublicNotification.attachment', Location: 'PublicNotification.location',
  PublishedAt: 'PublicNotification.publishedAt', ValidUntil: 'PublicNotification.validUntil',
  Status: 'PublicNotification.status',
} as const);

export const PublicNotificationAttachmentClaim = Object.freeze({
  Identifier: 'PublicNotificationAttachment.identifier', FileName: 'PublicNotificationAttachment.fileName',
  MediaType: 'PublicNotificationAttachment.mediaType', SizeBytes: 'PublicNotificationAttachment.sizeBytes',
  ContentData: 'PublicNotificationAttachment.contentData', Sha256: 'PublicNotificationAttachment.sha256',
  Issuer: 'PublicNotificationAttachment.issuer', CreatedAt: 'PublicNotificationAttachment.createdAt',
} as const);

export const AnimalPublicServiceSpecies = Object.freeze({ Dog: 'dog', Cat: 'cat' } as const);
export type AnimalPublicServiceSpeciesValue =
  typeof AnimalPublicServiceSpecies[keyof typeof AnimalPublicServiceSpecies];

export const AnimalPublicServicePurposes = Object.freeze({
  EmergencyCare: 'emergency',
  BloodDonation: 'blood-donation',
} as const);
export type AnimalPublicServicePurpose =
  typeof AnimalPublicServicePurposes[keyof typeof AnimalPublicServicePurposes];

export type AnimalPublicServiceMarketplaceQuery = Readonly<{
  subjectKind: 'animal';
  species: AnimalPublicServiceSpeciesValue;
  purpose: AnimalPublicServicePurpose;
  jurisdiction: string;
  near?: Readonly<{ latitude: number; longitude: number; radiusKm: number }>;
}>;

export type PublicNotificationRecord = Readonly<{
  notificationId: string;
  datasetName: string;
  issuerReference: string;
  issuerName: string;
  subject: string;
  bodyMarkdown: string;
  attachments: readonly NotificationAttachment[];
  locations: readonly string[];
  publishedAt: string;
  validUntil: string;
  status: PublicNotificationStatus;
}>;

export const NotificationAttachmentMediaTypes = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const);
export type NotificationAttachmentMediaType = (typeof NotificationAttachmentMediaTypes)[number];

export type NotificationAttachment = Readonly<{
  attachmentId: string;
  fileName: string;
  mediaType: NotificationAttachmentMediaType;
  sizeBytes: number;
  contentReference: string;
  sha256: string;
}>;

export const NotificationAddressedPurposes = Object.freeze(['care-instructions', 'care-transition'] as const);
export type NotificationAddressedPurpose = (typeof NotificationAddressedPurposes)[number];

export type NotificationComposerAudience =
  | Readonly<{ mode: 'addressed'; subjectReference: string; purpose: NotificationAddressedPurpose }>
  | Readonly<{ mode: 'public-dataset'; datasetName: string }>;

export const PublicAlertPriorities = Object.freeze(['routine', 'urgent', 'asap', 'stat'] as const);
export type PublicAlertPriority = (typeof PublicAlertPriorities)[number];

export type NotificationComposerDraft = Readonly<{
  audience: NotificationComposerAudience;
  subject: string;
  bodyMarkdown: string;
  attachments: readonly NotificationAttachment[];
  priority?: PublicAlertPriority;
  validUntil?: string;
}>;

export type PublicAlertFormData = Readonly<{
  datasetName: string;
  subject: string;
  bodyMarkdown: string;
  priority: PublicAlertPriority;
  validUntil: string;
  attachments: readonly NotificationAttachment[];
}>;

/** Browser-editable fields only. Identity, authority and recipient Endpoint are server-owned. */
export const PUBLIC_ALERT_FORM_SCHEMA = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://globaldatacare.com/schemas/sos/public-alert-form.json',
  title: 'Public alert',
  type: 'object',
  additionalProperties: false,
  required: Object.freeze(['datasetName', 'subject', 'bodyMarkdown', 'priority', 'validUntil', 'attachments']),
  properties: Object.freeze({
    datasetName: Object.freeze({ type: 'string', minLength: 1 }),
    subject: Object.freeze({ type: 'string', minLength: 1, maxLength: 160 }),
    bodyMarkdown: Object.freeze({ type: 'string', minLength: 1, maxLength: 20_000 }),
    priority: Object.freeze({ type: 'string', enum: PublicAlertPriorities }),
    validUntil: Object.freeze({ type: 'string', format: 'date-time' }),
    attachments: Object.freeze({ type: 'array', maxItems: 8, items: Object.freeze({ type: 'object' }) }),
  }),
});

export type PublicAlertCommunicationRequestAuthority = Readonly<{
  identifier: string;
  status: 'draft' | 'active';
  intent: 'proposal' | 'order';
  subjectGroupReference: string;
  requesterPractitionerRoleReference: string;
  recipientTopicEndpointReference: string;
  informationProviderReference: string;
  authoredOn: string;
  payloadDocumentReference: string;
}>;

/** Explicit non-FHIR routing metadata kept separate from the standard claim catalogue. */
export const PublicAlertOperationalClaim = Object.freeze({
  DatasetName: 'CommunicationRequest.public-dataset',
} as const);

/**
 * Converts the schema-driven public editor into standard CommunicationRequest
 * flat claims after the BFF has supplied every authority-bearing reference.
 */
export function publicAlertFormDataToCommunicationRequestFlatClaims(
  input: PublicAlertFormData,
  authority: PublicAlertCommunicationRequestAuthority,
): Readonly<Record<string, string | undefined>> {
  const draft = normalizeNotificationComposerDraft({
    audience: { mode: 'public-dataset', datasetName: input.datasetName },
    subject: input.subject,
    bodyMarkdown: input.bodyMarkdown,
    attachments: input.attachments,
  });
  if (!PublicAlertPriorities.includes(input.priority)) throw new TypeError('public_alert_priority_invalid');
  const validUntil = isoInstant(input.validUntil, 'public_alert_valid_until_invalid');
  const authoredOn = isoInstant(authority.authoredOn, 'public_alert_authored_on_invalid');
  if (Date.parse(validUntil) <= Date.parse(authoredOn)) throw new TypeError('public_alert_valid_until_invalid');
  if ((authority.status === 'draft') !== (authority.intent === 'proposal')) {
    throw new TypeError('public_alert_approval_state_invalid');
  }
  const claims = communicationRequestFormDataToFlatClaims({
    identifier: requiredToken(authority.identifier, 'public_alert_identifier_required'),
    status: authority.status,
    intent: authority.intent,
    priority: input.priority,
    category: 'http://terminology.hl7.org/CodeSystem/communication-category|notification',
    subject: authority.subjectGroupReference,
    requester: authority.requesterPractitionerRoleReference,
    recipients: [authority.recipientTopicEndpointReference],
    informationProviders: [authority.informationProviderReference],
    authoredOn,
    occurrencePeriodStart: authoredOn,
    occurrencePeriodEnd: validUntil,
    payloadReference: authority.payloadDocumentReference,
    about: draft.attachments.map((attachment) => attachment.contentReference),
    note: draft.subject,
  });
  return Object.freeze({
    ...claims,
    [PublicAlertOperationalClaim.DatasetName]: input.datasetName,
  });
}

export type PublicNotificationMute = Readonly<{
  scope: 'dataset' | 'issuer';
  value: string;
  until: string;
}>;

export type PublicNotificationPreferences = Readonly<{
  subscribedDatasetNames: readonly string[];
  excludedIssuerReferences: readonly string[];
  mutes: readonly PublicNotificationMute[];
  preferredDeliveryChannels: readonly PublicNotificationDeliveryChannel[];
  maximumDistanceKm?: number;
  minimumDaysSinceLastDonation?: number;
}>;

export type PublicNotificationSuppressionReason =
  | 'not-subscribed'
  | 'inactive'
  | 'expired'
  | 'issuer-excluded'
  | 'muted'
  | 'outside-distance'
  | 'donation-interval'
  | 'no-delivery-channel';

export type PublicNotificationDeliveryDecision = Readonly<{
  deliver: boolean;
  reasons: readonly PublicNotificationSuppressionReason[];
  deliveryChannels: readonly PublicNotificationDeliveryChannel[];
}>;

const DATASET_PATTERNS = Object.freeze([
  /^[a-z]{2}(?:-[a-z0-9]+)+_health-care_public_blood-donation_whole-blood_(?:a|b|ab|o)-rh-(?:positive|negative)$/,
  /^[a-z]{2}(?:-[a-z0-9]+)+_health-care_public_blood-donation_(?:plasmapheresis|plateletpheresis)$/,
  /^[a-z]{2}(?:-[a-z0-9]+)+_animal-care_public_veterinary_(?:dog|cat)_(?:alert|notification|reminder|instruction)$/,
  /^[a-z]{2}(?:-[a-z0-9]+)+_animal-care_public_blood-donation_(?:dog|cat)_(?:alert|notification|reminder|instruction)$/,
  /^[a-z]{2}(?:-[a-z0-9]+)+_public-health_environment_(?:heat|allergy|fire)_(?:alert|notification|reminder|instruction)$/,
  /^[a-z]{2}(?:-[a-z0-9]+)+_public-health_animal_(?:dog|cat)_(?:alert|notification|reminder|instruction)$/,
  /^[a-z]{2}(?:-[a-z0-9]+)+_public-health_human_(?:epidemic|pandemic)_(?:alert|notification|reminder|instruction)$/,
]);

const WHOLE_BLOOD_MARKER = '_health-care_public_blood-donation_whole-blood_';

/**
 * Normalizes the public-service filter derived from the selected animal card.
 * The result describes discovery only and carries no controller, consent or
 * clinical authority.
 */
export function normalizeAnimalPublicServiceMarketplaceQuery(
  input: AnimalPublicServiceMarketplaceQuery,
): AnimalPublicServiceMarketplaceQuery {
  if (input.subjectKind !== 'animal') throw new TypeError('animal_public_service_subject_kind_invalid');
  if (!Object.values(AnimalPublicServiceSpecies).includes(input.species)) {
    throw new TypeError('animal_public_service_species_invalid');
  }
  if (!Object.values(AnimalPublicServicePurposes).includes(input.purpose)) {
    throw new TypeError('animal_public_service_purpose_invalid');
  }
  const jurisdiction = requiredToken(input.jurisdiction, 'animal_public_service_jurisdiction_invalid').toUpperCase();
  if (!/^[A-Z]{2}(?:-[A-Z0-9]{1,3})+$/.test(jurisdiction)) {
    throw new TypeError('animal_public_service_jurisdiction_invalid');
  }
  const near = input.near ? Object.freeze({
    latitude: coordinate(input.near.latitude, -90, 90, 'animal_public_service_latitude_invalid'),
    longitude: coordinate(input.near.longitude, -180, 180, 'animal_public_service_longitude_invalid'),
    radiusKm: positiveNumber(input.near.radiusKm, 'animal_public_service_radius_invalid'),
  }) : undefined;
  return Object.freeze({
    subjectKind: 'animal',
    species: input.species,
    purpose: input.purpose,
    jurisdiction,
    ...(near ? { near } : {}),
  });
}

/** Validates one public routing name without introducing external code systems. */
export function assertPublicNotificationDatasetName(value: string): string {
  const datasetName = requiredToken(value, 'public_notification_dataset_invalid');
  if (!DATASET_PATTERNS.some((pattern) => pattern.test(datasetName))) {
    throw new TypeError('public_notification_dataset_invalid');
  }
  return datasetName;
}

/**
 * Accepts only public, delivery-neutral record data. Subscriber matching and
 * contact destinations deliberately have no fields in this shape.
 */
export function normalizePublicNotificationRecord(input: PublicNotificationRecord): PublicNotificationRecord {
  const publishedAt = isoInstant(input.publishedAt, 'public_notification_published_at_invalid');
  const validUntil = isoInstant(input.validUntil, 'public_notification_valid_until_invalid');
  if (Date.parse(validUntil) <= Date.parse(publishedAt)) {
    throw new TypeError('public_notification_valid_until_invalid');
  }
  if (!PublicNotificationStatuses.includes(input.status)) {
    throw new TypeError('public_notification_status_invalid');
  }
  if (!Array.isArray(input.locations) || input.locations.length === 0) {
    throw new TypeError('public_notification_locations_required');
  }

  return Object.freeze({
    notificationId: requiredToken(input.notificationId, 'public_notification_id_required'),
    datasetName: assertPublicNotificationDatasetName(input.datasetName),
    issuerReference: requiredToken(input.issuerReference, 'public_notification_issuer_reference_required'),
    issuerName: requiredToken(input.issuerName, 'public_notification_issuer_name_required'),
    subject: requiredToken(input.subject, 'public_notification_subject_required'),
    bodyMarkdown: requiredToken(input.bodyMarkdown, 'public_notification_body_required'),
    attachments: normalizeNotificationAttachments(input.attachments),
    locations: Object.freeze(input.locations.map((location) => requiredToken(location, 'public_notification_location_invalid'))),
    publishedAt,
    validUntil,
    status: input.status,
  });
}

/** Normalizes the common editor payload without resolving any recipient. */
export function normalizeNotificationComposerDraft(input: NotificationComposerDraft): NotificationComposerDraft {
  const audience: NotificationComposerAudience = input.audience.mode === 'public-dataset'
    ? Object.freeze({
      mode: 'public-dataset',
      datasetName: assertPublicNotificationDatasetName(input.audience.datasetName),
    })
    : input.audience.mode === 'addressed'
      ? Object.freeze({
        mode: 'addressed',
        subjectReference: requiredToken(input.audience.subjectReference, 'notification_subject_reference_required'),
        purpose: NotificationAddressedPurposes.includes(input.audience.purpose)
          ? input.audience.purpose
          : (() => { throw new TypeError('notification_addressed_purpose_invalid'); })(),
      })
      : (() => { throw new TypeError('notification_audience_mode_invalid'); })();

  return Object.freeze({
    audience,
    subject: requiredToken(input.subject, 'notification_subject_required'),
    bodyMarkdown: requiredToken(input.bodyMarkdown, 'notification_body_required'),
    attachments: normalizeNotificationAttachments(input.attachments),
    ...(input.priority ? {
      priority: PublicAlertPriorities.includes(input.priority)
        ? input.priority
        : (() => { throw new TypeError('public_alert_priority_invalid'); })(),
    } : {}),
    ...(input.validUntil ? { validUntil: isoInstant(input.validUntil, 'public_alert_valid_until_invalid') } : {}),
  });
}

/**
 * Evaluates local subscriber preferences. The caller keeps distance, donation
 * history and destinations inside the subscriber BFF and receives only a
 * decision suitable for its configured delivery adapters.
 */
export function evaluatePublicNotificationDelivery(input: Readonly<{
  notification: PublicNotificationRecord;
  preferences: PublicNotificationPreferences;
  evaluatedAt: string;
  notificationDistanceKm?: number;
  lastDonationAt?: string;
}>): PublicNotificationDeliveryDecision {
  const notification = normalizePublicNotificationRecord(input.notification);
  const evaluatedAt = Date.parse(isoInstant(input.evaluatedAt, 'public_notification_evaluated_at_invalid'));
  const reasons: PublicNotificationSuppressionReason[] = [];

  const subscribed = new Set(input.preferences.subscribedDatasetNames.map(assertPublicNotificationDatasetName));
  if (!subscribed.has(notification.datasetName)) reasons.push('not-subscribed');
  if (notification.status !== 'active') reasons.push('inactive');
  if (Date.parse(notification.validUntil) <= evaluatedAt) reasons.push('expired');

  const excludedIssuers = new Set(input.preferences.excludedIssuerReferences.map((value) => requiredToken(value, 'public_notification_issuer_reference_invalid')));
  if (excludedIssuers.has(notification.issuerReference)) reasons.push('issuer-excluded');

  const muted = input.preferences.mutes.some((mute) => {
    const until = Date.parse(isoInstant(mute.until, 'public_notification_mute_until_invalid'));
    if (until <= evaluatedAt) return false;
    if (mute.scope === 'dataset') return assertPublicNotificationDatasetName(mute.value) === notification.datasetName;
    if (mute.scope === 'issuer') return requiredToken(mute.value, 'public_notification_mute_value_invalid') === notification.issuerReference;
    throw new TypeError('public_notification_mute_scope_invalid');
  });
  if (muted) reasons.push('muted');

  const maximumDistanceKm = optionalNonNegativeNumber(input.preferences.maximumDistanceKm, 'public_notification_maximum_distance_invalid');
  const notificationDistanceKm = optionalNonNegativeNumber(input.notificationDistanceKm, 'public_notification_distance_invalid');
  if (maximumDistanceKm !== undefined && notificationDistanceKm !== undefined && notificationDistanceKm > maximumDistanceKm) {
    reasons.push('outside-distance');
  }

  const minimumDays = optionalNonNegativeNumber(input.preferences.minimumDaysSinceLastDonation, 'public_notification_donation_interval_invalid');
  if (minimumDays !== undefined && input.lastDonationAt && notification.datasetName.includes(WHOLE_BLOOD_MARKER)) {
    const lastDonationAt = Date.parse(isoInstant(input.lastDonationAt, 'public_notification_last_donation_at_invalid'));
    if (evaluatedAt - lastDonationAt < minimumDays * 86_400_000) reasons.push('donation-interval');
  }

  const deliveryChannels = uniqueDeliveryChannels(input.preferences.preferredDeliveryChannels);
  if (deliveryChannels.length === 0) reasons.push('no-delivery-channel');

  return Object.freeze({
    deliver: reasons.length === 0,
    reasons: Object.freeze(reasons),
    deliveryChannels: Object.freeze(deliveryChannels),
  });
}

function uniqueDeliveryChannels(values: readonly PublicNotificationDeliveryChannel[]): PublicNotificationDeliveryChannel[] {
  const channels = [...new Set(values)];
  if (channels.some((value) => !PublicNotificationDeliveryChannels.includes(value))) {
    throw new TypeError('public_notification_delivery_channel_invalid');
  }
  return channels;
}

function normalizeNotificationAttachments(values: readonly NotificationAttachment[]): readonly NotificationAttachment[] {
  if (!Array.isArray(values)) throw new TypeError('notification_attachments_invalid');
  return Object.freeze(values.map((attachment) => {
    if (!NotificationAttachmentMediaTypes.includes(attachment.mediaType)) {
      throw new TypeError('notification_attachment_media_type_invalid');
    }
    if (!Number.isSafeInteger(attachment.sizeBytes) || attachment.sizeBytes <= 0) {
      throw new TypeError('notification_attachment_size_invalid');
    }
    const sha256 = requiredToken(attachment.sha256, 'notification_attachment_digest_required').toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(sha256)) throw new TypeError('notification_attachment_digest_invalid');
    return Object.freeze({
      attachmentId: requiredToken(attachment.attachmentId, 'notification_attachment_id_required'),
      fileName: requiredToken(attachment.fileName, 'notification_attachment_file_name_required'),
      mediaType: attachment.mediaType,
      sizeBytes: attachment.sizeBytes,
      contentReference: requiredToken(attachment.contentReference, 'notification_attachment_content_reference_required'),
      sha256,
    });
  }));
}

function requiredToken(value: string, errorCode: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new TypeError(errorCode);
  return normalized;
}

function isoInstant(value: string, errorCode: string): string {
  const normalized = requiredToken(value, errorCode);
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== normalized) throw new TypeError(errorCode);
  return normalized;
}

function optionalNonNegativeNumber(value: number | undefined, errorCode: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0) throw new TypeError(errorCode);
  return value;
}

function coordinate(value: number, minimum: number, maximum: number, errorCode: string): number {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new TypeError(errorCode);
  return value;
}

function positiveNumber(value: number, errorCode: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(errorCode);
  return value;
}
