export const EmergencyProfessionalRoleIds = Object.freeze({
  Paramedic: 'paramedic',
  AmbulanceWorker: 'ambulance_worker',
  Firefighter: 'firefighter',
  PoliceOfficer: 'police_officer',
  SecurityGuard: 'security_guard',
  Lifeguard: 'lifeguard',
  FlightAttendant: 'flight_attendant',
  AirlineGroundClerk: 'airline_ground_clerk',
  InsuranceClerk: 'insurance_clerk',
  TrainAttendant: 'train_attendant',
  TransportConductor: 'transport_conductor',
} as const);

export type EmergencyProfessionalRoleId =
  (typeof EmergencyProfessionalRoleIds)[keyof typeof EmergencyProfessionalRoleIds];

export type EmergencyProfessionalRole = Readonly<{
  id: EmergencyProfessionalRoleId;
  system: 'ISCO-08';
  code: string;
  claim: `ISCO-08|${string}`;
  titleEn: string;
  /** Nested-object locale path used by Next.js applications. */
  i18nKey: `org.ilo.isco-08.${string}`;
}>;

function role(
  id: EmergencyProfessionalRoleId,
  code: string,
  titleEn: string,
): EmergencyProfessionalRole {
  return Object.freeze({
    id,
    system: 'ISCO-08',
    code,
    claim: `ISCO-08|${code}`,
    titleEn,
    i18nKey: `org.ilo.isco-08.${code}`,
  });
}

/**
 * Shared occupation vocabulary for verified emergency, public-safety and
 * passenger-transport actors. A catalog entry identifies an occupation only;
 * it never grants access. VET/UHC/SOS policy must still bind exact subject,
 * actor, jurisdiction, purpose, data section, action and valid Consent.
 * `Paramedic` is a jurisdiction-enabled occupation, never an alias for a whole
 * mobile emergency team. For example, Spanish advanced-life-support teams are
 * represented by a Group with distinct technician, nursing and, when the care
 * requires it, physician PractitionerRoles.
 */
export const EmergencyProfessionalRoles: Readonly<Record<EmergencyProfessionalRoleId, EmergencyProfessionalRole>> = Object.freeze({
  [EmergencyProfessionalRoleIds.Paramedic]: role(EmergencyProfessionalRoleIds.Paramedic, '2240', 'Paramedic'),
  [EmergencyProfessionalRoleIds.AmbulanceWorker]: role(EmergencyProfessionalRoleIds.AmbulanceWorker, '3258', 'Ambulance worker'),
  [EmergencyProfessionalRoleIds.Firefighter]: role(EmergencyProfessionalRoleIds.Firefighter, '5411', 'Firefighter'),
  [EmergencyProfessionalRoleIds.PoliceOfficer]: role(EmergencyProfessionalRoleIds.PoliceOfficer, '5412', 'Police officer'),
  [EmergencyProfessionalRoleIds.SecurityGuard]: role(EmergencyProfessionalRoleIds.SecurityGuard, '5414', 'Security guard'),
  [EmergencyProfessionalRoleIds.Lifeguard]: role(EmergencyProfessionalRoleIds.Lifeguard, '5419', 'Lifeguard'),
  [EmergencyProfessionalRoleIds.FlightAttendant]: role(EmergencyProfessionalRoleIds.FlightAttendant, '5111', 'Flight attendant'),
  [EmergencyProfessionalRoleIds.AirlineGroundClerk]: role(EmergencyProfessionalRoleIds.AirlineGroundClerk, '4221', 'Airline ground clerk'),
  [EmergencyProfessionalRoleIds.InsuranceClerk]: role(EmergencyProfessionalRoleIds.InsuranceClerk, '4312', 'Statistical, finance and insurance clerk'),
  [EmergencyProfessionalRoleIds.TrainAttendant]: role(EmergencyProfessionalRoleIds.TrainAttendant, '5111', 'Train attendant'),
  [EmergencyProfessionalRoleIds.TransportConductor]: role(EmergencyProfessionalRoleIds.TransportConductor, '5112', 'Transport conductor'),
});

/** Resolves a known application role without accepting invented claims. */
export function getEmergencyProfessionalRole(value: unknown): EmergencyProfessionalRole | undefined {
  const roleId = String(value ?? '').trim().toLowerCase() as EmergencyProfessionalRoleId;
  return EmergencyProfessionalRoles[roleId];
}
