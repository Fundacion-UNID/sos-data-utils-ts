// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM,
  DataSpaceIdentifierType,
  Hl7OrganizationIdentifierType,
  JurisdictionalIdentifierBaseCode,
  buildJurisdictionalIdentifierPropertyValue,
  buildJurisdictionalIdentifierType,
  parseJurisdictionalIdentifierType,
} from '../dist/jurisdictional-identifier-types.js';
import * as jurisdictionalIdentifierPublicSurface from 'sos-data-utils-ts/jurisdictional-identifier-types';
import {
  HL7_V2_0203_IDENTIFIER_CODES as fhirIdentifierCodes,
  HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM as fhirIdentifierTypeSystem,
  HL7_V2_0203_ORGANIZATION_IDENTIFIER_CODES as fhirOrganizationIdentifierCodes,
} from 'fhir-data-utils-ts/hl7-v2-0203-identifier-types';

const SYNTHETIC_IDENTIFIER_VALUE = 'example-identifier-value';

test('builds the canonical base-code plus ISO alpha-2 or ISO 3166-2 identifier type', () => {
  // These exact strings are the wire contract under test: no separator is inserted.
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.NationalPerson, jurisdiction: 'es' }), 'NNES');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.NationalPerson, jurisdiction: 'ca-bc' }), 'NNCA-BC');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.DriverLicense, jurisdiction: 'ca-bc' }), 'DLCA-BC');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.DriverLicense, jurisdiction: 'es' }), 'DLES');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.JurisdictionalHealthNumber, jurisdiction: 'ca-bc' }), 'JHNCA-BC');
});

test('exports the same contract through the supported package subpath', () => {
  assert.equal(
    jurisdictionalIdentifierPublicSurface.buildJurisdictionalIdentifierType,
    buildJurisdictionalIdentifierType,
  );
});

test('uses the FHIR-owned HL7 catalog rather than a product-local copy', () => {
  assert.equal(HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM, fhirIdentifierTypeSystem);
  assert.equal(JurisdictionalIdentifierBaseCode.DriverLicense, fhirIdentifierCodes.DriverLicense);
  assert.equal(JurisdictionalIdentifierBaseCode.PatientIdentifier, fhirIdentifierCodes.PatientIdentifier);
  assert.equal(Hl7OrganizationIdentifierType.EmployerNumber, fhirOrganizationIdentifierCodes.EmployerNumber);
  assert.equal(Hl7OrganizationIdentifierType.TaxId, fhirOrganizationIdentifierCodes.TaxIdentifier);
});

test('covers passports, residence, work, study, visa and temporary-entry permits', () => {
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.PassportNumber, jurisdiction: 'es' }), 'PPNES');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.PermanentResidentCard, jurisdiction: 'ca' }), 'PRCCA');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.WorkPermit, jurisdiction: 'ca' }), 'WPCA');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.StudyPermit, jurisdiction: 'ca' }), 'SPCA');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.Visa, jurisdiction: 'ca' }), 'VSCA');
  assert.throws(
    () => buildJurisdictionalIdentifierType({ baseCode: 'VISA', jurisdiction: 'ca' }),
    /identifier_base_code_unsupported/,
  );
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.VisitorPermit, jurisdiction: 'ca' }), 'VPCA');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.TemporaryPermanentResidentCanada, jurisdiction: 'ca' }), 'TPRCA');
});

test('composes every shared HL7 person and healthcare identifier needed for subject resolution', () => {
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.CitizenshipCard, jurisdiction: 'es' }), 'CZES');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.HealthCard, jurisdiction: 'ca-bc' }), 'HCCA-BC');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.InsuranceMember, jurisdiction: 'es' }), 'MBES');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.InsuranceSubscriber, jurisdiction: 'es' }), 'SNES');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.DonorRecord, jurisdiction: 'es' }), 'DRES');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: JurisdictionalIdentifierBaseCode.PatientIdentifier, jurisdiction: 'es' }), 'PIES');
});

