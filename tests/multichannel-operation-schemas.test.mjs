// Flow contract: every authoring channel validates the same subject and clinical operation schema before flat claims are built or persisted.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AllergyIntoleranceClaim,
  AppointmentClaim,
  CompositionAttesterModes,
  CompositionClaim,
  ConditionClaim,
  DiagnosticReportClaim,
  DocumentReferenceClaim,
  ImmunizationClaim,
  MedicationStatementClaim,
  ProcedureClaim,
} from 'fhir-data-utils-ts/claims';
import { FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS } from 'fhir-data-utils-ts';
import { ObservationClaim } from 'fhir-data-utils-ts/observation-claims';
import {
  MULTICHANNEL_OPERATION_SCHEMAS,
  MultichannelOperationId,
  MultichannelOperationMode,
  MultichannelAttestationState,
  assertValidMultichannelOperation,
  buildMultichannelOperationBundle,
  mapMultichannelOperationToFlatClaims,
  readMultichannelOperationFromBundle,
  resolveMultichannelClinicalOperationId,
  selectMultichannelOperationClaimValues,
} from '../dist/multichannel-operation-schemas.js';
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js';
import { SchemaOrgOrganizationClaim } from '../dist/schema-org-claims.js';
import { TaskClaim, TaskIntent, TaskStatus } from '../dist/task-artifact-schema.js';

const UUID = REPOSITORY_SAFE_EXAMPLES.resourceUuid;
const SUBJECT = REPOSITORY_SAFE_EXAMPLES.didWeb;
const AUTHOR = `RelatedPerson/${UUID}`;
const BASE = Object.freeze({
  operation: MultichannelOperationMode.Create,
  resourceId: UUID,
  subjectReference: SUBJECT,
  language: 'es',
  createdAt: '2026-09-23T12:00:00.000Z',
  dataAuthorReference: AUTHOR,
  attestationState: MultichannelAttestationState.Draft,
});

test('catalog covers subject onboarding and every clinical operation currently exposed by assisted channels', () => {
  assert.deepEqual(Object.keys(MULTICHANNEL_OPERATION_SCHEMAS).sort(), [
    MultichannelOperationId.AllergyIntolerance,
    MultichannelOperationId.Appointment,
    MultichannelOperationId.Condition,
    MultichannelOperationId.DiagnosticReport,
    MultichannelOperationId.DocumentReference,
    MultichannelOperationId.Immunization,
    MultichannelOperationId.LegalOrganization,
    MultichannelOperationId.MedicationStatement,
    MultichannelOperationId.Observation,
    MultichannelOperationId.Procedure,
    MultichannelOperationId.Subject,
    MultichannelOperationId.Task,
  ].sort());
});

test('resolves one canonical multichannel operation for each clinical resource type', () => {
  for (const operationId of [
    MultichannelOperationId.Immunization,
    MultichannelOperationId.AllergyIntolerance,
    MultichannelOperationId.MedicationStatement,
    MultichannelOperationId.Observation,
    MultichannelOperationId.Procedure,
    MultichannelOperationId.Condition,
    MultichannelOperationId.DiagnosticReport,
    MultichannelOperationId.DocumentReference,
  ]) {
    const schema = MULTICHANNEL_OPERATION_SCHEMAS[operationId];
    assert.equal(resolveMultichannelClinicalOperationId(schema['x-resource-type']), operationId);
  }
  assert.throws(() => resolveMultichannelClinicalOperationId('UnsupportedResource'), /multichannel_clinical_resource_type_unsupported/);
});

