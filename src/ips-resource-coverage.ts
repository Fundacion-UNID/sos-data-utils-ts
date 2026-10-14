// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.

export const IpsImplementationStatus = Object.freeze({
  Available: 'available',
  Planned: 'planned',
  Deferred: 'deferred',
  NotApplicable: 'not-applicable',
} as const);

export type IpsImplementationStatusValue =
  typeof IpsImplementationStatus[keyof typeof IpsImplementationStatus];

/** Resource types enumerated by the IPS Server CapabilityStatement. */
export const IpsCapabilityResourceType = Object.freeze({
  Bundle: 'Bundle', Composition: 'Composition', Patient: 'Patient',
  AllergyIntolerance: 'AllergyIntolerance', Condition: 'Condition', MedicationRequest: 'MedicationRequest',
  MedicationStatement: 'MedicationStatement', CarePlan: 'CarePlan', ClinicalImpression: 'ClinicalImpression',
  Consent: 'Consent', Device: 'Device', DeviceUseStatement: 'DeviceUseStatement',
  DiagnosticReport: 'DiagnosticReport', DocumentReference: 'DocumentReference', Flag: 'Flag',
  ImagingStudy: 'ImagingStudy', Immunization: 'Immunization', ImmunizationRecommendation: 'ImmunizationRecommendation',
  Medication: 'Medication', MedicationAdministration: 'MedicationAdministration', MedicationDispense: 'MedicationDispense',
  Observation: 'Observation', Organization: 'Organization', Practitioner: 'Practitioner',
  PractitionerRole: 'PractitionerRole', Procedure: 'Procedure', RelatedPerson: 'RelatedPerson', Specimen: 'Specimen',
} as const);

/** Extra workflow/support types required by SOS, Vet and UHC outside the IPS capability list. */
export const MultichannelSupportResourceType = Object.freeze({
  Location: 'Location', Appointment: 'Appointment', Task: 'Task', Communication: 'Communication',
  Account: 'Account', Schedule: 'Schedule', Slot: 'Slot',
} as const);

/** Resource types physically present in the official IPS all-sections example Bundle. */
export const IpsAllSectionsExampleResourceType = Object.freeze({
  AllergyIntolerance: IpsCapabilityResourceType.AllergyIntolerance,
  Bundle: IpsCapabilityResourceType.Bundle,
  CarePlan: IpsCapabilityResourceType.CarePlan,
  Composition: IpsCapabilityResourceType.Composition,
  Condition: IpsCapabilityResourceType.Condition,
  Consent: IpsCapabilityResourceType.Consent,
  Device: IpsCapabilityResourceType.Device,
  DeviceUseStatement: IpsCapabilityResourceType.DeviceUseStatement,
  DocumentReference: IpsCapabilityResourceType.DocumentReference,
  Flag: IpsCapabilityResourceType.Flag,
  Immunization: IpsCapabilityResourceType.Immunization,
  MedicationStatement: IpsCapabilityResourceType.MedicationStatement,
  Observation: IpsCapabilityResourceType.Observation,
  Organization: IpsCapabilityResourceType.Organization,
  Patient: IpsCapabilityResourceType.Patient,
  Practitioner: IpsCapabilityResourceType.Practitioner,
  PractitionerRole: IpsCapabilityResourceType.PractitionerRole,
  Procedure: IpsCapabilityResourceType.Procedure,
} as const);

export const IPS_REFERENCE_URLS = Object.freeze({
  CapabilityStatement: 'https://build.fhir.org/ig/HL7/fhir-ips/en/CapabilityStatement-ips-server.html',
  BundleProfile: 'https://build.fhir.org/ig/HL7/fhir-ips/en/StructureDefinition-Bundle-uv-ips.html',
  CompositionProfile: 'https://build.fhir.org/ig/HL7/fhir-ips/en/StructureDefinition-Composition-uv-ips.html',
  AllSectionsExample: 'https://build.fhir.org/ig/HL7/fhir-ips/en/Bundle-bundle-ips-all-sections.html',
} as const);

export type IpsResourceCoverage = Readonly<{
  resourceType: string;
  ipsCapability: boolean;
  ipsAllSectionsExample: boolean;
  purpose: 'document' | 'clinical-section' | 'support' | 'workflow' | 'billing' | 'scheduling';
  flatClaims: IpsImplementationStatusValue;
  fhirConversion: IpsImplementationStatusValue;
  multichannelJsonSchema: IpsImplementationStatusValue;
  note?: string;
}>;

const available = IpsImplementationStatus.Available;
const planned = IpsImplementationStatus.Planned;
const deferred = IpsImplementationStatus.Deferred;
const notApplicable = IpsImplementationStatus.NotApplicable;
const allSectionsExampleResourceTypes = new Set<string>(Object.values(IpsAllSectionsExampleResourceType));

/**
 * Full implementation inventory derived from the IPS Server CapabilityStatement,
 * plus the non-IPS workflow/support resources required by SOS, Vet and UHC.
 * `available` means executable now; `planned` must never be presented as green.
 */
