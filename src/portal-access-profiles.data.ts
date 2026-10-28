import { HealthcareActorRoles } from 'gdc-common-utils-ts/constants/healthcare'
import { DataspaceSectors } from 'gdc-common-utils-ts/constants/sectors'
import { CrossSectorOperationalSectors } from './cross-sector-access-policy.js'
import {
  EmergencyProfessionalRoleIds,
  EmergencyProfessionalRoles,
} from './emergency-professional-roles.js'
import { REPOSITORY_SAFE_EXAMPLES } from './repository-privacy.js'
import { MultichannelPermissionRoleClaims } from './multichannel-permission-forms.js'

/** Entry paths shown by SOSChain portals. A path never grants clinical access. */
export const SoschainPortalAccessModeIds = Object.freeze({
  Personal: 'personal',
  Partner: 'partner',
  TestNetwork: 'test-network',
  Demo: 'demo',
} as const)

export type SoschainPortalAccessModeId =
  typeof SoschainPortalAccessModeIds[keyof typeof SoschainPortalAccessModeIds]

export type SoschainPortalDataKind = 'real' | 'synthetic-persistent' | 'synthetic-resettable'
export type SoschainPortalLedgerKind = 'production' | 'test-network' | 'mock'

export type SoschainPortalAccessMode = Readonly<{
  id: SoschainPortalAccessModeId
  audience: 'personal' | 'professional' | 'both'
  /** All modes render the same portal; only adapters and authorized data differ. */
  portalShell: 'shared'
  dataKind: SoschainPortalDataKind
  ledgerKind: SoschainPortalLedgerKind
  requiresTrustedLogin: boolean
  resetPolicy: 'provider-managed' | 'test-network-managed' | 'periodic-demo-reset'
}>

/**
 * Shared mode metadata used by Personal and Professional entry choosers.
 * `demo` is isolated and resettable; it must never be presented as provider data.
 */
export const SOSCHAIN_PORTAL_ACCESS_MODES: readonly SoschainPortalAccessMode[] = Object.freeze([
  Object.freeze({
    id: SoschainPortalAccessModeIds.Personal,
    audience: 'personal',
    portalShell: 'shared',
    dataKind: 'real',
    ledgerKind: 'production',
    requiresTrustedLogin: true,
    resetPolicy: 'provider-managed',
  }),
  Object.freeze({
    id: SoschainPortalAccessModeIds.Partner,
    audience: 'professional',
    portalShell: 'shared',
    dataKind: 'real',
    ledgerKind: 'production',
    requiresTrustedLogin: true,
    resetPolicy: 'provider-managed',
  }),
  Object.freeze({
    id: SoschainPortalAccessModeIds.TestNetwork,
    audience: 'both',
    portalShell: 'shared',
    dataKind: 'synthetic-persistent',
    ledgerKind: 'test-network',
    requiresTrustedLogin: true,
    resetPolicy: 'test-network-managed',
  }),
  Object.freeze({
    id: SoschainPortalAccessModeIds.Demo,
    audience: 'both',
    portalShell: 'shared',
    dataKind: 'synthetic-resettable',
    ledgerKind: 'mock',
    requiresTrustedLogin: false,
    resetPolicy: 'periodic-demo-reset',
  }),
])

export const SoschainProfessionalDemoSectorIds = Object.freeze({
  HealthCare: DataspaceSectors.HealthCare,
  AnimalCare: DataspaceSectors.AnimalCare,
  PublicHealth: CrossSectorOperationalSectors.PublicHealth,
  PublicSafety: CrossSectorOperationalSectors.PublicSafety,
} as const)

export type SoschainProfessionalDemoSectorId =
  typeof SoschainProfessionalDemoSectorIds[keyof typeof SoschainProfessionalDemoSectorIds]