test('each clinical schema owns common provenance plus resource-specific required flat claims', () => {
  const expectedRequiredClaim = new Map([
    [MultichannelOperationId.Appointment, AppointmentClaim.Start],
    [MultichannelOperationId.Immunization, ImmunizationClaim.Date],
    [MultichannelOperationId.AllergyIntolerance, AllergyIntoleranceClaim.CodeText],
    [MultichannelOperationId.MedicationStatement, MedicationStatementClaim.CodeText],
    [MultichannelOperationId.Observation, ObservationClaim.CodeText],
    [MultichannelOperationId.Procedure, ProcedureClaim.CodeText],
    [MultichannelOperationId.Condition, ConditionClaim.CodeText],
    [MultichannelOperationId.DiagnosticReport, DiagnosticReportClaim.CodeText],
    [MultichannelOperationId.DocumentReference, DocumentReferenceClaim.ContentType],
  ]);

  for (const [operationId, requiredClaim] of expectedRequiredClaim) {
    const schema = MULTICHANNEL_OPERATION_SCHEMAS[operationId];
    assert.ok(schema.required.includes('language'));
    assert.ok(schema.required.includes('createdAt'));
    assert.ok(schema.required.includes('dataAuthorReference'));
    assert.ok(schema.required.includes('claims'));
    assert.ok(schema.properties.claims.required.includes(requiredClaim));
  }
});

test('the multichannel JSON Schemas cover every claim and default exposed by the shared IPS editors', () => {
  for (const editorSchema of Object.values(FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS)) {
    const operationId = resolveMultichannelClinicalOperationId(editorSchema.resourceType);
    const claimProperties = MULTICHANNEL_OPERATION_SCHEMAS[operationId].properties.claims.properties;
    for (const claim of [...editorSchema.requiredClaims, ...editorSchema.optionalClaims]) {
      assert.ok(claimProperties[claim], `${editorSchema.resourceType}:${claim}`);
    }
    for (const [claim, value] of Object.entries(editorSchema.initialClaims)) {
      if (editorSchema.resourceType === 'Observation' && claim === ObservationClaim.Category) continue;
      assert.equal(claimProperties[claim]?.default, value, `${editorSchema.resourceType}:${claim}`);
    }
  }
});

test('validated drafts map provenance and resource fields to canonical flat claim keys', () => {
  const values = {
    ...BASE,
    claims: {
      [ObservationClaim.Status]: 'preliminary',
      [ObservationClaim.CodeText]: 'Temperatura',
      [ObservationClaim.EffectiveDateTime]: '2026-09-23T11:58:00.000Z',
      [ObservationClaim.ValueQuantityNumber]: 38.1,
      [ObservationClaim.ValueQuantityUnit]: 'Cel',
    },
  };
  assert.doesNotThrow(() => assertValidMultichannelOperation(MultichannelOperationId.Observation, values));
  assert.deepEqual(mapMultichannelOperationToFlatClaims(MultichannelOperationId.Observation, values), {
    [CompositionClaim.Subject]: SUBJECT,
    [CompositionClaim.Date]: BASE.createdAt,
    [CompositionClaim.Author]: AUTHOR,
    [ObservationClaim.Identifier]: UUID,
    [ObservationClaim.Subject]: SUBJECT,
    [ObservationClaim.Language]: BASE.language,
    ...values.claims,
  });
});

test('accepts an imported opaque FHIR id while rejecting an invalid resource id', () => {
  const importedResourceId = 'immunization-influenza-demo';
  const values = {
    ...BASE,
    resourceId: importedResourceId,
    claims: {
      [ImmunizationClaim.Status]: 'completed',
      [ImmunizationClaim.Date]: '2026-09-20',
      [ImmunizationClaim.VaccineCodeText]: 'Influenza vaccine',
    },
  };
  assert.doesNotThrow(() => assertValidMultichannelOperation(MultichannelOperationId.Immunization, values));
  assert.throws(
    () => assertValidMultichannelOperation(MultichannelOperationId.Immunization, { ...values, resourceId: 'invalid resource/id' }),
    /multichannel_operation_format:resourceId/,
  );
});

test('the shared JSON Schema round-trips through BundleEditor and BundleReader without portal claim mapping', () => {
  const operationId = MultichannelOperationId.Immunization;
  const values = Object.freeze({
    ...BASE,
    claims: Object.freeze({
      [ImmunizationClaim.Status]: 'completed',
      [ImmunizationClaim.Date]: '2026-09-20',
      [ImmunizationClaim.VaccineCodeText]: 'Rabies vaccine',
      [ImmunizationClaim.LotNumber]: 'LOT-DEMO-1',
    }),
  });

  const bundle = buildMultichannelOperationBundle(operationId, values);
  const hydrated = readMultichannelOperationFromBundle(operationId, bundle, {
    operation: MultichannelOperationMode.Create,
  });

  assert.deepEqual(hydrated, values);
});

