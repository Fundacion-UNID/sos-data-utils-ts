import {
  HL7_V2_0203_IDENTIFIER_CODES,
  HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM,
  HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES,
} from 'fhir-data-utils-ts/hl7-v2-0203-identifier-types';

export {
  HL7_V2_0203_IDENTIFIER_CODES,
  HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM,
  HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES,
} from 'fhir-data-utils-ts/hl7-v2-0203-identifier-types';

/**
 * HL7 v2-0203 is the source for the base meaning of supported person-document
 * identifier types. The data-space wire type appends an ISO jurisdiction; it
 * must not be described as a literal HL7 code.
 *
 * @see https://terminology.hl7.org/CodeSystem-v2-0203.html
 * @see https://hl7.org/fhir/valueset-identifier-type.html
 */
/** Authoritative HL7 registries used by terminology and FHIR adapters. */
export const HL7_IDENTIFIER_REGISTRY_SOURCES = Object.freeze({
  externalCodeSystems: 'https://terminology.hl7.org/en/external_code_systems.html',
  externalIdentifierSystems: 'https://terminology.hl7.org/en/identifiers.html',
} as const);

/**
 * Canonical base codes for person documents, health identifiers and the
 * jurisdiction-scoped organization Business Number extension.
 *
 * `NN` deliberately shortens the HL7 `NNxxx` pattern. HL7 appends an ISO
 * alpha-3 country; this data-space profile appends an ISO alpha-2 country or
 * ISO 3166-2 subdivision instead, for example `NNES` or `NNCA-BC`.
 * `VS`, not the display word `VISA`, is the HL7 code for a visa.
 */
export const JurisdictionalIdentifierBaseCode = Object.freeze({
  NationalPerson: HL7_V2_0203_IDENTIFIER_CODES.NationalNumber,
  DriverLicense: HL7_V2_0203_IDENTIFIER_CODES.DriverLicense,
  CitizenshipCard: HL7_V2_0203_IDENTIFIER_CODES.CitizenshipCard,
  JurisdictionalHealthNumber: HL7_V2_0203_IDENTIFIER_CODES.JurisdictionalHealthNumber,
  PassportNumber: HL7_V2_0203_IDENTIFIER_CODES.PassportNumber,
  PermanentResidentCard: HL7_V2_0203_IDENTIFIER_CODES.PermanentResidentCard,
  WorkPermit: HL7_V2_0203_IDENTIFIER_CODES.WorkPermit,
  StudyPermit: HL7_V2_0203_IDENTIFIER_CODES.StudyPermit,
  Visa: HL7_V2_0203_IDENTIFIER_CODES.Visa,
  VisitorPermit: HL7_V2_0203_IDENTIFIER_CODES.VisitorPermit,
  TemporaryPermanentResidentCanada: HL7_V2_0203_IDENTIFIER_CODES.TemporaryPermanentResident,
  HealthCard: HL7_V2_0203_IDENTIFIER_CODES.HealthCard,
  InsuranceMember: HL7_V2_0203_IDENTIFIER_CODES.MemberNumber,
  InsuranceSubscriber: HL7_V2_0203_IDENTIFIER_CODES.SubscriberNumber,
  DonorRecord: HL7_V2_0203_IDENTIFIER_CODES.DonorRecord,
  PatientIdentifier: HL7_V2_0203_IDENTIFIER_CODES.PatientIdentifier,
  BusinessNumber: 'BN',
} as const);

export type JurisdictionalIdentifierBaseCode =
  typeof JurisdictionalIdentifierBaseCode[keyof typeof JurisdictionalIdentifierBaseCode];

/** Standard HL7 organization identifier types kept separate from local types. */
export const Hl7OrganizationIdentifierType = Object.freeze({
  EmployerNumber: HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES.EmployerNumber,
  TaxId: HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES.TaxIdentifier,
} as const);

/**
 * Multisector identifier types that are not claimed to be HL7 v2-0203 codes.
 * Jurisdiction remains an independent input when these types are used for
 * authorization or lookup.
 */
export const DataSpaceIdentifierType = Object.freeze({
  BusinessNumber: 'BN',
  UniversallyUniqueIdentifier: 'UUID',
  ObjectIdentifier: 'OID',
} as const);

export type IdentifierSourceKind =
  | 'hl7-v2-0203'
  | 'hl7-v2-0203-pattern'
  | 'data-space-extension';

export type JurisdictionalIdentifierType = Readonly<{
  baseCode: JurisdictionalIdentifierBaseCode;
  jurisdiction: string;
  canonicalType: string;
  terminologySystem: typeof HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM | undefined;
  terminologyCode: string;
  sourceKind: IdentifierSourceKind;
}>;

export type JurisdictionalIdentifierPropertyValue = Readonly<{
  additionalType: string;
  value: string;
}>;

type BaseCodeInput = JurisdictionalIdentifierBaseCode | string;

const ISO_3166_JURISDICTION = /^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/;

function hl7Descriptor(terminologyCode: string) {
  return Object.freeze({
    terminologyCode,
    sourceKind: 'hl7-v2-0203' as const,
    terminologySystem: HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM,
  });
}

