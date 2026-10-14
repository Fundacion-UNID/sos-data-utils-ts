// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

/** Canonical Schema.org flat claims for a persistent Place. */
export enum SchemaOrgPlaceClaim {
  identifier = 'org.schema.Place.identifier',
  identifierPropertyId = 'org.schema.Place.identifier.propertyID',
  identifierValue = 'org.schema.Place.identifier.value',
  additionalType = 'org.schema.Place.additionalType',
  name = 'org.schema.Place.name',
  description = 'org.schema.Place.description',
  sameAs = 'org.schema.Place.sameAs',
  addressCountry = 'org.schema.Place.address.addressCountry',
  addressRegion = 'org.schema.Place.address.addressRegion',
  addressLocality = 'org.schema.Place.address.addressLocality',
  extendedAddress = 'org.schema.Place.address.extendedAddress',
  postalCode = 'org.schema.Place.address.postalCode',
  streetAddress = 'org.schema.Place.address.streetAddress',
  latitude = 'org.schema.Place.geo.latitude',
  longitude = 'org.schema.Place.geo.longitude',
  elevation = 'org.schema.Place.geo.elevation',
  containedInPlaceIdentifier = 'org.schema.Place.containedInPlace.identifier',
}

/**
 * Canonical Schema.org flat claims for an immutable Event.
 *
 * `about` identifies the moving IndividualProduct and `location` identifies
 * the persistent Place at which the device was observed.
 */
export enum SchemaOrgEventClaim {
  identifier = 'org.schema.Event.identifier',
  identifierPropertyId = 'org.schema.Event.identifier.propertyID',
  identifierValue = 'org.schema.Event.identifier.value',
  additionalType = 'org.schema.Event.additionalType',
  name = 'org.schema.Event.name',
  description = 'org.schema.Event.description',
  startDate = 'org.schema.Event.startDate',
  endDate = 'org.schema.Event.endDate',
  aboutIdentifier = 'org.schema.Event.about.identifier',
  aboutIdentifierPropertyId = 'org.schema.Event.about.identifier.propertyID',
  aboutIdentifierValue = 'org.schema.Event.about.identifier.value',
  locationIdentifier = 'org.schema.Event.location.identifier',
  locationIdentifierPropertyId = 'org.schema.Event.location.identifier.propertyID',
  locationIdentifierValue = 'org.schema.Event.location.identifier.value',
  locationLatitude = 'org.schema.Event.location.geo.latitude',
  locationLongitude = 'org.schema.Event.location.geo.longitude',
  locationElevation = 'org.schema.Event.location.geo.elevation',
}

/** Schema.org IndividualProduct claims used for concrete devices and vehicles. */
export enum SchemaOrgIndividualProductClaim {
  identifier = 'org.schema.IndividualProduct.identifier',
  identifierPropertyId = 'org.schema.IndividualProduct.identifier.propertyID',
  identifierValue = 'org.schema.IndividualProduct.identifier.value',
  additionalType = 'org.schema.IndividualProduct.additionalType',
  audienceIdentifier = 'org.schema.IndividualProduct.audience.identifier',
  audienceType = 'org.schema.IndividualProduct.audience.audienceType',
  category = 'org.schema.IndividualProduct.category',
  name = 'org.schema.IndividualProduct.name',
  productID = 'org.schema.IndividualProduct.productID',
  serialNumber = 'org.schema.IndividualProduct.serialNumber',
}

export const DevicePlaceObservationEventType = 'DevicePlaceObservationEvent';

export type FlatClaimValue = string | number;
export type FlatClaims = Readonly<Record<string, FlatClaimValue>>;

export type PlaceInput = Readonly<{
  identifier: string;
  identifierValue: string;
  name: string;
  additionalType?: string;
  description?: string;
  sameAs?: string;
  addressCountry?: string;
  addressRegion?: string;
  addressLocality?: string;
  extendedAddress?: string;
  postalCode?: string;
  streetAddress?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  containedInPlaceIdentifier?: string;
}>;

