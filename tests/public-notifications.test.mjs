// Flow contract: 1) a verified publisher selects one bounded public dataset, 2) the BFF accepts a privacy-safe notification record, 3) a personal BFF matches only its own subscriptions and suppression rules, and 4) delivery decisions expose no subscriber, contact, donation-history or location data to the publisher.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AnimalPublicServicePurposes,
  AnimalPublicServiceSpecies,
  assertPublicNotificationDatasetName,
  evaluatePublicNotificationDelivery,
  normalizeAnimalPublicServiceMarketplaceQuery,
  normalizeNotificationComposerDraft,
  normalizePublicNotificationRecord,
  PUBLIC_ALERT_FORM_SCHEMA,
  PublicAlertOperationalClaim,
  publicAlertFormDataToCommunicationRequestFlatClaims,
} from '../dist/public-notifications.js';
import { CommunicationRequestClaim } from 'fhir-data-utils-ts/claims';

const BLOOD_DATASET = 'ca-bc_health-care_public_blood-donation_whole-blood_a-rh-negative';
const PLASMA_DATASET = 'ca-bc_health-care_public_blood-donation_plasmapheresis';
const PLATELET_DATASET = 'ca-bc_health-care_public_blood-donation_plateletpheresis';
const ANIMAL_DATASET = 'ca-bc_animal-care_public_veterinary_dog_alert';
const ANIMAL_BLOOD_DATASET = 'ca-bc_animal-care_public_blood-donation_dog_alert';
const ANIMAL_CAT_BLOOD_DATASET = 'ca-bc_animal-care_public_blood-donation_cat_alert';
const HEAT_DATASET = 'ca-bc_public-health_environment_heat_instruction';

test('normalizes the card-scoped animal marketplace query without treating the card as authority', () => {
  assert.deepEqual(normalizeAnimalPublicServiceMarketplaceQuery({
    subjectKind: 'animal',
    species: AnimalPublicServiceSpecies.Dog,
    purpose: AnimalPublicServicePurposes.BloodDonation,
    jurisdiction: 'ca-bc',
    near: { latitude: 49.2827, longitude: -123.1207, radiusKm: 75 },
  }), {
    subjectKind: 'animal',
    species: 'dog',
    purpose: 'blood-donation',
    jurisdiction: 'CA-BC',
    near: { latitude: 49.2827, longitude: -123.1207, radiusKm: 75 },
  });

  assert.throws(() => normalizeAnimalPublicServiceMarketplaceQuery({
    subjectKind: 'human', species: 'dog', purpose: 'emergency', jurisdiction: 'CA-BC',
  }), /animal_public_service_subject_kind_invalid/);
  assert.throws(() => normalizeAnimalPublicServiceMarketplaceQuery({
    subjectKind: 'animal', species: 'horse', purpose: 'blood-donation', jurisdiction: 'CA-BC',
  }), /animal_public_service_species_invalid/);
});

test('accepts only the bounded readable MVP dataset families', () => {
  assert.equal(assertPublicNotificationDatasetName(BLOOD_DATASET), BLOOD_DATASET);
  assert.equal(assertPublicNotificationDatasetName(PLASMA_DATASET), PLASMA_DATASET);
  assert.equal(assertPublicNotificationDatasetName(PLATELET_DATASET), PLATELET_DATASET);
  assert.equal(assertPublicNotificationDatasetName(ANIMAL_DATASET), ANIMAL_DATASET);
  assert.equal(assertPublicNotificationDatasetName(ANIMAL_BLOOD_DATASET), ANIMAL_BLOOD_DATASET);
  assert.equal(assertPublicNotificationDatasetName(ANIMAL_CAT_BLOOD_DATASET), ANIMAL_CAT_BLOOD_DATASET);
  assert.equal(assertPublicNotificationDatasetName(HEAT_DATASET), HEAT_DATASET);

  assert.throws(
    () => assertPublicNotificationDatasetName('ca-bc_health-care_public_blood-donation_whole-blood_loinc-0000'),
    /public_notification_dataset_invalid/,
  );
  assert.throws(
    () => assertPublicNotificationDatasetName('ca-bc_public-health_home_address_alert'),
    /public_notification_dataset_invalid/,
  );
});

