// Flow contract: 1) let the requester select the current device, an explicit device set, all currently authorized devices or exact RelatedPersons; 2) address one exact individual, authorized person, explicit group member or emergency service; 3) allow destination professional Groups only when selected explicitly; 4) bind every delivery receipt to one selected profile-device or service endpoint; 5) calculate the shortest applicable content lifetime; 6) retain only content-free audit metadata after expiry. Authorization invariant: relationship, group membership and device possession never create permission, and a professional Group/role used as sender or recipient never widens the other recipients. Persistence invariant: every expanded route remains independently encrypted, never fans out further and contains no plaintext message, phone number or protected destination.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DirectedMessageRecipientKind,
  DirectedMessageDeviceSelectionMode,
  DirectedMessageTargetKind,
  EmergencyServiceDeliverySetting,
  STANDARD_DEVICE_CONTENT_EXPIRY_MINUTES,
  buildDirectedMessageAudienceDeliveries,
  buildDirectedMessageDelivery,
} from '../dist/directed-message-delivery.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

const issuedAt = '2026-10-04T20:00:00.000Z'
const patientReference = `Patient/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const relatedPersonReference = REPOSITORY_SAFE_EXAMPLES.firstContactIdentifier
const explicitGroupReference = `Group/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const physicianGroupReference = `Group/physician-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const nursingGroupReference = `Group/nursing-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const physicianRoleReference = `PractitionerRole/physician-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const nursingRoleReference = `PractitionerRole/nursing-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const healthcareServiceReference = `HealthcareService/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const profileDeviceKeyId = `urn:uuid:${REPOSITORY_SAFE_EXAMPLES.resourceUuid}#profile-device-key`
const reserveProfileDeviceKeyId = `urn:uuid:${REPOSITORY_SAFE_EXAMPLES.resourceUuid}#reserve-profile-device-key`
const controllerProfileDeviceKeyId = `urn:uuid:${REPOSITORY_SAFE_EXAMPLES.resourceUuid}#controller-profile-device-key`
const physicianProfileDeviceKeyId = `urn:uuid:${REPOSITORY_SAFE_EXAMPLES.resourceUuid}#physician-profile-device-key`
const nursingProfileDeviceKeyId = `urn:uuid:${REPOSITORY_SAFE_EXAMPLES.resourceUuid}#nursing-profile-device-key`
const serviceEndpointKeyId = `urn:uuid:${REPOSITORY_SAFE_EXAMPLES.resourceUuid}#service-endpoint-key`
const requestedContentLifetimeMinutes = 30
const serviceMaximumContentLifetimeMinutes = 15
const deviceMaximumContentLifetimeMinutes = 5

test('routes a patient-only message to one profile device with the shortest content lifetime', () => {
  assert.deepEqual(STANDARD_DEVICE_CONTENT_EXPIRY_MINUTES, [5, 15, 30])

  const delivery = buildDirectedMessageDelivery({
    recipient: {
      kind: DirectedMessageRecipientKind.Individual,
      recipientReference: patientReference,
    },
    target: {
      kind: DirectedMessageTargetKind.ProfileDevice,
      keyId: profileDeviceKeyId,
    },
    issuedAt,
    requestedContentLifetimeMinutes,
    serviceMaximumContentLifetimeMinutes,
    deviceMaximumContentLifetimeMinutes,
  })

  assert.deepEqual(delivery, {
    recipient: {
      kind: DirectedMessageRecipientKind.Individual,
      communicationRecipientReference: patientReference,
      deliveryRecipientReference: patientReference,
    },
    target: {
      kind: DirectedMessageTargetKind.ProfileDevice,
      keyId: profileDeviceKeyId,
    },
    issuedAt,
    expiresAt: '2026-10-04T20:05:00.000Z',
    effectiveContentLifetimeMinutes: deviceMaximumContentLifetimeMinutes,
    contentPolicy: {
      fanOut: 'forbidden',
      notificationPreview: 'hidden',
      deleteEncryptedContentAtExpiry: true,
      retainContentFreeAudit: true,
    },
  })
  assert.equal('content' in delivery, false)
  assert.equal('destination' in delivery, false)
  assert.equal('telephone' in delivery, false)
})