export type IndividualProductInput = Readonly<{
  identifier: string;
  identifierValue: string;
  name: string;
  additionalType?: string;
  /** UHC/VetChain card or subject identifiers that receive messages forwarded by this product. */
  audienceIdentifiers?: readonly string[];
  audienceType?: string;
  category?: string;
  productID?: string;
  /** Manufacturer serial number. A Bluetooth MAC belongs in the protected beacon registry instead. */
  serialNumber?: string;
}>;

export const PlaceKinds = {
  Site: 'site',
  Building: 'building',
  Floor: 'floor',
  House: 'house',
  Apartment: 'apartment',
  Office: 'office',
  Room: 'room',
  Garage: 'garage',
  ParkingSpace: 'parking-space',
  Farm: 'farm',
  Factory: 'factory',
  Vehicle: 'vehicle',
} as const;

export type PlaceKind = typeof PlaceKinds[keyof typeof PlaceKinds];

/** UI contract for registering a new Place inside one country/region/postcode search scope. */
export type PlaceRegistrationInput = Readonly<{
  identifier: string;
  identifierValue: string;
  kind: PlaceKind;
  name: string;
  countryCode: string;
  regionCode: string;
  postalCode: string;
  locality: string;
  streetAddress: string;
  extendedAddress?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  parentPlaceIdentifier?: string;
}>;

export type PlaceBeacon = Readonly<{
  deviceIdentifier: string;
  bluetoothMacId: string;
  placeIdentifier: string;
  placeIdentifierValue: string;
  latitude: number;
  longitude: number;
  elevation?: number;
}>;

export type BeaconSighting = Readonly<{
  bluetoothMacId: string;
  rssi: number;
}>;

export type DevicePlaceEventInput = Readonly<{
  eventIdentifier: string;
  eventIdentifierValue: string;
  deviceIdentifier: string;
  deviceIdentifierValue: string;
  placeIdentifier: string;
  placeIdentifierValue: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  elevation?: number;
}>;

export type ProximityResolutionInput = Readonly<{
  eventIdentifier: string;
  eventIdentifierValue: string;
  movingDeviceIdentifier: string;
  movingDeviceIdentifierValue: string;
  observedAt: string;
  now?: string;
  maxAgeMs?: number;
  minimumRssi?: number;
  beacons: readonly PlaceBeacon[];
  sightings: readonly BeaconSighting[];
}>;

export type ResolvedProximity = Readonly<{
  beacon: PlaceBeacon;
  rssi: number;
  observedAt: string;
  eventClaims: FlatClaims;
}>;

export type EmergencyNotificationChannel = 'push' | 'sms' | 'email' | 'voice';
export type EmergencyNotificationOwner = 'subject' | 'controller';

export type EmergencyNotificationTarget = Readonly<{
  owner: EmergencyNotificationOwner;
  channel: EmergencyNotificationChannel;
  address: string;
  verified: boolean;
  enabled: boolean;
}>;

export type SubjectNotificationDirectoryEntry = Readonly<{
  subjectIdentifier: string;
  targets: readonly EmergencyNotificationTarget[];
}>;

const UUID_VALUE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BLUETOOTH_MAC_PATTERN = /^[0-9A-F]{12}$/;

function requiredText(value: unknown, field: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new TypeError(`${field} is required`);
  return normalized;
}

function optionalText(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
}

function assertUuidUrnPair(identifier: string, value: string, field: string): void {
  if (!UUID_VALUE_PATTERN.test(value) || identifier.toLowerCase() !== `urn:uuid:${value.toLowerCase()}`) {
    throw new TypeError(`${field} must use one matching canonical UUID URN and UUID value`);
  }
}

function assertCoordinate(value: number, minimum: number, maximum: number, field: string): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new TypeError(`${field} must be between ${minimum} and ${maximum}`);
  }
}

function assertDateTime(value: string, field: string): void {
  if (!value || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(`${field} must be a valid date-time`);
  }
}