export const SoschainProfessionalDemoProfileIds = Object.freeze({
  Doctor: 'doctor',
  Nurse: 'nurse',
  Paramedic: EmergencyProfessionalRoleIds.Paramedic,
  MedicalSecretary: 'medical-secretary',
  Veterinarian: 'veterinarian',
  VeterinaryAssistant: 'veterinary-assistant',
  Receptionist: 'receptionist',
  Firefighter: EmergencyProfessionalRoleIds.Firefighter,
  PoliceOfficer: EmergencyProfessionalRoleIds.PoliceOfficer,
  Lifeguard: EmergencyProfessionalRoleIds.Lifeguard,
  Researcher: 'researcher',
} as const)

export type SoschainProfessionalDemoProfileId =
  typeof SoschainProfessionalDemoProfileIds[keyof typeof SoschainProfessionalDemoProfileIds]

export type SoschainProfessionalDemoProfile = Readonly<{
  id: SoschainProfessionalDemoProfileId
  sector: SoschainProfessionalDemoSectorId
  roleClaim: string
  titleEn: string
  enabled: boolean
  grantsAuthority: false
}>

const demoProfile = (
  id: SoschainProfessionalDemoProfileId,
  sector: SoschainProfessionalDemoSectorId,
  roleClaim: string,
  titleEn: string,
  enabled: boolean,
): SoschainProfessionalDemoProfile => Object.freeze({
  id,
  sector,
  roleClaim,
  titleEn,
  enabled,
  grantsAuthority: false,
})

/**
 * Presentation profiles for exercising portal homes with synthetic data.
 * Occupation claims are canonical, but selection is never proof of employment,
 * licence, PractitionerRole, Consent or SMART authorization.
 */
export const SOSCHAIN_PROFESSIONAL_DEMO_PROFILES: readonly SoschainProfessionalDemoProfile[] = Object.freeze([
  demoProfile(
    SoschainProfessionalDemoProfileIds.Doctor,
    SoschainProfessionalDemoSectorIds.HealthCare,
    HealthcareActorRoles.MedicalDoctors,
    'Doctor',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.Nurse,
    SoschainProfessionalDemoSectorIds.HealthCare,
    HealthcareActorRoles.NursingProfessional,
    'Nurse',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.Paramedic,
    SoschainProfessionalDemoSectorIds.HealthCare,
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.Paramedic].claim,
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.Paramedic].titleEn,
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.MedicalSecretary,
    SoschainProfessionalDemoSectorIds.HealthCare,
    HealthcareActorRoles.MedicalSecretary,
    'Medical secretary',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.Veterinarian,
    SoschainProfessionalDemoSectorIds.AnimalCare,
    HealthcareActorRoles.Veterinarian,
    'Veterinarian',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.VeterinaryAssistant,
    SoschainProfessionalDemoSectorIds.AnimalCare,
    HealthcareActorRoles.VeterinaryTechnicianOrAssistant,
    'Veterinary assistant',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.Receptionist,
    SoschainProfessionalDemoSectorIds.AnimalCare,
    HealthcareActorRoles.Receptionist,
    'Receptionist',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.Doctor,
    SoschainProfessionalDemoSectorIds.PublicHealth,
    HealthcareActorRoles.MedicalDoctors,
    'Doctor',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.Nurse,
    SoschainProfessionalDemoSectorIds.PublicHealth,
    HealthcareActorRoles.NursingProfessional,
    'Nurse',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.MedicalSecretary,
    SoschainProfessionalDemoSectorIds.PublicHealth,
    HealthcareActorRoles.MedicalSecretary,
    'Administrative assistant',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.Researcher,
    SoschainProfessionalDemoSectorIds.PublicHealth,
    MultichannelPermissionRoleClaims.Researcher,
    'Researcher',
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.Firefighter,
    SoschainProfessionalDemoSectorIds.PublicSafety,
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.Firefighter].claim,
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.Firefighter].titleEn,
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.PoliceOfficer,
    SoschainProfessionalDemoSectorIds.PublicSafety,
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.PoliceOfficer].claim,
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.PoliceOfficer].titleEn,
    true,
  ),
  demoProfile(
    SoschainProfessionalDemoProfileIds.Lifeguard,
    SoschainProfessionalDemoSectorIds.PublicSafety,
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.Lifeguard].claim,
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.Lifeguard].titleEn,
    true,
  ),
])

