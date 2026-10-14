/** Canonical code-system URIs shared by human and animal clinical channels. */
export const ClinicalTerminologySystems = Object.freeze({
  Loinc: 'http://loinc.org',
  SnomedCt: 'http://snomed.info/sct',
  Icd10: 'http://hl7.org/fhir/sid/icd-10',
  Atc: 'http://www.whocc.no/atc',
  AtcVet: 'http://www.whocc.no/atcvet',
} as const)

/** Authorization/content scopes; several scopes may share one Coding.system. */
export const ClinicalTerminologySourceScopes = Object.freeze({
  Loinc: 'LNC',
  SnomedGps: 'SNOMED_GPS',
  SnomedIps: 'SNOMED_IPS',
  SnomedCt: 'SNOMED_CT',
  SnomedVeterinary: 'SNOMEDCT_VET',
  Icd10: 'ICD10',
  Atc: 'ATC',
  AtcVet: 'ATCVET',
} as const)

export type ClinicalTerminologySourceScope =
  typeof ClinicalTerminologySourceScopes[keyof typeof ClinicalTerminologySourceScopes]

/** Product-neutral terminology candidate returned to SOS, Vet or UHC channels. */
export type ClinicalTerminologyCandidate = Readonly<{
  /** Governed source-scope identifier returned by the deployment capability. */
  source: string
  system: string
  code: string
  display: string
  text?: string
  language?: string
  terminologyVersion?: string
}>

/** Preserves canonical English display separately from an asserted local label. */
export function buildClinicalTerminologyCandidate(
  input: ClinicalTerminologyCandidate,
): ClinicalTerminologyCandidate {
  const required = (value: string, error: string) => {
    const normalized = value.trim()
    if (!normalized) throw new TypeError(error)
    return normalized
  }
  return Object.freeze({
    source: input.source,
    system: required(input.system, 'clinical_terminology_system_required'),
    code: required(input.code, 'clinical_terminology_code_required'),
    display: required(input.display, 'clinical_terminology_display_required'),
    ...(input.text?.trim() ? { text: input.text.trim() } : {}),
    ...(input.language?.trim() ? { language: input.language.trim() } : {}),
    ...(input.terminologyVersion?.trim() ? { terminologyVersion: input.terminologyVersion.trim() } : {}),
  })
}

/** Deterministic cross-sector fixtures for isolated terminology and channel tests. */
export const CLINICAL_TERMINOLOGY_TEST_DATA = Object.freeze({
  localApiKey: 'local-playwright-umls-key',
  bodyTemperature: Object.freeze({
    source: ClinicalTerminologySourceScopes.Loinc,
    system: ClinicalTerminologySystems.Loinc,
    code: '8310-5',
    display: 'Body temperature:Temp:Pt:^Patient:Qn',
  }),
  otitisExternaSpanish: Object.freeze({
    scope: ClinicalTerminologySourceScopes.SnomedCt,
    umlsSource: 'SCTSPA',
    system: ClinicalTerminologySystems.SnomedCt,
    code: '3135009',
    display: 'otitis externa',
  }),
  canineRabiesVaccine: Object.freeze({
    scope: ClinicalTerminologySourceScopes.AtcVet,
    system: ClinicalTerminologySystems.AtcVet,
    code: 'QI07AA02',
    text: 'virus de la rabia',
    display: 'rabies virus',
    ncbiTaxonomyId: '9615',
  }),
  humanInactivatedInfluenzaVaccine: Object.freeze({
    scope: ClinicalTerminologySourceScopes.Atc,
    system: ClinicalTerminologySystems.Atc,
    code: 'J07BB02',
    text: 'vacuna contra la gripe inactivada de virus fraccionados o antígeno de superficie',
    display: 'influenza, inactivated, split virus or surface antigen',
    ncbiTaxonomyId: '9606',
  }),
  rabiesDisease: Object.freeze({
    scope: ClinicalTerminologySourceScopes.SnomedGps,
    umlsSource: 'SNOMEDCT_US',
    system: ClinicalTerminologySystems.SnomedCt,
    code: '14168008',
    display: 'Rabies',
  }),
} as const)