/** Encodes the flat audience claim without allowing ambiguous comma-bearing identifiers. */
export function encodeAudienceIdentifiers(values: readonly string[]): string {
  const unique = new Set<string>();
  for (const value of values ?? []) {
    const identifier = requiredText(value, 'audience identifier');
    if (identifier.includes(',')) {
      throw new TypeError('audience identifiers cannot contain commas');
    }
    unique.add(identifier);
  }
  return Array.from(unique).join(',');
}

/** Decodes the ordered, de-duplicated audience identifiers stored in one flat claim. */
export function decodeAudienceIdentifiers(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return Array.from(new Set(value.split(',').map((item) => item.trim()).filter(Boolean)));
}

/** Builds the claims-first Place that projects to FHIR Location when needed. */
export function buildPlaceClaims(input: PlaceInput): FlatClaims {
  const identifier = requiredText(input.identifier, 'identifier');
  const identifierValue = requiredText(input.identifierValue, 'identifierValue');
  assertUuidUrnPair(identifier, identifierValue, 'Place identifier');
  assertCoordinate(input.latitude, -90, 90, 'latitude');
  assertCoordinate(input.longitude, -180, 180, 'longitude');

  const claims: Record<string, FlatClaimValue> = {
    [SchemaOrgPlaceClaim.identifier]: identifier,
    [SchemaOrgPlaceClaim.identifierPropertyId]: 'UUID',
    [SchemaOrgPlaceClaim.identifierValue]: identifierValue,
    [SchemaOrgPlaceClaim.name]: requiredText(input.name, 'name'),
    [SchemaOrgPlaceClaim.latitude]: input.latitude,
    [SchemaOrgPlaceClaim.longitude]: input.longitude,
  };

  const textValues: ReadonlyArray<readonly [SchemaOrgPlaceClaim, unknown]> = [
    [SchemaOrgPlaceClaim.additionalType, input.additionalType],
    [SchemaOrgPlaceClaim.description, input.description],
    [SchemaOrgPlaceClaim.sameAs, input.sameAs],
    [SchemaOrgPlaceClaim.addressCountry, input.addressCountry],
    [SchemaOrgPlaceClaim.addressRegion, input.addressRegion],
    [SchemaOrgPlaceClaim.addressLocality, input.addressLocality],
    [SchemaOrgPlaceClaim.extendedAddress, input.extendedAddress],
    [SchemaOrgPlaceClaim.postalCode, input.postalCode],
    [SchemaOrgPlaceClaim.streetAddress, input.streetAddress],
    [SchemaOrgPlaceClaim.containedInPlaceIdentifier, input.containedInPlaceIdentifier],
  ];
  for (const [key, value] of textValues) {
    const normalized = optionalText(value);
    if (normalized) claims[key] = normalized;
  }
  if (input.elevation !== undefined) {
    if (!Number.isFinite(input.elevation)) throw new TypeError('elevation must be finite');
    claims[SchemaOrgPlaceClaim.elevation] = input.elevation;
  }
  return claims;
}

/** Builds one device or vehicle IndividualProduct without exposing Bluetooth lookup material. */
export function buildIndividualProductClaims(
  input: IndividualProductInput,
): FlatClaims {
  const identifier = requiredText(input.identifier, 'identifier');
  const identifierValue = requiredText(input.identifierValue, 'identifierValue');
  assertUuidUrnPair(identifier, identifierValue, 'Device identifier');
  const claims: Record<string, FlatClaimValue> = {
    [SchemaOrgIndividualProductClaim.identifier]: identifier,
    [SchemaOrgIndividualProductClaim.identifierPropertyId]: 'UUID',
    [SchemaOrgIndividualProductClaim.identifierValue]: identifierValue,
    [SchemaOrgIndividualProductClaim.name]: requiredText(input.name, 'name'),
  };
  const additionalType = optionalText(input.additionalType);
  const audienceIdentifiers = encodeAudienceIdentifiers(input.audienceIdentifiers ?? []);
  const audienceType = optionalText(input.audienceType);
  const category = optionalText(input.category);
  const productID = optionalText(input.productID);
  const serialNumber = optionalText(input.serialNumber);
  if (additionalType) claims[SchemaOrgIndividualProductClaim.additionalType] = additionalType;
  if (audienceIdentifiers) claims[SchemaOrgIndividualProductClaim.audienceIdentifier] = audienceIdentifiers;
  if (audienceType) claims[SchemaOrgIndividualProductClaim.audienceType] = audienceType;
  if (category) claims[SchemaOrgIndividualProductClaim.category] = category;
  if (productID) claims[SchemaOrgIndividualProductClaim.productID] = productID;
  if (serialNumber) claims[SchemaOrgIndividualProductClaim.serialNumber] = serialNumber;
  return claims;
}

