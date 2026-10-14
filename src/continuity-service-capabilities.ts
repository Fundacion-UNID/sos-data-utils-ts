import { ServiceCapability } from 'gdc-common-utils-ts/constants/service-capabilities';

/**
 * Cross-sector provider capabilities advertised through
 * `org.schema.Service.serviceType` and projected as DCAT data services.
 *
 * DocumentReference is the primary personal-backup capability. ImagingStudy
 * and Binary are optional supported content families and must not be
 * advertised until their corresponding service operations are available.
 */
export const ContinuityServiceCapability = Object.freeze({
  IndexProvider: ServiceCapability.IndexProvider,
  DocumentBackupProvider: 'organization/DocumentReference.cruds',
  ImagingStudyProvider: 'organization/ImagingStudy.cruds',
  BinaryObjectProvider: 'organization/Binary.cruds',
  DigitalTwinProvider: ServiceCapability.DigitalTwinProvider,
} as const);

export type ContinuityServiceCapabilityValue =
  typeof ContinuityServiceCapability[keyof typeof ContinuityServiceCapability];

export const SERVICE_OFFERING_ROLES = Object.freeze([
  'index',
  'personal-backup',
  'digital-twin',
] as const);

export type ServiceOfferingRole = typeof SERVICE_OFFERING_ROLES[number];

const ROLE_BY_CAPABILITY: Readonly<Record<ContinuityServiceCapabilityValue, ServiceOfferingRole>> = Object.freeze({
  [ContinuityServiceCapability.IndexProvider]: 'index',
  [ContinuityServiceCapability.DocumentBackupProvider]: 'personal-backup',
  [ContinuityServiceCapability.ImagingStudyProvider]: 'personal-backup',
  [ContinuityServiceCapability.BinaryObjectProvider]: 'personal-backup',
  [ContinuityServiceCapability.DigitalTwinProvider]: 'digital-twin',
});

/** Returns the independently selectable service role for a governed provider capability. */
export const getServiceOfferingRole = (capability: string | undefined | null): ServiceOfferingRole | undefined =>
  ROLE_BY_CAPABILITY[String(capability || '').trim() as ContinuityServiceCapabilityValue];

/** Rejects reader scopes and unrelated SMART permissions at the catalog boundary. */
export const isContinuityProviderCapability = (
  capability: string | undefined | null,
): capability is ContinuityServiceCapabilityValue => getServiceOfferingRole(capability) !== undefined;