export const IPS_AND_MULTICHANNEL_RESOURCE_COVERAGE: readonly IpsResourceCoverage[] = Object.freeze([
  coverage(IpsCapabilityResourceType.Bundle, true, 'document', notApplicable, available, planned),
  coverage(IpsCapabilityResourceType.Composition, true, 'document', available, available, planned),
  coverage(IpsCapabilityResourceType.Patient, true, 'support', planned, planned, planned),
  coverage(IpsCapabilityResourceType.AllergyIntolerance, true, 'clinical-section', available, available, available),
  coverage(IpsCapabilityResourceType.Condition, true, 'clinical-section', available, available, available),
  coverage(IpsCapabilityResourceType.MedicationRequest, true, 'clinical-section', planned, planned, planned),
  coverage(IpsCapabilityResourceType.MedicationStatement, true, 'clinical-section', available, available, available),
  coverage(IpsCapabilityResourceType.CarePlan, true, 'clinical-section', available, available, planned),
  coverage(IpsCapabilityResourceType.ClinicalImpression, true, 'clinical-section', available, available, planned),
  coverage(IpsCapabilityResourceType.Consent, true, 'support', available, available, available),
  coverage(IpsCapabilityResourceType.Device, true, 'support', available, available, planned),
  coverage(IpsCapabilityResourceType.DeviceUseStatement, true, 'clinical-section', available, available, planned),
  coverage(IpsCapabilityResourceType.DiagnosticReport, true, 'clinical-section', available, available, available),
  coverage(IpsCapabilityResourceType.DocumentReference, true, 'clinical-section', available, available, available),
  coverage(IpsCapabilityResourceType.Flag, true, 'clinical-section', available, available, planned),
  coverage(IpsCapabilityResourceType.ImagingStudy, true, 'clinical-section', planned, planned, planned),
  coverage(IpsCapabilityResourceType.Immunization, true, 'clinical-section', available, available, available),
  coverage(IpsCapabilityResourceType.ImmunizationRecommendation, true, 'clinical-section', available, planned, planned),
  coverage(IpsCapabilityResourceType.Medication, true, 'support', available, planned, planned),
  coverage(IpsCapabilityResourceType.MedicationAdministration, true, 'clinical-section', planned, planned, planned),
  coverage(IpsCapabilityResourceType.MedicationDispense, true, 'clinical-section', planned, planned, planned),
  coverage(IpsCapabilityResourceType.Observation, true, 'clinical-section', available, available, available),
  coverage(IpsCapabilityResourceType.Organization, true, 'support', available, available, planned, 'FHIR Organization is distinct from Schema.org legal or individual organization onboarding.'),
  coverage(IpsCapabilityResourceType.Practitioner, true, 'support', planned, planned, planned),
  coverage(IpsCapabilityResourceType.PractitionerRole, true, 'support', available, available, planned),
  coverage(IpsCapabilityResourceType.Procedure, true, 'clinical-section', available, available, available),
  coverage(IpsCapabilityResourceType.RelatedPerson, true, 'support', available, available, available),
  coverage(IpsCapabilityResourceType.Specimen, true, 'support', planned, planned, planned),
  coverage(MultichannelSupportResourceType.Location, false, 'support', available, available, planned, 'Required for referenced provider and SHC/IPS context even though it is not a standalone IPS section.'),
  coverage(MultichannelSupportResourceType.Appointment, false, 'workflow', available, available, available),
  coverage(MultichannelSupportResourceType.Task, false, 'workflow', available, planned, available),
  coverage(MultichannelSupportResourceType.Communication, false, 'workflow', available, available, planned, 'Carrier and interaction record; it is not clinical provenance.'),
  coverage(MultichannelSupportResourceType.Account, false, 'billing', available, available, available, 'Billing target for organization-scoped administrative permission sets.'),
  coverage(MultichannelSupportResourceType.Schedule, false, 'scheduling', available, available, deferred, 'Claims-first storage and R5 projection are available; multichannel scheduling forms remain deferred.'),
  coverage(MultichannelSupportResourceType.Slot, false, 'scheduling', available, available, deferred, 'Claims-first storage and R5 projection are available; multichannel scheduling forms remain deferred.'),
]);

export const IPS_CAPABILITY_RESOURCE_COVERAGE = Object.freeze(
  IPS_AND_MULTICHANNEL_RESOURCE_COVERAGE.filter(entry => entry.ipsCapability),
);

/** Returns the implementation record without treating a missing or planned type as available. */
export function getIpsResourceCoverage(resourceType: string): IpsResourceCoverage | undefined {
  return IPS_AND_MULTICHANNEL_RESOURCE_COVERAGE.find(entry => entry.resourceType === resourceType);
}

function coverage(
  resourceType: string,
  ipsCapability: boolean,
  purpose: IpsResourceCoverage['purpose'],
  flatClaims: IpsImplementationStatusValue,
  fhirConversion: IpsImplementationStatusValue,
  multichannelJsonSchema: IpsImplementationStatusValue,
  note?: string,
): IpsResourceCoverage {
  return Object.freeze({
    resourceType,
    ipsCapability,
    ipsAllSectionsExample: allSectionsExampleResourceTypes.has(resourceType),
    purpose,
    flatClaims,
    fhirConversion,
    multichannelJsonSchema,
    ...(note ? { note } : {}),
  });
}