/** Normalizes one Place form before duplicate lookup and claims submission. */
export function createPlaceRegistrationInput(
  input: PlaceRegistrationInput,
): PlaceRegistrationInput {
  const identifier = requiredText(input.identifier, 'identifier');
  const identifierValue = requiredText(input.identifierValue, 'identifierValue');
  assertUuidUrnPair(identifier, identifierValue, 'Place identifier');
  const countryCode = requiredText(input.countryCode, 'countryCode').toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new TypeError('countryCode must be ISO 3166-1 alpha-2');
  }
  const regionCode = requiredText(input.regionCode, 'regionCode').toUpperCase();
  if (!regionCode.startsWith(`${countryCode}-`) || regionCode.length < 4) {
    throw new TypeError('regionCode must be an ISO 3166-2 code for countryCode');
  }
  if (!Object.values(PlaceKinds).includes(input.kind)) {
    throw new TypeError('kind is not a supported Place kind');
  }
  const parentPlaceIdentifier = optionalText(input.parentPlaceIdentifier);
  if (parentPlaceIdentifier) {
    const parentUuid = parentPlaceIdentifier.replace(/^urn:uuid:/i, '');
    assertUuidUrnPair(parentPlaceIdentifier, parentUuid, 'Parent Place identifier');
    if (parentPlaceIdentifier.toLowerCase() === identifier.toLowerCase()) {
      throw new TypeError('Place cannot contain itself');
    }
  }
  assertCoordinate(input.latitude, -90, 90, 'latitude');
  assertCoordinate(input.longitude, -180, 180, 'longitude');
  return {
    identifier,
    identifierValue,
    kind: input.kind,
    name: requiredText(input.name, 'name'),
    countryCode,
    regionCode,
    postalCode: requiredText(input.postalCode, 'postalCode').toUpperCase(),
    locality: requiredText(input.locality, 'locality'),
    streetAddress: requiredText(input.streetAddress, 'streetAddress'),
    extendedAddress: optionalText(input.extendedAddress),
    latitude: input.latitude,
    longitude: input.longitude,
    elevation: input.elevation,
    parentPlaceIdentifier,
  };
}

/** Builds the Schema.org claims submitted when the personal UI registers a Place. */
export function buildPlaceRegistrationClaims(
  input: PlaceRegistrationInput,
): FlatClaims {
  const normalized = createPlaceRegistrationInput(input);
  return buildPlaceClaims({
    identifier: normalized.identifier,
    identifierValue: normalized.identifierValue,
    name: normalized.name,
    additionalType: normalized.kind,
    addressCountry: normalized.countryCode,
    addressRegion: normalized.regionCode,
    addressLocality: normalized.locality,
    postalCode: normalized.postalCode,
    streetAddress: normalized.streetAddress,
    extendedAddress: normalized.extendedAddress,
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    elevation: normalized.elevation,
    containedInPlaceIdentifier: normalized.parentPlaceIdentifier,
  });
}