test('normalizes one Markdown public notification with image and PDF references but no delivery secrets', () => {
  const notification = normalizePublicNotificationRecord({
    notificationId: 'notification-one',
    datasetName: ANIMAL_DATASET,
    issuerReference: 'Organization/publisher-one',
    issuerName: 'Example Animal Care Organization',
    subject: 'Keep dogs away from the affected park',
    bodyMarkdown: '**Follow** the public instructions until the alert is cancelled.',
    attachments: [{
      attachmentId: 'attachment-image-one',
      fileName: 'affected-area.png',
      mediaType: 'image/png',
      sizeBytes: 2048,
      contentReference: 'Binary/attachment-image-one',
      sha256: 'a'.repeat(64),
    }, {
      attachmentId: 'attachment-pdf-one',
      fileName: 'public-instructions.pdf',
      mediaType: 'application/pdf',
      sizeBytes: 4096,
      contentReference: 'DocumentReference/attachment-pdf-one',
      sha256: 'b'.repeat(64),
    }],
    locations: ['Region/example-one'],
    publishedAt: '2026-10-20T18:00:00.000Z',
    validUntil: '2026-10-21T18:00:00.000Z',
    status: 'active',
  });

  assert.equal(notification.datasetName, ANIMAL_DATASET);
  assert.equal(notification.status, 'active');
  assert.equal(notification.bodyMarkdown.startsWith('**Follow**'), true);
  assert.deepEqual(notification.attachments.map(({ mediaType }) => mediaType), ['image/png', 'application/pdf']);
  assert.deepEqual(notification.locations, ['Region/example-one']);
  assert.equal('subscriberReference' in notification, false);
  assert.equal('deliveryAddress' in notification, false);
  assert.equal('bloodGroup' in notification, false);
  assert.equal('lastDonationAt' in notification, false);
  assert.equal('deviceToken' in notification, false);
});

test('uses one composer shape while keeping addressed and public-dataset authority distinct', () => {
  const commonContent = {
    subject: 'Care transition instructions',
    bodyMarkdown: 'Review the attached **care instructions**.',
    attachments: [],
  };

  const addressed = normalizeNotificationComposerDraft({
    ...commonContent,
    audience: { mode: 'addressed', subjectReference: 'Patient/subject-one', purpose: 'care-instructions' },
  });
  const publicDataset = normalizeNotificationComposerDraft({
    ...commonContent,
    audience: { mode: 'public-dataset', datasetName: BLOOD_DATASET },
    priority: 'urgent',
    validUntil: '2026-10-22T18:00:00.000Z',
  });

  assert.equal(addressed.audience.mode, 'addressed');
  assert.equal(publicDataset.audience.mode, 'public-dataset');
  assert.equal(publicDataset.priority, 'urgent');
  assert.equal(publicDataset.validUntil, '2026-10-22T18:00:00.000Z');
  assert.equal('recipientReferences' in addressed.audience, false);
  assert.equal('subscriberReferences' in publicDataset.audience, false);
  assert.throws(() => normalizeNotificationComposerDraft({
    ...commonContent,
    audience: { mode: 'addressed', subjectReference: 'Patient/subject-one', purpose: 'marketing' },
  }), /notification_addressed_purpose_invalid/);
});

test('maps the public-alert JSON Schema form to server-authorized CommunicationRequest flat claims', () => {
  assert.equal(PUBLIC_ALERT_FORM_SCHEMA.type, 'object');
  assert.equal('requester' in PUBLIC_ALERT_FORM_SCHEMA.properties, false);
  assert.equal('recipients' in PUBLIC_ALERT_FORM_SCHEMA.properties, false);
  assert.equal('informationProvider' in PUBLIC_ALERT_FORM_SCHEMA.properties, false);

  const claims = publicAlertFormDataToCommunicationRequestFlatClaims({
    datasetName: ANIMAL_BLOOD_DATASET,
    subject: 'Dog blood donation needed',
    bodyMarkdown: '**Urgent:** contact the clinic.',
    priority: 'urgent',
    validUntil: '2026-10-22T18:00:00.000Z',
    attachments: [{
      attachmentId: 'public-alert-attachment-one',
      fileName: 'donation-instructions.pdf',
      mediaType: 'application/pdf',
      sizeBytes: 4096,
      contentReference: 'DocumentReference/public-alert-attachment-one',
      sha256: 'c'.repeat(64),
    }],
  }, {
    identifier: 'urn:uuid:public-alert-request-one',
    status: 'active',
    intent: 'order',
    subjectGroupReference: 'Group/public-topic-audience-one',
    requesterPractitionerRoleReference: 'PractitionerRole/publisher-one',
    recipientTopicEndpointReference: 'Endpoint/public-topic-one',
    informationProviderReference: 'Organization/animal-hospital-one',
    authoredOn: '2026-10-21T18:00:00.000Z',
    payloadDocumentReference: 'DocumentReference/public-alert-content-one',
  });

  assert.equal(claims[CommunicationRequestClaim.Status], 'active');
  assert.equal(claims[CommunicationRequestClaim.Intent], 'order');
  assert.equal(claims[CommunicationRequestClaim.Requester], 'PractitionerRole/publisher-one');
  assert.equal(claims[CommunicationRequestClaim.Recipient], 'Endpoint/public-topic-one');
  assert.equal(claims[CommunicationRequestClaim.InformationProvider], 'Organization/animal-hospital-one');
  assert.equal(claims[CommunicationRequestClaim.PayloadReference], 'DocumentReference/public-alert-content-one');
  assert.equal(claims[CommunicationRequestClaim.About], 'DocumentReference/public-alert-attachment-one');
  assert.equal(claims[CommunicationRequestClaim.Category], 'http://terminology.hl7.org/CodeSystem/communication-category|notification');
  assert.equal(claims[CommunicationRequestClaim.OccurrencePeriodStart], '2026-10-21T18:00:00.000Z');
  assert.equal(claims[CommunicationRequestClaim.OccurrencePeriodEnd], '2026-10-22T18:00:00.000Z');
  assert.equal(claims[PublicAlertOperationalClaim.DatasetName], ANIMAL_BLOOD_DATASET);
  assert.equal(JSON.stringify(claims).includes('subscriber'), false);
});