export const SoschainDemoDepartmentIds = Object.freeze({
  Emergency: 'emergency',
  PublicInformation: 'public-information',
} as const)

export type SoschainDemoDepartmentId =
  typeof SoschainDemoDepartmentIds[keyof typeof SoschainDemoDepartmentIds]

export type SoschainDemoDepartment = Readonly<{
  id: SoschainDemoDepartmentId
  sector: SoschainProfessionalDemoSectorId
  titleEn: string
  grantsAuthority: false
}>

/** Optional demo workspace context. Provider departments remain organization-owned. */
export const SOSCHAIN_DEMO_DEPARTMENTS: readonly SoschainDemoDepartment[] = Object.freeze([
  Object.freeze({
    id: SoschainDemoDepartmentIds.Emergency,
    sector: DataspaceSectors.HealthCare,
    titleEn: 'Emergency department',
    grantsAuthority: false,
  }),
  Object.freeze({
    id: SoschainDemoDepartmentIds.Emergency,
    sector: DataspaceSectors.AnimalCare,
    titleEn: 'Veterinary emergency department',
    grantsAuthority: false,
  }),
  Object.freeze({
    id: SoschainDemoDepartmentIds.PublicInformation,
    sector: SoschainProfessionalDemoSectorIds.PublicHealth,
    titleEn: 'Public information service',
    grantsAuthority: false,
  }),
  Object.freeze({
    id: SoschainDemoDepartmentIds.Emergency,
    sector: SoschainProfessionalDemoSectorIds.PublicSafety,
    titleEn: 'Emergency response unit',
    grantsAuthority: false,
  }),
])

export type SoschainDemoOrganization = Readonly<{
  sector: SoschainProfessionalDemoSectorId
  organizationUrn: `urn:uuid:${string}`
  titleEn: string
  grantsAuthority: false
}>

const demoOrganization = (
  sector: SoschainProfessionalDemoSectorId,
  uuid: string,
  titleEn: string,
): SoschainDemoOrganization => Object.freeze({
  sector,
  organizationUrn: `urn:uuid:${uuid}`,
  titleEn,
  grantsAuthority: false,
})

/** Stable synthetic organizations used only by the resettable Demo adapter. */
export const SOSCHAIN_DEMO_ORGANIZATIONS: readonly SoschainDemoOrganization[] = Object.freeze([
  demoOrganization(SoschainProfessionalDemoSectorIds.HealthCare, REPOSITORY_SAFE_EXAMPLES.demoOrganizationUuids.healthCare, 'Example health-care organization'),
  demoOrganization(SoschainProfessionalDemoSectorIds.AnimalCare, REPOSITORY_SAFE_EXAMPLES.demoOrganizationUuids.animalCare, 'Example animal-care organization'),
  demoOrganization(SoschainProfessionalDemoSectorIds.PublicHealth, REPOSITORY_SAFE_EXAMPLES.demoOrganizationUuids.publicHealth, 'Example public-health organization'),
  demoOrganization(SoschainProfessionalDemoSectorIds.PublicSafety, REPOSITORY_SAFE_EXAMPLES.demoOrganizationUuids.publicSafety, 'Example public-safety organization'),
])

/** Returns only currently enabled profiles for an exact governed sector. */
export function getSoschainDemoProfilesForSector(
  sector: unknown,
): readonly SoschainProfessionalDemoProfile[] {
  return Object.freeze(SOSCHAIN_PROFESSIONAL_DEMO_PROFILES.filter(
    profile => profile.enabled && profile.sector === sector,
  ))
}