test('BundleReader restores update ifMatch from the BundleEditor request', () => {
  const operationId = MultichannelOperationId.Condition;
  const currentVersion = 'W/"7"';
  const values = Object.freeze({
    ...BASE,
    operation: MultichannelOperationMode.Update,
    ifMatch: currentVersion,
    claims: Object.freeze({ [ConditionClaim.CodeText]: 'Asthma' }),
  });
  const bundle = buildMultichannelOperationBundle(operationId, values);

  assert.deepEqual(readMultichannelOperationFromBundle(operationId, bundle, {
    operation: MultichannelOperationMode.Update,
  }), values);
});

test('BundleReader hydration exposes only claims declared by the selected JSON Schema', () => {
  const operationId = MultichannelOperationId.Condition;
  const values = Object.freeze({
    ...BASE,
    claims: Object.freeze({
      [ConditionClaim.CodeText]: 'Asthma',
      [ConditionClaim.ClinicalStatus]: 'active',
    }),
  });
  const bundle = buildMultichannelOperationBundle(operationId, values);
  const [entry] = bundle.data;
  entry.resource.meta.claims['Unrelated.secret'] = 'must-not-enter-the-form';

  const hydrated = readMultichannelOperationFromBundle(operationId, bundle, {
    operation: MultichannelOperationMode.Create,
  });

  assert.deepEqual(hydrated.claims, values.claims);
  assert.equal(hydrated.claims['Unrelated.secret'], undefined);
});

test('native FHIR adapters can select the same schema-owned form values before Bundle authoring', () => {
  const values = selectMultichannelOperationClaimValues(MultichannelOperationId.Observation, {
    [ObservationClaim.Status]: 'final',
    [ObservationClaim.CodeText]: 'Heart rate',
    [ObservationClaim.EffectiveDateTime]: '2026-09-23T11:58:00.000Z',
    [ObservationClaim.ValueQuantityNumber]: 72,
    [ObservationClaim.ValueQuantityUnit]: '/min',
    'Patient.identifier': UUID,
  });

  assert.deepEqual(values, {
    [ObservationClaim.Status]: 'final',
    [ObservationClaim.CodeText]: 'Heart rate',
    [ObservationClaim.EffectiveDateTime]: '2026-09-23T11:58:00.000Z',
    [ObservationClaim.ValueQuantityNumber]: 72,
    [ObservationClaim.ValueQuantityUnit]: '/min',
  });
});

test('confirmed writes require aligned attester data and updates require ifMatch', () => {
  const draft = {
    ...BASE,
    claims: {
      [ImmunizationClaim.Status]: 'completed',
      [ImmunizationClaim.Date]: '2026-09-20',
      [ImmunizationClaim.VaccineCodeText]: 'Rabies vaccine',
    },
  };
  assert.throws(
    () => assertValidMultichannelOperation(MultichannelOperationId.Immunization, {
      ...draft,
      attestationState: MultichannelAttestationState.Confirmed,
    }),
    /multichannel_operation_attester_required/,
  );
  assert.throws(
    () => assertValidMultichannelOperation(MultichannelOperationId.Immunization, {
      ...draft,
      operation: MultichannelOperationMode.Update,
    }),
    /multichannel_operation_if_match_required/,
  );

  const confirmed = {
    ...draft,
    attestationState: MultichannelAttestationState.Confirmed,
    attesterReference: AUTHOR,
    attesterMode: CompositionAttesterModes.Personal,
    attestedAt: BASE.createdAt,
  };
  const claims = mapMultichannelOperationToFlatClaims(MultichannelOperationId.Immunization, confirmed);
  assert.equal(claims[CompositionClaim.Attester], AUTHOR);
  assert.equal(claims[CompositionClaim.AttesterMode], CompositionAttesterModes.Personal);
  assert.equal(claims[CompositionClaim.AttesterTime], BASE.createdAt);
});