/** Normalizes a 48-bit Bluetooth MAC identifier for protected registry lookup. */
export function normalizeBluetoothMacId(value: string): string {
  const compact = requiredText(value, 'bluetoothMacId').replace(/[:-]/g, '').toUpperCase();
  if (!BLUETOOTH_MAC_PATTERN.test(compact)) {
    throw new TypeError('bluetoothMacId must be one 48-bit Bluetooth MAC identifier');
  }
  return compact.match(/.{2}/g)!.join(':');
}

/** Registers a fixed Bluetooth beacon against one persistent Place. */
export function createPlaceBeacon(input: PlaceBeacon): PlaceBeacon {
  const deviceIdentifier = requiredText(input.deviceIdentifier, 'deviceIdentifier');
  const deviceUuid = deviceIdentifier.replace(/^urn:uuid:/i, '');
  assertUuidUrnPair(deviceIdentifier, deviceUuid, 'Beacon device identifier');
  const placeIdentifier = requiredText(input.placeIdentifier, 'placeIdentifier');
  const placeIdentifierValue = requiredText(input.placeIdentifierValue, 'placeIdentifierValue');
  assertUuidUrnPair(placeIdentifier, placeIdentifierValue, 'Place identifier');
  assertCoordinate(input.latitude, -90, 90, 'latitude');
  assertCoordinate(input.longitude, -180, 180, 'longitude');
  if (input.elevation !== undefined && !Number.isFinite(input.elevation)) {
    throw new TypeError('elevation must be finite');
  }

  return {
    deviceIdentifier,
    bluetoothMacId: normalizeBluetoothMacId(input.bluetoothMacId),
    placeIdentifier,
    placeIdentifierValue,
    latitude: input.latitude,
    longitude: input.longitude,
    elevation: input.elevation,
  };
}

/** Builds one immutable Event about a device observed at a Place. */
export function buildDevicePlaceEventClaims(
  input: DevicePlaceEventInput,
): FlatClaims {
  const eventIdentifier = requiredText(input.eventIdentifier, 'eventIdentifier');
  const eventIdentifierValue = requiredText(input.eventIdentifierValue, 'eventIdentifierValue');
  const deviceIdentifier = requiredText(input.deviceIdentifier, 'deviceIdentifier');
  const deviceIdentifierValue = requiredText(input.deviceIdentifierValue, 'deviceIdentifierValue');
  const placeIdentifier = requiredText(input.placeIdentifier, 'placeIdentifier');
  const placeIdentifierValue = requiredText(input.placeIdentifierValue, 'placeIdentifierValue');
  assertUuidUrnPair(eventIdentifier, eventIdentifierValue, 'Event identifier');
  assertUuidUrnPair(deviceIdentifier, deviceIdentifierValue, 'Device identifier');
  assertUuidUrnPair(placeIdentifier, placeIdentifierValue, 'Place identifier');
  assertDateTime(input.observedAt, 'observedAt');
  assertCoordinate(input.latitude, -90, 90, 'latitude');
  assertCoordinate(input.longitude, -180, 180, 'longitude');

  const claims: Record<string, FlatClaimValue> = {
    [SchemaOrgEventClaim.identifier]: eventIdentifier,
    [SchemaOrgEventClaim.identifierPropertyId]: 'UUID',
    [SchemaOrgEventClaim.identifierValue]: eventIdentifierValue,
    [SchemaOrgEventClaim.additionalType]: DevicePlaceObservationEventType,
    [SchemaOrgEventClaim.name]: 'Device observed at place',
    [SchemaOrgEventClaim.startDate]: input.observedAt,
    [SchemaOrgEventClaim.aboutIdentifier]: deviceIdentifier,
    [SchemaOrgEventClaim.aboutIdentifierPropertyId]: 'UUID',
    [SchemaOrgEventClaim.aboutIdentifierValue]: deviceIdentifierValue,
    [SchemaOrgEventClaim.locationIdentifier]: placeIdentifier,
    [SchemaOrgEventClaim.locationIdentifierPropertyId]: 'UUID',
    [SchemaOrgEventClaim.locationIdentifierValue]: placeIdentifierValue,
    [SchemaOrgEventClaim.locationLatitude]: input.latitude,
    [SchemaOrgEventClaim.locationLongitude]: input.longitude,
  };
  if (input.elevation !== undefined) {
    if (!Number.isFinite(input.elevation)) throw new TypeError('elevation must be finite');
    claims[SchemaOrgEventClaim.locationElevation] = input.elevation;
  }
  return claims;
}