test('keeps one authorized relative separate from both the patient and every other relative', () => {
  const delivery = buildDirectedMessageDelivery({
    recipient: {
      kind: DirectedMessageRecipientKind.AuthorizedPerson,
      recipientReference: relatedPersonReference,
    },
    target: {
      kind: DirectedMessageTargetKind.ProfileDevice,
      keyId: profileDeviceKeyId,
    },
    issuedAt,
    requestedContentLifetimeMinutes: serviceMaximumContentLifetimeMinutes,
  })

  assert.equal(delivery.recipient.communicationRecipientReference, relatedPersonReference)
  assert.equal(delivery.recipient.deliveryRecipientReference, relatedPersonReference)
  assert.equal('groupReference' in delivery.recipient, false)
  assert.equal(delivery.contentPolicy.fanOut, 'forbidden')
})

test('expands an explicit group into one exact member-device route without adding the patient', () => {
  const delivery = buildDirectedMessageDelivery({
    recipient: {
      kind: DirectedMessageRecipientKind.ExplicitGroupMember,
      groupReference: explicitGroupReference,
      recipientReference: relatedPersonReference,
    },
    target: {
      kind: DirectedMessageTargetKind.ProfileDevice,
      keyId: profileDeviceKeyId,
    },
    issuedAt,
    requestedContentLifetimeMinutes: requestedContentLifetimeMinutes,
  })

  assert.equal(delivery.recipient.communicationRecipientReference, explicitGroupReference)
  assert.equal(delivery.recipient.deliveryRecipientReference, relatedPersonReference)
  assert.equal(delivery.recipient.groupReference, explicitGroupReference)
  assert.notEqual(delivery.recipient.deliveryRecipientReference, patientReference)
})

test('addresses one emergency service endpoint without treating it as a family group', () => {
  const delivery = buildDirectedMessageDelivery({
    recipient: {
      kind: DirectedMessageRecipientKind.EmergencyService,
      recipientReference: healthcareServiceReference,
      deliverySetting: EmergencyServiceDeliverySetting.Mobile,
    },
    target: {
      kind: DirectedMessageTargetKind.ServiceEndpoint,
      keyId: serviceEndpointKeyId,
    },
    issuedAt,
    requestedContentLifetimeMinutes: requestedContentLifetimeMinutes,
  })

  assert.equal(delivery.recipient.deliveryRecipientReference, healthcareServiceReference)
  assert.equal(delivery.recipient.serviceDeliverySetting, EmergencyServiceDeliverySetting.Mobile)
  assert.equal(delivery.target.kind, DirectedMessageTargetKind.ServiceEndpoint)
})

test('expands an explicit all-authorized-devices snapshot without adding another person', () => {
  const deliveries = buildDirectedMessageAudienceDeliveries({
    audiences: [{
      recipient: {
        kind: DirectedMessageRecipientKind.Individual,
        recipientReference: patientReference,
      },
      deviceSelectionMode: DirectedMessageDeviceSelectionMode.AllAuthorizedDevices,
      profileDeviceKeyIds: [profileDeviceKeyId, reserveProfileDeviceKeyId],
    }],
    issuedAt,
    requestedContentLifetimeMinutes,
  })

  assert.equal(deliveries.length, 2)
  assert.deepEqual(deliveries.map(({ recipient }) => recipient.deliveryRecipientReference), [patientReference, patientReference])
  assert.deepEqual(deliveries.map(({ target }) => target.keyId), [profileDeviceKeyId, reserveProfileDeviceKeyId])
})

test('lets a professional service select the patient and controller without selecting every relative', () => {
  const deliveries = buildDirectedMessageAudienceDeliveries({
    audiences: [
      {
        recipient: {
          kind: DirectedMessageRecipientKind.Individual,
          recipientReference: patientReference,
        },
        deviceSelectionMode: DirectedMessageDeviceSelectionMode.CurrentDevice,
        profileDeviceKeyIds: [profileDeviceKeyId],
      },
      {
        recipient: {
          kind: DirectedMessageRecipientKind.AuthorizedPerson,
          recipientReference: relatedPersonReference,
        },
        deviceSelectionMode: DirectedMessageDeviceSelectionMode.SelectedDevices,
        profileDeviceKeyIds: [controllerProfileDeviceKeyId],
      },
    ],
    issuedAt,
    requestedContentLifetimeMinutes,
  })

  assert.deepEqual(deliveries.map(({ recipient }) => recipient.deliveryRecipientReference), [
    patientReference,
    relatedPersonReference,
  ])
  assert.deepEqual(deliveries.map(({ target }) => target.keyId), [
    profileDeviceKeyId,
    controllerProfileDeviceKeyId,
  ])
})