test('validation rejects missing required claims, malformed timestamps and unknown fields', () => {
  assert.throws(
    () => assertValidMultichannelOperation(MultichannelOperationId.AllergyIntolerance, {
      ...BASE,
      claims: { [AllergyIntoleranceClaim.ClinicalStatus]: 'active' },
    }),
    /multichannel_operation_required:claims.AllergyIntolerance.code-text/,
  );
  assert.throws(
    () => assertValidMultichannelOperation(MultichannelOperationId.Condition, {
      ...BASE,
      createdAt: 'not-a-date',
      claims: { [ConditionClaim.CodeText]: 'Condition' },
    }),
    /multichannel_operation_format:createdAt/,
  );
  assert.throws(
    () => assertValidMultichannelOperation(MultichannelOperationId.Condition, {
      ...BASE,
      claims: { [ConditionClaim.CodeText]: 'Condition', unsupported: true },
    }),
    /multichannel_operation_unknown:claims.unsupported/,
  );
});

test('subject registration schema validates common person or animal demographics without inventing clinical provenance', () => {
  const subject = {
    ...BASE,
    subjectKind: 'animal',
    claims: {
      [SchemaOrgOrganizationClaim.IdentifierValue]: UUID,
      [SchemaOrgOrganizationClaim.AlternateName]: 'Animal 1',
      [SchemaOrgOrganizationClaim.MemberBirthDate]: '2022-01',
      [SchemaOrgOrganizationClaim.MemberAdditionalType]: '9615',
      [SchemaOrgOrganizationClaim.MemberRole]: 'ONESELF',
    },
  };
  assert.doesNotThrow(() => assertValidMultichannelOperation(MultichannelOperationId.Subject, subject));
  assert.throws(
    () => assertValidMultichannelOperation(MultichannelOperationId.Subject, {
      ...subject,
      claims: { ...subject.claims, [SchemaOrgOrganizationClaim.MemberAdditionalType]: '' },
    }),
    /multichannel_operation_species_required/,
  );
});

test('legal organization registration uses the migrated Schema.org claims and fails closed without jurisdiction', () => {
  const registration = {
    ...BASE,
    sector: REPOSITORY_SAFE_EXAMPLES.sector,
    claims: {
      [SchemaOrgOrganizationClaim.IdentifierType]: REPOSITORY_SAFE_EXAMPLES.organizationIdentifierType,
      [SchemaOrgOrganizationClaim.IdentifierValue]: REPOSITORY_SAFE_EXAMPLES.organizationBusinessNumber,
      [SchemaOrgOrganizationClaim.LegalName]: REPOSITORY_SAFE_EXAMPLES.organizationLegalName,
      [SchemaOrgOrganizationClaim.AddressCountry]: REPOSITORY_SAFE_EXAMPLES.countryIso2,
    },
  };
  assert.doesNotThrow(() => assertValidMultichannelOperation(MultichannelOperationId.LegalOrganization, registration));
  assert.throws(
    () => assertValidMultichannelOperation(MultichannelOperationId.LegalOrganization, {
      ...registration,
      claims: { ...registration.claims, [SchemaOrgOrganizationClaim.AddressCountry]: '' },
    }),
    /multichannel_operation_required:claims.org.schema.Organization.address.addressCountry/,
  );
});

test('Task uses the shared form and preserves caller-independent authoring fields', () => {
  const task = {
    ...BASE,
    claims: {
      [TaskClaim.Status]: TaskStatus.Requested,
      [TaskClaim.Intent]: TaskIntent.Order,
      [TaskClaim.Identifier]: REPOSITORY_SAFE_EXAMPLES.organizationBusinessNumber,
    },
  };
  const claims = mapMultichannelOperationToFlatClaims(MultichannelOperationId.Task, task);
  assert.equal(claims[TaskClaim.Identifier], UUID);
  assert.equal(claims[TaskClaim.Subject], SUBJECT);
  assert.equal(claims[TaskClaim.Status], TaskStatus.Requested);
  assert.throws(
    () => assertValidMultichannelOperation(MultichannelOperationId.Task, {
      ...task,
      claims: { [TaskClaim.Status]: TaskStatus.Requested },
    }),
    /multichannel_operation_required:claims.Task.intent/,
  );
});