test('applies the generic composition rule without a country or subdivision allowlist', () => {
  const examples = [
    ['PPN', 'FR', 'PPNFR'],
    ['DL', 'US-AL', 'DLUS-AL'],
    ['JHN', 'ES-CL', 'JHNES-CL'],
    ['PRC', 'AU', 'PRCAU'],
    ['WP', 'NZ', 'WPNZ'],
    ['SP', 'DE', 'SPDE'],
    ['VS', 'JP', 'VSJP'],
    ['VP', 'BR', 'VPBR'],
    ['TPR', 'MX', 'TPRMX'],
    ['BN', 'AU-NSW', 'BNAU-NSW'],
  ];
  for (const [baseCode, jurisdiction, expected] of examples) {
    assert.equal(buildJurisdictionalIdentifierType({ baseCode, jurisdiction }), expected);
  }
});

test('keeps a Schema.org PropertyValue type paired with its value', () => {
  assert.deepEqual(buildJurisdictionalIdentifierPropertyValue({
    baseCode: JurisdictionalIdentifierBaseCode.PermanentResidentCard,
    jurisdiction: 'ca',
    value: ` ${SYNTHETIC_IDENTIFIER_VALUE} `,
  }), {
    additionalType: 'PRCCA',
    value: SYNTHETIC_IDENTIFIER_VALUE,
  });
});

test('parses canonical types without confusing the HL7 base code with the jurisdiction suffix', () => {
  assert.deepEqual(parseJurisdictionalIdentifierType('JHNCA-BC'), {
    baseCode: 'JHN',
    jurisdiction: 'CA-BC',
    canonicalType: 'JHNCA-BC',
    terminologySystem: HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM,
    terminologyCode: 'JHN',
    sourceKind: 'hl7-v2-0203',
  });
  assert.deepEqual(parseJurisdictionalIdentifierType('NNES'), {
    baseCode: 'NN',
    jurisdiction: 'ES',
    canonicalType: 'NNES',
    terminologySystem: HL7_V2_0203_IDENTIFIER_TYPE_SYSTEM,
    terminologyCode: 'NNxxx',
    sourceKind: 'hl7-v2-0203-pattern',
  });
});

test('keeps organization and technical identifier types separate from jurisdictional person-document types', () => {
  assert.equal(DataSpaceIdentifierType.BusinessNumber, 'BN');
  assert.equal(DataSpaceIdentifierType.UniversallyUniqueIdentifier, 'UUID');
  assert.equal(DataSpaceIdentifierType.ObjectIdentifier, 'OID');
  assert.equal(Hl7OrganizationIdentifierType.EmployerNumber, 'EN');
  assert.equal(Hl7OrganizationIdentifierType.TaxId, 'TAX');
  assert.notEqual(DataSpaceIdentifierType.BusinessNumber, Hl7OrganizationIdentifierType.TaxId);
});

test('composes federal and subdivision Business Numbers without merging TAX or EN', () => {
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: DataSpaceIdentifierType.BusinessNumber, jurisdiction: 'ca' }), 'BNCA');
  assert.equal(buildJurisdictionalIdentifierType({ baseCode: DataSpaceIdentifierType.BusinessNumber, jurisdiction: 'ca-bc' }), 'BNCA-BC');
  assert.deepEqual(parseJurisdictionalIdentifierType('BNCA-BC'), {
    baseCode: 'BN',
    jurisdiction: 'CA-BC',
    canonicalType: 'BNCA-BC',
    terminologySystem: undefined,
    terminologyCode: 'BN',
    sourceKind: 'data-space-extension',
  });
});

test('fails closed for invalid jurisdiction forms, unknown bases and empty values', () => {
  assert.throws(() => buildJurisdictionalIdentifierType({ baseCode: 'JHH', jurisdiction: 'es-cl' }), /identifier_base_code_unsupported/);
  assert.throws(() => buildJurisdictionalIdentifierType({ baseCode: 'NN', jurisdiction: 'ESP' }), /identifier_jurisdiction_invalid/);
  assert.throws(() => buildJurisdictionalIdentifierPropertyValue({ baseCode: 'DL', jurisdiction: 'es', value: ' ' }), /identifier_value_required/);
});
