import {
  SoschainProfessionalDemoProfileIds,
  type SoschainProfessionalDemoProfileId,
} from './portal-access-profiles.data.js'

export const ProfessionalDemoSectionIds = Object.freeze({ Journey: 'journey', Family: 'family', Health: 'health' } as const)
export type ProfessionalDemoSectionMode = 'manage-encounter' | 'transport-or-close-encounter' | 'record-handover' | 'authorized-communication' | 'request-authorized-communication' | 'read-ips' | 'read-emergency-minimum' | 'verify-shared-vaccinations' | 'unavailable'
export type ProfessionalDemoCapabilities = Readonly<{
  grantsRealAuthority: false
  canRequestBreakGlass: boolean
  healthScope: 'ips' | 'emergency-minimum' | 'none'
  workflowFamily: 'clinical-encounter' | 'transport-or-close' | 'assisted-read-only' | 'operational-encounter' | 'shared-vaccination-verification' | 'administrative-read-only' | 'research-governed' | 'unclassified'
  clinicalWriteScope: 'attested-record' | 'none'
  communicationLaunchSurface: 'encounter' | 'none'
  sections: readonly Readonly<{ id: typeof ProfessionalDemoSectionIds[keyof typeof ProfessionalDemoSectionIds]; mode: ProfessionalDemoSectionMode }>[]
}>

const section = (id: typeof ProfessionalDemoSectionIds[keyof typeof ProfessionalDemoSectionIds], mode: ProfessionalDemoSectionMode) => Object.freeze({ id, mode })
const result = (value: Omit<ProfessionalDemoCapabilities, 'grantsRealAuthority'>): ProfessionalDemoCapabilities => Object.freeze({ ...value, grantsRealAuthority: false })
const clinicalProfiles = new Set<SoschainProfessionalDemoProfileId>([SoschainProfessionalDemoProfileIds.Doctor, SoschainProfessionalDemoProfileIds.Nurse, SoschainProfessionalDemoProfileIds.Veterinarian])
const operationalProfiles = new Set<SoschainProfessionalDemoProfileId>([SoschainProfessionalDemoProfileIds.Firefighter, SoschainProfessionalDemoProfileIds.Lifeguard])
const administrativeProfiles = new Set<SoschainProfessionalDemoProfileId>([SoschainProfessionalDemoProfileIds.MedicalSecretary, SoschainProfessionalDemoProfileIds.Receptionist])

/** Synthetic Demo projection only. Real authorization always comes from the BFF/GW. */
export function resolveProfessionalDemoCapabilities(profileId: SoschainProfessionalDemoProfileId): ProfessionalDemoCapabilities {
  if (clinicalProfiles.has(profileId)) return result({ canRequestBreakGlass: true, healthScope: 'ips', workflowFamily: 'clinical-encounter', clinicalWriteScope: 'attested-record', communicationLaunchSurface: 'encounter', sections: [section('journey', 'manage-encounter'), section('family', 'authorized-communication'), section('health', 'read-ips')] })
  if (profileId === SoschainProfessionalDemoProfileIds.Paramedic) return result({ canRequestBreakGlass: true, healthScope: 'ips', workflowFamily: 'transport-or-close', clinicalWriteScope: 'attested-record', communicationLaunchSurface: 'encounter', sections: [section('journey', 'transport-or-close-encounter'), section('family', 'authorized-communication'), section('health', 'read-ips')] })
  if (profileId === SoschainProfessionalDemoProfileIds.VeterinaryAssistant) return result({ canRequestBreakGlass: false, healthScope: 'ips', workflowFamily: 'assisted-read-only', clinicalWriteScope: 'none', communicationLaunchSurface: 'none', sections: [section('journey', 'unavailable'), section('family', 'unavailable'), section('health', 'read-ips')] })
  if (operationalProfiles.has(profileId)) return result({ canRequestBreakGlass: false, healthScope: 'emergency-minimum', workflowFamily: 'operational-encounter', clinicalWriteScope: 'none', communicationLaunchSurface: 'encounter', sections: [section('journey', 'record-handover'), section('family', 'request-authorized-communication'), section('health', 'read-emergency-minimum')] })
  if (profileId === SoschainProfessionalDemoProfileIds.PoliceOfficer) return result({ canRequestBreakGlass: false, healthScope: 'emergency-minimum', workflowFamily: 'shared-vaccination-verification', clinicalWriteScope: 'none', communicationLaunchSurface: 'encounter', sections: [section('journey', 'record-handover'), section('family', 'request-authorized-communication'), section('health', 'verify-shared-vaccinations')] })
  if (administrativeProfiles.has(profileId)) return result({ canRequestBreakGlass: false, healthScope: 'none', workflowFamily: 'administrative-read-only', clinicalWriteScope: 'none', communicationLaunchSurface: 'none', sections: [section('journey', 'unavailable'), section('family', 'unavailable'), section('health', 'unavailable')] })
  if (profileId === SoschainProfessionalDemoProfileIds.Researcher) return result({ canRequestBreakGlass: false, healthScope: 'none', workflowFamily: 'research-governed', clinicalWriteScope: 'none', communicationLaunchSurface: 'none', sections: [section('journey', 'unavailable'), section('family', 'unavailable'), section('health', 'unavailable')] })
  return result({ canRequestBreakGlass: false, healthScope: 'none', workflowFamily: 'unclassified', clinicalWriteScope: 'none', communicationLaunchSurface: 'none', sections: [section('journey', 'unavailable'), section('family', 'unavailable'), section('health', 'unavailable')] })
}