test('keeps relatives and destination professional groups as separate recipients in one patient thread', () => {
  const deliveries = buildDirectedMessageAudienceDeliveries({
    audiences: [
      {
        recipient: {
          kind: DirectedMessageRecipientKind.AuthorizedPerson,
          recipientReference: relatedPersonReference,
        },
        deviceSelectionMode: DirectedMessageDeviceSelectionMode.CurrentDevice,
        profileDeviceKeyIds: [controllerProfileDeviceKeyId],
      },
      {
        recipient: {
          kind: DirectedMessageRecipientKind.ExplicitGroupMember,
          groupReference: physicianGroupReference,
          recipientReference: physicianRoleReference,
        },
        deviceSelectionMode: DirectedMessageDeviceSelectionMode.CurrentDevice,
        profileDeviceKeyIds: [physicianProfileDeviceKeyId],
      },
      {
        recipient: {
          kind: DirectedMessageRecipientKind.ExplicitGroupMember,
          groupReference: nursingGroupReference,
          recipientReference: nursingRoleReference,
        },
        deviceSelectionMode: DirectedMessageDeviceSelectionMode.CurrentDevice,
        profileDeviceKeyIds: [nursingProfileDeviceKeyId],
      },
    ],
    issuedAt,
    requestedContentLifetimeMinutes,
  })

  assert.deepEqual(deliveries.map(({ recipient }) => recipient.communicationRecipientReference), [
    relatedPersonReference,
    physicianGroupReference,
    nursingGroupReference,
  ])
  assert.deepEqual(deliveries.map(({ recipient }) => recipient.deliveryRecipientReference), [
    relatedPersonReference,
    physicianRoleReference,
    nursingRoleReference,
  ])
})

test('rejects recipient, target and lifetime combinations that could widen delivery', () => {
  const commonInput = {
    issuedAt,
    requestedContentLifetimeMinutes,
  }

  assert.throws(() => buildDirectedMessageDelivery({
    ...commonInput,
    recipient: { kind: DirectedMessageRecipientKind.Individual, recipientReference: relatedPersonReference },
    target: { kind: DirectedMessageTargetKind.ProfileDevice, keyId: profileDeviceKeyId },
  }), /directed_message_individual_reference_invalid/)

  assert.throws(() => buildDirectedMessageDelivery({
    ...commonInput,
    recipient: { kind: DirectedMessageRecipientKind.ExplicitGroupMember, groupReference: explicitGroupReference, recipientReference: explicitGroupReference },
    target: { kind: DirectedMessageTargetKind.ProfileDevice, keyId: profileDeviceKeyId },
  }), /directed_message_group_member_reference_invalid/)

  assert.throws(() => buildDirectedMessageDelivery({
    ...commonInput,
    recipient: {
      kind: DirectedMessageRecipientKind.EmergencyService,
      recipientReference: healthcareServiceReference,
      deliverySetting: EmergencyServiceDeliverySetting.Mobile,
    },
    target: { kind: DirectedMessageTargetKind.ProfileDevice, keyId: profileDeviceKeyId },
  }), /directed_message_service_target_invalid/)

  assert.throws(() => buildDirectedMessageDelivery({
    ...commonInput,
    requestedContentLifetimeMinutes: 0,
    recipient: { kind: DirectedMessageRecipientKind.Individual, recipientReference: patientReference },
    target: { kind: DirectedMessageTargetKind.ProfileDevice, keyId: profileDeviceKeyId },
  }), /directed_message_content_lifetime_invalid/)

  assert.throws(() => buildDirectedMessageAudienceDeliveries({
    ...commonInput,
    audiences: [{
      recipient: { kind: DirectedMessageRecipientKind.Individual, recipientReference: patientReference },
      deviceSelectionMode: DirectedMessageDeviceSelectionMode.CurrentDevice,
      profileDeviceKeyIds: [profileDeviceKeyId, reserveProfileDeviceKeyId],
    }],
  }), /directed_message_current_device_must_be_exact/)

  assert.throws(() => buildDirectedMessageAudienceDeliveries({
    ...commonInput,
    audiences: [
      {
        recipient: { kind: DirectedMessageRecipientKind.Individual, recipientReference: patientReference },
        deviceSelectionMode: DirectedMessageDeviceSelectionMode.CurrentDevice,
        profileDeviceKeyIds: [profileDeviceKeyId],
      },
      {
        recipient: { kind: DirectedMessageRecipientKind.AuthorizedPerson, recipientReference: relatedPersonReference },
        deviceSelectionMode: DirectedMessageDeviceSelectionMode.SelectedDevices,
        profileDeviceKeyIds: [profileDeviceKeyId],
      },
    ],
  }), /directed_message_duplicate_device_target/)
})