test('lets the subscriber BFF deliver an active subscribed alert through selected channels', () => {
  const decision = evaluatePublicNotificationDelivery({
    notification: {
      notificationId: 'notification-one',
      datasetName: ANIMAL_DATASET,
      issuerReference: 'Organization/publisher-one',
      issuerName: 'Example Animal Care Organization',
      subject: 'Public animal alert',
      bodyMarkdown: 'Follow the public instructions.',
      attachments: [],
      locations: ['Region/example-one'],
      publishedAt: '2026-10-20T18:00:00.000Z',
      validUntil: '2026-10-21T18:00:00.000Z',
      status: 'active',
    },
    preferences: {
      subscribedDatasetNames: [ANIMAL_DATASET],
      excludedIssuerReferences: [],
      mutes: [],
      preferredDeliveryChannels: ['web', 'push'],
    },
    evaluatedAt: '2026-10-20T19:00:00.000Z',
  });

  assert.deepEqual(decision, {
    deliver: true,
    reasons: [],
    deliveryChannels: ['web', 'push'],
  });
});

test('applies issuer, mute, distance and donation-interval suppression only inside the subscriber BFF', () => {
  const notification = {
    notificationId: 'notification-two',
    datasetName: BLOOD_DATASET,
    issuerReference: 'Organization/publisher-one',
    issuerName: 'Example Blood Service',
    subject: 'A negative donation requested',
    bodyMarkdown: 'Appointments are available this week.',
    attachments: [],
    locations: ['Region/example-one'],
    publishedAt: '2026-10-20T18:00:00.000Z',
    validUntil: '2026-10-30T18:00:00.000Z',
    status: 'active',
  };
  const basePreferences = {
    subscribedDatasetNames: [BLOOD_DATASET],
    excludedIssuerReferences: [],
    mutes: [],
    preferredDeliveryChannels: ['web'],
  };

  assert.deepEqual(evaluatePublicNotificationDelivery({
    notification,
    preferences: { ...basePreferences, excludedIssuerReferences: ['Organization/publisher-one'] },
    evaluatedAt: '2026-10-20T19:00:00.000Z',
  }).reasons, ['issuer-excluded']);

  assert.deepEqual(evaluatePublicNotificationDelivery({
    notification,
    preferences: {
      ...basePreferences,
      mutes: [{ scope: 'dataset', value: BLOOD_DATASET, until: '2026-10-22T00:00:00.000Z' }],
    },
    evaluatedAt: '2026-10-20T19:00:00.000Z',
  }).reasons, ['muted']);

  assert.deepEqual(evaluatePublicNotificationDelivery({
    notification,
    preferences: { ...basePreferences, maximumDistanceKm: 25 },
    notificationDistanceKm: 60,
    evaluatedAt: '2026-10-20T19:00:00.000Z',
  }).reasons, ['outside-distance']);

  assert.deepEqual(evaluatePublicNotificationDelivery({
    notification,
    preferences: { ...basePreferences, minimumDaysSinceLastDonation: 56 },
    lastDonationAt: '2026-10-01T10:00:00.000Z',
    evaluatedAt: '2026-10-20T19:00:00.000Z',
  }).reasons, ['donation-interval']);
});

test('never applies a whole-blood interval to plasmapheresis or non-donation topics', () => {
  const decision = evaluatePublicNotificationDelivery({
    notification: {
      notificationId: 'notification-three',
      datasetName: PLASMA_DATASET,
      issuerReference: 'Organization/publisher-one',
      issuerName: 'Example Blood Service',
      subject: 'Plasma donation requested',
      bodyMarkdown: 'Appointments are available this week.',
      attachments: [],
      locations: ['Region/example-one'],
      publishedAt: '2026-10-20T18:00:00.000Z',
      validUntil: '2026-10-30T18:00:00.000Z',
      status: 'active',
    },
    preferences: {
      subscribedDatasetNames: [PLASMA_DATASET],
      excludedIssuerReferences: [],
      mutes: [],
      preferredDeliveryChannels: ['web'],
      minimumDaysSinceLastDonation: 56,
    },
    lastDonationAt: '2026-10-19T10:00:00.000Z',
    evaluatedAt: '2026-10-20T19:00:00.000Z',
  });

  assert.equal(decision.deliver, true);
  assert.deepEqual(decision.reasons, []);
});
