import { DataspaceSectors } from 'gdc-common-utils-ts/constants/sectors';

/**
 * Operational sectors shared by SOS, Vet and UHC extensions.
 *
 * These values classify the Organization that employs the requester. They are
 * not target clinical-data sectors and grant no authority by themselves.
 */
export const CrossSectorOperationalSectors = Object.freeze({
  PublicHealth: 'public-health',
  /** @deprecated Use `public-health` for new municipal responder organizations. */
  PublicSafety: 'public-safety',
  PassengerTransport: 'passenger-transport',
} as const);

export type CrossSectorOperationalSector =
  (typeof CrossSectorOperationalSectors)[keyof typeof CrossSectorOperationalSectors];

/** Data channels that a governed cross-sector employee may ask to access. */
export const CrossSectorTargetChannels = Object.freeze({
  AnimalCare: DataspaceSectors.AnimalCare,
  HealthCare: DataspaceSectors.HealthCare,
} as const);

export type CrossSectorTargetChannel =
  (typeof CrossSectorTargetChannels)[keyof typeof CrossSectorTargetChannels];

const TARGETS_BY_OPERATIONAL_SECTOR: Readonly<
  Record<CrossSectorOperationalSector, readonly CrossSectorTargetChannel[]>
> = Object.freeze({
  [CrossSectorOperationalSectors.PublicHealth]: Object.freeze([
    CrossSectorTargetChannels.AnimalCare,
    CrossSectorTargetChannels.HealthCare,
  ]),
  [CrossSectorOperationalSectors.PublicSafety]: Object.freeze([
    CrossSectorTargetChannels.AnimalCare,
    CrossSectorTargetChannels.HealthCare,
  ]),
  [CrossSectorOperationalSectors.PassengerTransport]: Object.freeze([
    CrossSectorTargetChannels.AnimalCare,
    CrossSectorTargetChannels.HealthCare,
  ]),
});

/**
 * Returns only the target data channels governed for the source Organization
 * sector. Product policy must still validate the employee role, exact subject,
 * jurisdiction, purpose, section, action, active Consent and SMART grant.
 */
export function operationalSectorTargetChannels(sourceSector: unknown): readonly CrossSectorTargetChannel[] {
  const normalized = String(sourceSector ?? '').trim().toLowerCase() as CrossSectorOperationalSector;
  return TARGETS_BY_OPERATIONAL_SECTOR[normalized] ?? Object.freeze([]);
}

/** Fails closed when a source sector or target channel is not governed. */
export function canOperationalSectorRequestChannel(sourceSector: unknown, targetChannel: unknown): boolean {
  const normalizedTarget = String(targetChannel ?? '').trim().toLowerCase();
  return operationalSectorTargetChannels(sourceSector).some(channel => channel === normalizedTarget);
}