/**
 * Resolves the strongest fresh known beacon into a device-at-Place Event.
 *
 * RSSI is only an MVP proximity heuristic; callers must not interpret it as a
 * precise distance measurement. Unknown beacons never create Places.
 */
export function resolveNearestPlace(
  input: ProximityResolutionInput,
): ResolvedProximity | undefined {
  assertDateTime(input.observedAt, 'observedAt');
  const now = input.now ? requiredText(input.now, 'now') : new Date().toISOString();
  assertDateTime(now, 'now');
  const maxAgeMs = input.maxAgeMs ?? 30_000;
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) throw new TypeError('maxAgeMs must be non-negative');
  if (Math.abs(Date.parse(now) - Date.parse(input.observedAt)) > maxAgeMs) return undefined;

  const minimumRssi = input.minimumRssi ?? -100;
  const beaconByMac = new Map(
    input.beacons.map((beacon) => {
      const normalized = createPlaceBeacon(beacon);
      return [normalized.bluetoothMacId, normalized] as const;
    }),
  );
  const candidates = input.sightings
    .map((sighting) => ({
      beacon: beaconByMac.get(normalizeBluetoothMacId(sighting.bluetoothMacId)),
      rssi: sighting.rssi,
    }))
    .filter((candidate): candidate is { beacon: PlaceBeacon; rssi: number } =>
      Boolean(candidate.beacon) && Number.isFinite(candidate.rssi) && candidate.rssi >= minimumRssi)
    .sort((left, right) => right.rssi - left.rssi || left.beacon.bluetoothMacId.localeCompare(right.beacon.bluetoothMacId));

  const nearest = candidates[0];
  if (!nearest) return undefined;

  return {
    beacon: nearest.beacon,
    rssi: nearest.rssi,
    observedAt: input.observedAt,
    eventClaims: buildDevicePlaceEventClaims({
      eventIdentifier: input.eventIdentifier,
      eventIdentifierValue: input.eventIdentifierValue,
      deviceIdentifier: input.movingDeviceIdentifier,
      deviceIdentifierValue: input.movingDeviceIdentifierValue,
      placeIdentifier: nearest.beacon.placeIdentifier,
      placeIdentifierValue: nearest.beacon.placeIdentifierValue,
      observedAt: input.observedAt,
      latitude: nearest.beacon.latitude,
      longitude: nearest.beacon.longitude,
      elevation: nearest.beacon.elevation,
    }),
  };
}

/** Selects verified emergency channels from one located IndividualProduct audience. */
export function selectEmergencyNotificationTargets(input: Readonly<{
  individualProductClaims: Readonly<Record<string, unknown>>;
  directory: readonly SubjectNotificationDirectoryEntry[];
}>): EmergencyNotificationTarget[] {
  requiredText(
    input.individualProductClaims[SchemaOrgIndividualProductClaim.identifier],
    SchemaOrgIndividualProductClaim.identifier,
  );
  const subjectIdentifiers = new Set(decodeAudienceIdentifiers(
    input.individualProductClaims[SchemaOrgIndividualProductClaim.audienceIdentifier],
  ));
  const seen = new Set<string>();
  const selected: EmergencyNotificationTarget[] = [];

  for (const entry of input.directory) {
    if (!subjectIdentifiers.has(entry.subjectIdentifier)) continue;
    for (const target of entry.targets) {
      const address = optionalText(target.address);
      if (!target.enabled || !target.verified || !address) continue;
      const key = `${target.channel}\u0000${address}`;
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push({ ...target, address });
    }
  }
  return selected;
}

