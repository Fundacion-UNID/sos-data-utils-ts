// TDD contract: write this test red first; make it green only with the complete real behavior.
/**
 * Teaching goal:
 * 1. Register fixed Bluetooth beacons against persistent Schema.org Places.
 * 2. Bind a moving device to an individual subject without abusing Product.audience.
 * 3. Resolve the nearest known beacon into an immutable Schema.org Event.
 * 4. Select only verified emergency channels for the located subject/controller.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js';

import {
  SchemaOrgEventClaim,
  SchemaOrgPlaceClaim,
  SchemaOrgIndividualProductClaim,
  buildIndividualProductClaims,
  buildDevicePlaceEventClaims,
  buildPlaceClaims,
  buildPlaceRegistrationClaims,
  createPlaceBeacon,
  decodeAudienceIdentifiers,
  PlaceKinds,
  normalizeBluetoothMacId,
  resolveNearestPlace,
  selectEmergencyNotificationTargets,
} from '../dist/location-proximity.js';

const PLACE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const PLACE_URN = `urn:uuid:${PLACE_UUID}`;
const SUBJECT_DID = 'did:web:unid.example:individual:subject-001';
const MOBILE_DEVICE_UUID = '018f3f56-7ca2-7b90-a5c4-4f93bd6d727b';
const MOBILE_DEVICE_URN = `urn:uuid:${MOBILE_DEVICE_UUID}`;
const VEHICLE_UUID = '550e8400-e29b-41d4-a716-446655440010';
const VEHICLE_URN = `urn:uuid:${VEHICLE_UUID}`;

test('Step 1. builds one persistent Place using the canonical UUID URN pair', () => {
  const claims = buildPlaceClaims({
    identifier: PLACE_URN,
    identifierValue: PLACE_UUID,
    name: 'Room 204',
    additionalType: 'http://terminology.hl7.org/CodeSystem/location-physical-type|ro',
    latitude: 40.41692,
    longitude: -3.70341,
    elevation: 667,
  });

  assert.equal(claims[SchemaOrgPlaceClaim.identifier], PLACE_URN);
  assert.equal(claims[SchemaOrgPlaceClaim.identifierValue], PLACE_UUID);
  assert.equal(claims[SchemaOrgPlaceClaim.latitude], 40.41692);
  assert.equal(claims[SchemaOrgPlaceClaim.longitude], -3.70341);
});

test('Step 2. routes one device product audience to a subject', () => {
  const deviceClaims = buildIndividualProductClaims({
    identifier: MOBILE_DEVICE_URN,
    identifierValue: MOBILE_DEVICE_UUID,
    name: 'Subject phone',
    additionalType: 'bluetooth-mobile-device',
    audienceIdentifiers: [SUBJECT_DID],
    audienceType: 'UHC and VetChain emergency recipients',
  });
  assert.equal(deviceClaims[SchemaOrgIndividualProductClaim.identifier], MOBILE_DEVICE_URN);
  assert.deepEqual(decodeAudienceIdentifiers(
    deviceClaims[SchemaOrgIndividualProductClaim.audienceIdentifier],
  ), [SUBJECT_DID]);
});

test('registers a room as a child Place under country, region, postcode, and building hierarchy', () => {
  const claims = buildPlaceRegistrationClaims({
    identifier: PLACE_URN,
    identifierValue: PLACE_UUID,
    kind: PlaceKinds.Room,
    name: 'Room 204',
    countryCode: 'es',
    regionCode: 'es-md',
    postalCode: '28013',
    locality: 'Madrid',
    streetAddress: 'Calle de Ejemplo 10',
    extendedAddress: 'Building A, floor 2, unit 204',
    latitude: 40.41692,
    longitude: -3.70341,
    parentPlaceIdentifier: 'urn:uuid:550e8400-e29b-41d4-a716-446655440011',
  });

  assert.equal(claims[SchemaOrgPlaceClaim.addressCountry], 'ES');
  assert.equal(claims[SchemaOrgPlaceClaim.addressRegion], 'ES-MD');
  assert.equal(claims[SchemaOrgPlaceClaim.postalCode], '28013');
  assert.equal(claims[SchemaOrgPlaceClaim.extendedAddress], 'Building A, floor 2, unit 204');
  assert.equal(
    claims[SchemaOrgPlaceClaim.containedInPlaceIdentifier],
    'urn:uuid:550e8400-e29b-41d4-a716-446655440011',
  );
});

test('exports the browser-safe cross-sector contract through its focused subpath', async () => {
  const contract = await import('sos-data-utils-ts/location-proximity');
  assert.equal(typeof contract.resolveNearestPlace, 'function');
  assert.equal(contract.SchemaOrgEventClaim.locationIdentifier, 'org.schema.Event.location.identifier');
});

test('models a vehicle as one IndividualProduct with a CSV audience of UHC and VetChain cards', () => {
  const animalCardDid = 'did:web:vetchain.example:card:vetchain:0009615:724090961592399211919';
  const vehicleClaims = buildIndividualProductClaims({
    identifier: VEHICLE_URN,
    identifierValue: VEHICLE_UUID,
    name: 'Emergency support vehicle',
    additionalType: 'vehicle',
    category: 'land',
    productID: 'ES:1234ABC',
    audienceIdentifiers: [SUBJECT_DID, animalCardDid, SUBJECT_DID],
    audienceType: 'UHC and VetChain emergency recipients',
  });

  assert.equal(vehicleClaims[SchemaOrgIndividualProductClaim.identifier], VEHICLE_URN);
  assert.equal(vehicleClaims[SchemaOrgIndividualProductClaim.category], 'land');
  assert.equal(
    vehicleClaims[SchemaOrgIndividualProductClaim.audienceIdentifier],
    `${SUBJECT_DID},${animalCardDid}`,
  );
});

test('Step 3. resolves the strongest fresh beacon and creates a location event', () => {
  const room204 = createPlaceBeacon({
    deviceIdentifier: 'urn:uuid:018f3f56-7ca2-7b90-a5c4-4f93bd6d7001',
    bluetoothMacId: 'aa-bb-cc-dd-ee-01',
    placeIdentifier: PLACE_URN,
    placeIdentifierValue: PLACE_UUID,
    latitude: 40.41692,
    longitude: -3.70341,
  });
  const room205 = createPlaceBeacon({
    deviceIdentifier: 'urn:uuid:018f3f56-7ca2-7b90-a5c4-4f93bd6d7002',
    bluetoothMacId: 'AA:BB:CC:DD:EE:02',
    placeIdentifier: 'urn:uuid:550e8400-e29b-41d4-a716-446655440002',
    placeIdentifierValue: '550e8400-e29b-41d4-a716-446655440002',
    latitude: 40.41701,
    longitude: -3.70312,
  });

  const resolved = resolveNearestPlace({
    eventIdentifier: 'urn:uuid:018f3f56-7ca2-7b90-a5c4-4f93bd6d7999',
    eventIdentifierValue: '018f3f56-7ca2-7b90-a5c4-4f93bd6d7999',
    movingDeviceIdentifier: MOBILE_DEVICE_URN,
    movingDeviceIdentifierValue: MOBILE_DEVICE_UUID,
    observedAt: '2026-08-01T20:00:00.000Z',
    now: '2026-08-01T20:00:03.000Z',
    beacons: [room204, room205],
    sightings: [
      { bluetoothMacId: 'AA:BB:CC:DD:EE:01', rssi: -71 },
      { bluetoothMacId: 'aa:bb:cc:dd:ee:02', rssi: -43 },
    ],
  });

  assert.ok(resolved);
  assert.equal(resolved.beacon.bluetoothMacId, 'AA:BB:CC:DD:EE:02');
  assert.equal(
    resolved.eventClaims[SchemaOrgEventClaim.aboutIdentifier],
    MOBILE_DEVICE_URN,
  );
  assert.equal(
    resolved.eventClaims[SchemaOrgEventClaim.locationIdentifier],
    room205.placeIdentifier,
  );
  assert.equal(
    resolved.eventClaims[SchemaOrgEventClaim.locationIdentifierValue],
    room205.placeIdentifierValue,
  );
  assert.equal(resolved.eventClaims[SchemaOrgEventClaim.locationLatitude], 40.41701);
  assert.equal(resolved.eventClaims[SchemaOrgEventClaim.locationLongitude], -3.70312);
  assert.equal(resolved.rssi, -43);
});

test('rejects malformed MAC identifiers and ignores unknown or stale proximity data', () => {
  assert.equal(normalizeBluetoothMacId('aa-bb-cc-dd-ee-ff'), 'AA:BB:CC:DD:EE:FF');
  assert.throws(() => normalizeBluetoothMacId('not-a-mac'), /Bluetooth MAC/);

  const resolved = resolveNearestPlace({
    eventIdentifier: 'urn:uuid:018f3f56-7ca2-7b90-a5c4-4f93bd6d7999',
    eventIdentifierValue: '018f3f56-7ca2-7b90-a5c4-4f93bd6d7999',
    movingDeviceIdentifier: MOBILE_DEVICE_URN,
    movingDeviceIdentifierValue: MOBILE_DEVICE_UUID,
    observedAt: '2026-08-01T19:59:00.000Z',
    now: '2026-08-01T20:00:00.000Z',
    maxAgeMs: 10_000,
    beacons: [],
    sightings: [{ bluetoothMacId: 'AA:BB:CC:DD:EE:01', rssi: -50 }],
  });

  assert.equal(resolved, undefined);
});

test('builds event claims only when Event.about and Event.location identities are canonical', () => {
  assert.throws(() => buildDevicePlaceEventClaims({
    eventIdentifier: 'urn:uuid:018f3f56-7ca2-7b90-a5c4-4f93bd6d7999',
    eventIdentifierValue: '018f3f56-7ca2-7b90-a5c4-4f93bd6d7999',
    deviceIdentifier: MOBILE_DEVICE_URN,
    deviceIdentifierValue: MOBILE_DEVICE_UUID,
    placeIdentifier: PLACE_URN,
    placeIdentifierValue: 'different-value',
    observedAt: '2026-08-01T20:00:00.000Z',
    latitude: 40.41692,
    longitude: -3.70341,
  }), /UUID URN/);
});

test('Step 4. selects verified push, SMS, email, and voice channels without duplicates', () => {
  const animalCardDid = 'did:web:vetchain.example:card:vetchain:0009615:724090961592399211919';
  const gatewayDeviceClaims = buildIndividualProductClaims({
    identifier: MOBILE_DEVICE_URN,
    identifierValue: MOBILE_DEVICE_UUID,
    name: 'Vehicle emergency gateway',
    audienceIdentifiers: [SUBJECT_DID, animalCardDid],
  });

  const targets = selectEmergencyNotificationTargets({
    individualProductClaims: gatewayDeviceClaims,
    directory: [{
      subjectIdentifier: SUBJECT_DID,
      targets: [
        { owner: 'subject', channel: 'push', address: 'push:device-1', verified: true, enabled: true },
        { owner: 'controller', channel: 'sms', address: REPOSITORY_SAFE_EXAMPLES.phoneE164, verified: true, enabled: true },
        { owner: 'controller', channel: 'email', address: `care@${REPOSITORY_SAFE_EXAMPLES.domain}`, verified: false, enabled: true },
        { owner: 'controller', channel: 'voice', address: REPOSITORY_SAFE_EXAMPLES.phoneE164, verified: true, enabled: true },
        { owner: 'controller', channel: 'sms', address: REPOSITORY_SAFE_EXAMPLES.phoneE164, verified: true, enabled: true },
      ],
    }, {
      subjectIdentifier: animalCardDid,
      targets: [
        { owner: 'controller', channel: 'push', address: 'push:animal-controller', verified: true, enabled: true },
      ],
    }],
  });

  assert.deepEqual(targets.map(({ channel, address }) => `${channel}:${address}`), [
    'push:push:device-1',
    `sms:${REPOSITORY_SAFE_EXAMPLES.phoneE164}`,
    `voice:${REPOSITORY_SAFE_EXAMPLES.phoneE164}`,
    'push:push:animal-controller',
  ]);
});