const BASE_DESCRIPTORS: Readonly<Record<JurisdictionalIdentifierBaseCode, Readonly<{
  terminologyCode: string;
  sourceKind: IdentifierSourceKind;
  terminologySystem: typeof HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM | undefined;
}>>> = Object.freeze({
  [JurisdictionalIdentifierBaseCode.NationalPerson]: Object.freeze({ terminologyCode: 'NNxxx', sourceKind: 'hl7-v2-0203-pattern', terminologySystem: HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM }),
  [JurisdictionalIdentifierBaseCode.DriverLicense]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.DriverLicense),
  [JurisdictionalIdentifierBaseCode.CitizenshipCard]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.CitizenshipCard),
  [JurisdictionalIdentifierBaseCode.JurisdictionalHealthNumber]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.JurisdictionalHealthNumber),
  [JurisdictionalIdentifierBaseCode.PassportNumber]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.PassportNumber),
  [JurisdictionalIdentifierBaseCode.PermanentResidentCard]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.PermanentResidentCard),
  [JurisdictionalIdentifierBaseCode.WorkPermit]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.WorkPermit),
  [JurisdictionalIdentifierBaseCode.StudyPermit]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.StudyPermit),
  [JurisdictionalIdentifierBaseCode.Visa]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.Visa),
  [JurisdictionalIdentifierBaseCode.VisitorPermit]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.VisitorPermit),
  [JurisdictionalIdentifierBaseCode.TemporaryPermanentResidentCanada]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.TemporaryPermanentResident),
  [JurisdictionalIdentifierBaseCode.HealthCard]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.HealthCard),
  [JurisdictionalIdentifierBaseCode.InsuranceMember]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.MemberNumber),
  [JurisdictionalIdentifierBaseCode.InsuranceSubscriber]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.SubscriberNumber),
  [JurisdictionalIdentifierBaseCode.DonorRecord]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.DonorRecord),
  [JurisdictionalIdentifierBaseCode.PatientIdentifier]: hl7Descriptor(HL7_V2_0203_IDENTIFIER_CODES.PatientIdentifier),
  [JurisdictionalIdentifierBaseCode.BusinessNumber]: Object.freeze({ terminologyCode: 'BN', sourceKind: 'data-space-extension', terminologySystem: undefined }),
});

const BASE_CODES_LONGEST_FIRST = Object.freeze(
  (Object.keys(BASE_DESCRIPTORS) as JurisdictionalIdentifierBaseCode[])
    .sort((left, right) => right.length - left.length),
);

/**
 * Builds the compact multisector wire type `baseCode + jurisdiction`.
 *
 * The jurisdiction is canonical uppercase ISO 3166-1 alpha-2 or ISO 3166-2.
 * This validates the wire grammar; an authoritative ISO catalog remains the
 * source for determining whether a particular subdivision is assigned.
 */
export function buildJurisdictionalIdentifierType(input: Readonly<{
  baseCode: BaseCodeInput;
  jurisdiction: string;
}>): string {
  const baseCode = normalizeBaseCode(input.baseCode);
  const jurisdiction = normalizeJurisdiction(input.jurisdiction);
  return `${baseCode}${jurisdiction}`;
}

/** Parses a compact wire type back into its standard base and ISO jurisdiction. */
export function parseJurisdictionalIdentifierType(value: string): JurisdictionalIdentifierType {
  const candidate = String(value ?? '').trim().toUpperCase();
  const baseCode = BASE_CODES_LONGEST_FIRST.find(code => candidate.startsWith(code));
  if (!baseCode) throw new TypeError('identifier_base_code_unsupported');
  const jurisdiction = normalizeJurisdiction(candidate.slice(baseCode.length));
  const canonicalType = buildJurisdictionalIdentifierType({ baseCode, jurisdiction });
  const descriptor = BASE_DESCRIPTORS[baseCode];
  return Object.freeze({
    baseCode,
    jurisdiction,
    canonicalType,
    terminologySystem: descriptor.terminologySystem,
    terminologyCode: descriptor.terminologyCode,
    sourceKind: descriptor.sourceKind,
  });
}

/**
 * Keeps one Schema.org PropertyValue identifier type paired with its value.
 * Consumers must retain one object per identifier rather than parallel arrays.
 */
export function buildJurisdictionalIdentifierPropertyValue(input: Readonly<{
  baseCode: BaseCodeInput;
  jurisdiction: string;
  value: string;
}>): JurisdictionalIdentifierPropertyValue {
  const value = String(input.value ?? '').trim();
  if (!value) throw new TypeError('identifier_value_required');
  return Object.freeze({
    additionalType: buildJurisdictionalIdentifierType(input),
    value,
  });
}

function normalizeBaseCode(value: BaseCodeInput): JurisdictionalIdentifierBaseCode {
  const candidate = String(value ?? '').trim().toUpperCase();
  if (!(candidate in BASE_DESCRIPTORS)) throw new TypeError('identifier_base_code_unsupported');
  return candidate as JurisdictionalIdentifierBaseCode;
}

function normalizeJurisdiction(value: string): string {
  const jurisdiction = String(value ?? '').trim().toUpperCase();
  if (!ISO_3166_JURISDICTION.test(jurisdiction)) throw new TypeError('identifier_jurisdiction_invalid');
  return jurisdiction;
}
