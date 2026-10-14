// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.

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
import { ObservationClaim } from 'fhir-data-utils-ts/observation-claims';
import { BundleEditor, BundleOperations, BundleTypes } from 'gdc-common-utils-ts/utils/bundle-editor';
import { BundleReader } from 'gdc-common-utils-ts/utils/bundle-reader';
import type { BundleEntry, BundleJsonApi } from 'gdc-common-utils-ts/models/bundle';
import { SchemaOrgActionClaim, SchemaOrgOrganizationClaim } from './schema-org-claims.js';
import { TaskArtifactSchema, TaskClaim } from './task-artifact-schema.js';

export const MultichannelOperationId = Object.freeze({
  Subject: 'subject.upsert',
  LegalOrganization: 'legal-organization.register',
  Appointment: 'clinical.appointment.upsert',
  Immunization: 'clinical.immunization.upsert',
  AllergyIntolerance: 'clinical.allergy-intolerance.upsert',
  MedicationStatement: 'clinical.medication-statement.upsert',
  Observation: 'clinical.observation.upsert',
  Procedure: 'clinical.procedure.upsert',
  Condition: 'clinical.condition.upsert',
  DiagnosticReport: 'clinical.diagnostic-report.upsert',
  DocumentReference: 'clinical.document-reference.upsert',
  Task: 'workflow.task.upsert',
} as const);

export type MultichannelOperationIdValue =
  typeof MultichannelOperationId[keyof typeof MultichannelOperationId];

export type MultichannelOperationValues = Readonly<Record<string, unknown> & {
  operation: typeof MultichannelOperationMode[keyof typeof MultichannelOperationMode];
  resourceId: string;
  language: string;
  createdAt: string;
  dataAuthorReference: string;
  attestationState: typeof MultichannelAttestationState[keyof typeof MultichannelAttestationState];
  claims: Readonly<Record<string, unknown>>;
}>;

export type MultichannelOperationReadOptions = Readonly<{
  operation: typeof MultichannelOperationMode[keyof typeof MultichannelOperationMode];
  resourceId?: string;
  ifMatch?: string;
}>;

export const MultichannelOperationMode = Object.freeze({ Create: 'create', Update: 'update' } as const);
export const MultichannelAttestationState = Object.freeze({ Draft: 'draft', Confirmed: 'confirmed' } as const);

type JsonSchemaType = 'object' | 'string' | 'integer' | 'number' | 'boolean' | 'array';

export type MultichannelOperationSchemaNode = Readonly<{
  type?: JsonSchemaType;
  title?: string;
  description?: string;
  format?: 'uuid' | 'fhir-id' | 'date' | 'date-time' | 'fhir-date-time' | 'date-precision' | 'bcp47';
  enum?: readonly unknown[];
  default?: unknown;
  properties?: Readonly<Record<string, MultichannelOperationSchemaNode>>;
  required?: readonly string[];
  additionalProperties?: boolean;
  items?: MultichannelOperationSchemaNode;
  anyOf?: readonly MultichannelOperationSchemaNode[];
}>;

export type MultichannelOperationSchema = MultichannelOperationSchemaNode & Readonly<{
  $schema: 'https://json-schema.org/draft/2020-12/schema';
  $id: string;
  type: 'object';
  properties: Readonly<Record<string, MultichannelOperationSchemaNode>>;
  required: readonly string[];
  additionalProperties: false;
  'x-operation-id': MultichannelOperationIdValue;
  'x-resource-type': string;
}>;

type ResourceDescriptor = Readonly<{
  resourceType: string;
  identifierClaim: string;
  subjectClaim: string;
  claimProperties: Readonly<Record<string, MultichannelOperationSchemaNode>>;
  requiredClaims: readonly string[];
  anyOfClaims?: readonly (readonly string[])[];
}>;

const stringField = (title: string, format?: MultichannelOperationSchemaNode['format'], defaultValue?: string): MultichannelOperationSchemaNode =>
  Object.freeze({ type: 'string', title, ...(format ? { format } : {}), ...(defaultValue !== undefined ? { default: defaultValue } : {}) });
const numberField = (title: string): MultichannelOperationSchemaNode => Object.freeze({ type: 'number', title });

const CLINICAL_DESCRIPTORS: Readonly<Record<string, ResourceDescriptor>> = Object.freeze({
  [MultichannelOperationId.Appointment]: descriptor('Appointment', AppointmentClaim.Identifier, AppointmentClaim.ParticipantActor, {
    [AppointmentClaim.Status]: stringField('Status'),
    [AppointmentClaim.Start]: stringField('Start', 'date-time'),
    [AppointmentClaim.End]: stringField('End', 'date-time'),
    [AppointmentClaim.Description]: stringField('Description'),
    [AppointmentClaim.NoteText]: stringField('Note'),
    [AppointmentClaim.ParticipantActor]: stringField('Participant'),
  }, [AppointmentClaim.Status, AppointmentClaim.Start]),
  [MultichannelOperationId.Immunization]: descriptor('Immunization', ImmunizationClaim.Identifier, ImmunizationClaim.Subject, {
    [ImmunizationClaim.Status]: stringField('Status', undefined, 'completed'),
    [ImmunizationClaim.Date]: stringField('Administration date', 'fhir-date-time'),
    [ImmunizationClaim.VaccineCode]: stringField('Vaccine code'),
    [ImmunizationClaim.VaccineCodeText]: stringField('Vaccine name'),
    [ImmunizationClaim.VaccineCodeDisplay]: stringField('Vaccine terminology display'),
    [ImmunizationClaim.TargetDisease]: stringField('Target disease'),
    [ImmunizationClaim.TargetDiseaseText]: stringField('Target disease text'),
    [ImmunizationClaim.TargetDiseaseDisplay]: stringField('Target disease terminology display'),
    [ImmunizationClaim.LotNumber]: stringField('Lot number'),
    [ImmunizationClaim.DoseSequence]: numberField('Dose sequence'),
    [ImmunizationClaim.Manufacturer]: stringField('Manufacturer'),
    [ImmunizationClaim.Performer]: stringField('Performer'),
    [ImmunizationClaim.Location]: stringField('Location'),
    [ImmunizationClaim.Route]: stringField('Administration route'),
    [ImmunizationClaim.RouteDisplay]: stringField('Administration route display'),
    [ImmunizationClaim.Site]: stringField('Administration site'),
    [ImmunizationClaim.SiteDisplay]: stringField('Administration site display'),
    [ImmunizationClaim.Series]: stringField('Series'),
    [ImmunizationClaim.ReactionDate]: stringField('Reaction date', 'fhir-date-time'),
    [ImmunizationClaim.Note]: stringField('Note'),
  }, [ImmunizationClaim.Status, ImmunizationClaim.Date, ImmunizationClaim.VaccineCodeText]),
  [MultichannelOperationId.AllergyIntolerance]: descriptor('AllergyIntolerance', AllergyIntoleranceClaim.Identifier, AllergyIntoleranceClaim.Subject, {
    [AllergyIntoleranceClaim.ClinicalStatus]: stringField('Clinical status', undefined, 'active'),
    [AllergyIntoleranceClaim.Category]: stringField('Category'),
    [AllergyIntoleranceClaim.VerificationStatus]: stringField('Verification status'),
    [AllergyIntoleranceClaim.Code]: stringField('Code'),
    [AllergyIntoleranceClaim.CodeText]: stringField('Allergy or intolerance'),
    [AllergyIntoleranceClaim.CodeDisplay]: stringField('Terminology display'),
    [AllergyIntoleranceClaim.OnsetDateTime]: stringField('Onset', 'date-time'),
    [AllergyIntoleranceClaim.RecordedDate]: stringField('Recorded date', 'date-time'),
    [AllergyIntoleranceClaim.Criticality]: stringField('Criticality'),
    [AllergyIntoleranceClaim.Asserter]: stringField('Asserter'),
    [AllergyIntoleranceClaim.Recorder]: stringField('Recorder'),
  }, [AllergyIntoleranceClaim.ClinicalStatus, AllergyIntoleranceClaim.CodeText]),
  [MultichannelOperationId.MedicationStatement]: descriptor('MedicationStatement', MedicationStatementClaim.Identifier, MedicationStatementClaim.Subject, {
    [MedicationStatementClaim.Status]: stringField('Status', undefined, 'active'),
    [MedicationStatementClaim.Category]: stringField('Category'),
    [MedicationStatementClaim.Code]: stringField('Medication code'),
    [MedicationStatementClaim.CodeText]: stringField('Medication name'),
    [MedicationStatementClaim.CodeDisplay]: stringField('Terminology display'),
    [MedicationStatementClaim.Effective]: stringField('Effective date', 'date-time'),
    [MedicationStatementClaim.EffectivePeriodStart]: stringField('Period start', 'date-time'),
    [MedicationStatementClaim.EffectivePeriodEnd]: stringField('Period end', 'date-time'),
    [MedicationStatementClaim.DosageInstruction]: stringField('Dosage instruction'),
    [MedicationStatementClaim.DosageRoute]: stringField('Dosage route'),
    [MedicationStatementClaim.TimingFrequency]: numberField('Timing frequency'),
    [MedicationStatementClaim.TimingPeriod]: numberField('Timing period'),
    [MedicationStatementClaim.TimingPeriodUnit]: stringField('Timing period unit'),
    [MedicationStatementClaim.Note]: stringField('Note'),
  }, [MedicationStatementClaim.Status, MedicationStatementClaim.CodeText], [
    [MedicationStatementClaim.Effective], [MedicationStatementClaim.EffectivePeriodStart],
  ]),
  [MultichannelOperationId.Observation]: descriptor('Observation', ObservationClaim.Identifier, ObservationClaim.Subject, {
    [ObservationClaim.Status]: stringField('Status', undefined, 'final'),
    [ObservationClaim.Category]: stringField('Observation category'),
    [ObservationClaim.Code]: stringField('Observation code token'),
    [ObservationClaim.CodeSystem]: stringField('Code system'),
    [ObservationClaim.CodeValue]: stringField('Code value'),
    [ObservationClaim.CodeText]: stringField('Observation'),
    [ObservationClaim.CodeDisplay]: stringField('Terminology display'),
    [ObservationClaim.Date]: stringField('Observation date', 'fhir-date-time'),
    [ObservationClaim.EffectiveDateTime]: stringField('Measured at', 'date-time'),
    [ObservationClaim.Encounter]: stringField('Encounter'),
    [ObservationClaim.Performer]: stringField('Performer'),
    [ObservationClaim.Method]: stringField('Method'),
    [ObservationClaim.Specimen]: stringField('Specimen'),
    [ObservationClaim.Device]: stringField('Device'),
    [ObservationClaim.ValueQuantityNumber]: numberField('Numeric value'),
    [ObservationClaim.ValueQuantityUnit]: stringField('Unit'),
    [ObservationClaim.ValueString]: stringField('Text value'),
    [ObservationClaim.ValueConceptValue]: stringField('Coded value'),
    [ObservationClaim.ValueConcept]: stringField('Coded value token'),
    [ObservationClaim.ValueConceptText]: stringField('Coded value text'),
    [ObservationClaim.ValueConceptDisplay]: stringField('Coded value display'),
    [ObservationClaim.ReferenceRangeLowNumber]: numberField('Reference range minimum'),
    [ObservationClaim.ReferenceRangeHighNumber]: numberField('Reference range maximum'),
    [ObservationClaim.ReferenceRangeUnit]: stringField('Reference range unit'),
    [ObservationClaim.ReferenceRangeText]: stringField('Reference range text'),
    [ObservationClaim.Note]: stringField('Note'),
  }, [ObservationClaim.Status, ObservationClaim.CodeText, ObservationClaim.EffectiveDateTime], [
    [ObservationClaim.ValueQuantityNumber], [ObservationClaim.ValueString], [ObservationClaim.ValueConceptValue],
  ]),
  [MultichannelOperationId.Procedure]: descriptor('Procedure', ProcedureClaim.Identifier, ProcedureClaim.Subject, {
    [ProcedureClaim.Status]: stringField('Status', undefined, 'completed'),
    [ProcedureClaim.Code]: stringField('Procedure code'),
    [ProcedureClaim.CodeText]: stringField('Procedure'),
    [ProcedureClaim.CodeDisplay]: stringField('Terminology display'),
    [ProcedureClaim.Date]: stringField('Performed at', 'date-time'),
    [ProcedureClaim.Performer]: stringField('Performer'),
    [ProcedureClaim.Location]: stringField('Location'),
    [ProcedureClaim.BodySite]: stringField('Body site'),
    [ProcedureClaim.ReasonCode]: stringField('Reason code'),
    [ProcedureClaim.ReasonReference]: stringField('Reason reference'),
    [ProcedureClaim.Note]: stringField('Note'),
  }, [ProcedureClaim.Status, ProcedureClaim.CodeText, ProcedureClaim.Date]),
  [MultichannelOperationId.Condition]: descriptor('Condition', ConditionClaim.Identifier, ConditionClaim.Subject, {
    [ConditionClaim.ClinicalStatus]: stringField('Clinical status', undefined, 'active'),
    [ConditionClaim.Category]: stringField('Category'),
    [ConditionClaim.Severity]: stringField('Severity'),
    [ConditionClaim.VerificationStatus]: stringField('Verification status'),
    [ConditionClaim.Code]: stringField('Condition code'),
    [ConditionClaim.CodeText]: stringField('Condition'),
    [ConditionClaim.CodeDisplay]: stringField('Terminology display'),
    [ConditionClaim.OnsetDateTime]: stringField('Onset', 'date-time'),
    [ConditionClaim.RecordedDate]: stringField('Recorded at', 'date-time'),
    [ConditionClaim.Asserter]: stringField('Asserter'),
    [ConditionClaim.Recorder]: stringField('Recorder'),
  }, [ConditionClaim.CodeText]),
  [MultichannelOperationId.DiagnosticReport]: descriptor('DiagnosticReport', DiagnosticReportClaim.Identifier, DiagnosticReportClaim.Subject, {
    [DiagnosticReportClaim.Status]: stringField('Status'),
    [DiagnosticReportClaim.Code]: stringField('Report code'),
    [DiagnosticReportClaim.CodeText]: stringField('Report'),
    [DiagnosticReportClaim.CodeDisplay]: stringField('Terminology display'),
    [DiagnosticReportClaim.Date]: stringField('Issued at', 'date-time'),
    [DiagnosticReportClaim.Performer]: stringField('Performer'),
    [DiagnosticReportClaim.PresentedFormContentType]: stringField('Attachment content type'),
    [DiagnosticReportClaim.PresentedFormUrl]: stringField('Attachment URL'),
  }, [DiagnosticReportClaim.Status, DiagnosticReportClaim.CodeText, DiagnosticReportClaim.Date]),
  [MultichannelOperationId.DocumentReference]: descriptor('DocumentReference', DocumentReferenceClaim.Identifier, DocumentReferenceClaim.Subject, {
    [DocumentReferenceClaim.ContentType]: stringField('Content type'),
    [DocumentReferenceClaim.ContentHash]: stringField('Content hash'),
    [DocumentReferenceClaim.ContentData]: stringField('Inline content'),
    [DocumentReferenceClaim.Location]: stringField('Content URL'),
    [DocumentReferenceClaim.Creation]: stringField('Content created at', 'date-time'),
    [DocumentReferenceClaim.Date]: stringField('Registered at', 'date-time'),
    [DocumentReferenceClaim.Type]: stringField('Document type'),
    [DocumentReferenceClaim.TypeText]: stringField('Document type text'),
    [DocumentReferenceClaim.Description]: stringField('Description'),
    [DocumentReferenceClaim.Author]: stringField('Document author'),
    [DocumentReferenceClaim.Attester]: stringField('Document attester'),
  }, [DocumentReferenceClaim.ContentType], [
    [DocumentReferenceClaim.ContentHash], [DocumentReferenceClaim.ContentData], [DocumentReferenceClaim.Location],
  ]),
});

const commonProperties: Readonly<Record<string, MultichannelOperationSchemaNode>> = Object.freeze({
  operation: Object.freeze({ type: 'string', title: 'Operation', enum: Object.values(MultichannelOperationMode) }),
  resourceId: stringField('FHIR resource id', 'fhir-id'),
  subjectReference: stringField('Subject reference'),
  language: stringField('Content language', 'bcp47'),
  createdAt: stringField('Creation date', 'date-time'),
  dataAuthorReference: stringField('Data author reference'),
  attestationState: Object.freeze({ type: 'string', title: 'Attestation state', enum: Object.values(MultichannelAttestationState) }),
  attesterReference: stringField('Attester assignment reference'),
  attesterMode: Object.freeze({ type: 'string', title: 'Attester mode', enum: Object.values(CompositionAttesterModes) }),
  attestedAt: stringField('Attested at', 'date-time'),
  ifMatch: stringField('Current version'),
});

const clinicalSchemas = Object.fromEntries(Object.entries(CLINICAL_DESCRIPTORS).map(([operationId, resource]) => [
  operationId,
  clinicalSchema(operationId as MultichannelOperationIdValue, resource),
])) as Partial<Record<MultichannelOperationIdValue, MultichannelOperationSchema>>;

const subjectClaims = Object.freeze({
  [SchemaOrgOrganizationClaim.IdentifierValue]: stringField('Individual organization identifier'),
  [SchemaOrgOrganizationClaim.AlternateName]: stringField('Usual name'),
  [SchemaOrgOrganizationClaim.MemberName]: stringField('Member usual name'),
  [SchemaOrgOrganizationClaim.MemberAdditionalType]: stringField('NCBI Taxonomy type'),
  [SchemaOrgOrganizationClaim.MemberBirthDate]: stringField('Birth date', 'date-precision'),
  [SchemaOrgOrganizationClaim.MemberRole]: stringField('Member relationship'),
  [SchemaOrgOrganizationClaim.OwnerEmail]: stringField('Controller email'),
  [SchemaOrgOrganizationClaim.OwnerTelephone]: stringField('Controller telephone'),
});

const SUBJECT_SCHEMA: MultichannelOperationSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:cds:schema:multichannel:subject-upsert:v1',
  'x-operation-id': MultichannelOperationId.Subject,
  'x-resource-type': 'IndividualOrganization',
  type: 'object', additionalProperties: false,
  properties: Object.freeze({
    ...commonProperties,
    subjectKind: Object.freeze({ type: 'string', title: 'Subject kind', enum: Object.freeze(['person', 'animal']) }),
    claims: Object.freeze({
      type: 'object', title: 'Individual organization claims', additionalProperties: false,
      properties: subjectClaims,
      required: Object.freeze([SchemaOrgOrganizationClaim.IdentifierValue, SchemaOrgOrganizationClaim.MemberRole]),
    }),
  }),
  required: Object.freeze(['operation', 'resourceId', 'language', 'createdAt', 'dataAuthorReference', 'attestationState', 'subjectKind', 'claims']),
});

const LEGAL_ORGANIZATION_SCHEMA: MultichannelOperationSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:cds:schema:multichannel:legal-organization-registration:v1',
  'x-operation-id': MultichannelOperationId.LegalOrganization,
  'x-resource-type': 'LegalOrganization',
  type: 'object', additionalProperties: false,
  properties: Object.freeze({
    ...commonProperties,
    sector: stringField('Business sector'),
    claims: Object.freeze({
      type: 'object', title: 'Legal organization claims', additionalProperties: false,
      properties: Object.freeze({
        [SchemaOrgOrganizationClaim.IdentifierType]: stringField('Identifier type'),
        [SchemaOrgOrganizationClaim.IdentifierValue]: stringField('Identifier value'),
        [SchemaOrgOrganizationClaim.LegalName]: stringField('Legal name'),
        [SchemaOrgOrganizationClaim.AddressCountry]: stringField('Country'),
        [SchemaOrgOrganizationClaim.AddressRegion]: stringField('Region'),
        [SchemaOrgOrganizationClaim.AddressLocality]: stringField('Locality'),
        [SchemaOrgOrganizationClaim.PostalCode]: stringField('Postal code'),
        [SchemaOrgOrganizationClaim.StreetAddress]: stringField('Street address'),
        [SchemaOrgOrganizationClaim.Email]: stringField('Official email'),
        [SchemaOrgOrganizationClaim.Telephone]: stringField('Official telephone'),
      }),
      required: Object.freeze([
        SchemaOrgOrganizationClaim.IdentifierType,
        SchemaOrgOrganizationClaim.IdentifierValue,
        SchemaOrgOrganizationClaim.LegalName,
        SchemaOrgOrganizationClaim.AddressCountry,
      ]),
    }),
  }),
  required: Object.freeze(['operation', 'resourceId', 'language', 'createdAt', 'dataAuthorReference', 'attestationState', 'sector', 'claims']),
});

const TASK_SCHEMA: MultichannelOperationSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:cds:schema:multichannel:workflow-task-upsert:v1',
  'x-operation-id': MultichannelOperationId.Task,
  'x-resource-type': TaskArtifactSchema.resourceType,
  type: 'object', additionalProperties: false,
  properties: Object.freeze({
    ...commonProperties,
    claims: Object.freeze({
      type: 'object', title: 'Task flat claims', additionalProperties: false,
      properties: Object.freeze(Object.fromEntries([
        ...TaskArtifactSchema.requiredClaims,
        ...TaskArtifactSchema.optionalClaims,
      ].map(claim => [claim, stringField(claim)]))),
      required: TaskArtifactSchema.requiredClaims,
    }),
  }),
  required: Object.freeze(['operation', 'resourceId', 'subjectReference', 'language', 'createdAt', 'dataAuthorReference', 'claims']),
});

/** One immutable JSON Schema registry consumed by portal, voice, WhatsApp and chat. */
export const MULTICHANNEL_OPERATION_SCHEMAS = Object.freeze({
  [MultichannelOperationId.Subject]: SUBJECT_SCHEMA,
  [MultichannelOperationId.LegalOrganization]: LEGAL_ORGANIZATION_SCHEMA,
  [MultichannelOperationId.Task]: TASK_SCHEMA,
  ...clinicalSchemas,
}) as Readonly<Record<MultichannelOperationIdValue, MultichannelOperationSchema>>;

/** Resolves the one shared clinical operation owned by a FHIR resource type. */
export function resolveMultichannelClinicalOperationId(resourceType: string): MultichannelOperationIdValue {
  const match = Object.entries(CLINICAL_DESCRIPTORS)
    .find(([, descriptorValue]) => descriptorValue.resourceType === resourceType)?.[0];
  if (!match) throw new TypeError('multichannel_clinical_resource_type_unsupported');
  return match as MultichannelOperationIdValue;
}

/** Validates required, typed, formatted and allowed fields before any channel persists a write. */
export function assertValidMultichannelOperation(
  operationId: MultichannelOperationIdValue,
  values: Readonly<Record<string, unknown>>,
): void {
  const schema = MULTICHANNEL_OPERATION_SCHEMAS[operationId];
  if (!schema) throw new TypeError('multichannel_operation_unknown_schema');
  validateNode(schema, values, '');
  if (values.operation === MultichannelOperationMode.Update && missing(values.ifMatch)) {
    throw new TypeError('multichannel_operation_if_match_required');
  }
  if (values.attestationState === MultichannelAttestationState.Confirmed
      && ['attesterReference', 'attesterMode', 'attestedAt'].some(key => missing(values[key]))) {
    throw new TypeError('multichannel_operation_attester_required');
  }
  if (operationId === MultichannelOperationId.Subject && values.subjectKind === 'animal') {
    const claims = values.claims as Record<string, unknown>;
    if (missing(claims?.[SchemaOrgOrganizationClaim.MemberAdditionalType])) {
      throw new TypeError('multichannel_operation_species_required');
    }
  }
}

/**
 * Maps validated channel values into the same flat claims used by the typed
 * builders. Clinical writes receive Composition provenance; onboarding writes
 * receive Schema.org Action provenance. Transport sender is never inferred.
 */
export function mapMultichannelOperationToFlatClaims(
  operationId: MultichannelOperationIdValue,
  values: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  assertValidMultichannelOperation(operationId, values);
  const submittedClaims = { ...(values.claims as Record<string, unknown>) };
  const descriptorValue = CLINICAL_DESCRIPTORS[operationId];
  if (!descriptorValue) {
    if (operationId === MultichannelOperationId.Task) {
      return Object.freeze({
        [SchemaOrgActionClaim.AgentIdentifier]: values.dataAuthorReference,
        [SchemaOrgActionClaim.StartTime]: values.createdAt,
        ...submittedClaims,
        [TaskClaim.Identifier]: values.resourceId,
        [TaskClaim.Subject]: values.subjectReference,
        [TaskClaim.Language]: values.language,
        [TaskClaim.AuthoredOn]: values.createdAt,
      });
    }
    return Object.freeze({
      [SchemaOrgActionClaim.AgentIdentifier]: values.dataAuthorReference,
      [SchemaOrgActionClaim.StartTime]: values.createdAt,
      ...submittedClaims,
    });
  }
  const claims: Record<string, unknown> = {
    [CompositionClaim.Subject]: values.subjectReference,
    [CompositionClaim.Date]: values.createdAt,
    [CompositionClaim.Author]: values.dataAuthorReference,
    [descriptorValue.identifierClaim]: values.resourceId,
    [descriptorValue.subjectClaim]: values.subjectReference,
    [`${descriptorValue.resourceType}.language`]: values.language,
    ...submittedClaims,
  };
  if (values.attestationState === MultichannelAttestationState.Confirmed) {
    claims[CompositionClaim.Attester] = values.attesterReference;
    claims[CompositionClaim.AttesterMode] = values.attesterMode;
    claims[CompositionClaim.AttesterTime] = values.attestedAt;
  }
  return Object.freeze(claims);
}

/** Selects only the resource claim values owned by one shared JSON Schema. */
export function selectMultichannelOperationClaimValues(
  operationId: MultichannelOperationIdValue,
  flatClaims: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const schema = MULTICHANNEL_OPERATION_SCHEMAS[operationId];
  const claimSchema = schema.properties.claims;
  if (!claimSchema?.properties) throw new TypeError('multichannel_operation_claim_schema_required');
  return Object.freeze(Object.fromEntries(Object.keys(claimSchema.properties)
    .filter(claim => flatClaims[claim] !== undefined && flatClaims[claim] !== null && flatClaims[claim] !== '')
    .map(claim => [claim, flatClaims[claim]])));
}

/**
 * Validates one schema-owned operation and stages its canonical flat claims
 * through the shared BundleEditor. Portals and assisted channels must not
 * rebuild this claim bag themselves.
 */
export function buildMultichannelOperationBundle(
  operationId: MultichannelOperationIdValue,
  values: Readonly<Record<string, unknown>>,
): BundleJsonApi<BundleEntry> {
  const schema = MULTICHANNEL_OPERATION_SCHEMAS[operationId];
  const claims = mapMultichannelOperationToFlatClaims(operationId, values);
  const editor = new BundleEditor()
    .setBundleOperation(BundleOperations.create)
    .setBundleType(BundleTypes.batch)
    .setAllowedResourceType(schema['x-resource-type']);
  const entry = editor.newEntry(String(values.resourceId), schema['x-resource-type']);
  for (const [claim, value] of Object.entries(claims)) entry.setClaim(claim, value);
  entry.setResourceId(String(values.resourceId));
  if (values.operation === MultichannelOperationMode.Update) {
    entry.update().ifMatch(String(values.ifMatch));
  } else {
    entry.create();
  }
  return editor.buildJsonApi();
}

/**
 * Hydrates the exact JSON Schema values from an authoritative claims-first
 * BundleReader entry. Only fields declared by the selected schema are exposed
 * to the form; transport, unrelated and host-owned claims stay outside it.
 */
export function readMultichannelOperationFromBundle(
  operationId: MultichannelOperationIdValue,
  bundle: unknown,
  options: MultichannelOperationReadOptions,
): MultichannelOperationValues {
  const schema = MULTICHANNEL_OPERATION_SCHEMAS[operationId];
  const descriptorValue = CLINICAL_DESCRIPTORS[operationId];
  if (!descriptorValue) throw new TypeError('multichannel_operation_bundle_reader_clinical_required');
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) throw new TypeError('fhir_bundle_required');
  const reader = new BundleReader(bundle as Record<string, unknown>);
  const entries = reader.getEntries();
  const entryIndex = entries.findIndex((entry, index) => {
    const resource = entry.resource as Record<string, unknown> | undefined;
    if (resource?.resourceType !== schema['x-resource-type']) return false;
    if (!options.resourceId) return true;
    const claims = reader.getEntryClaimsByArrayIndex(index);
    return resource.id === options.resourceId || claims[descriptorValue.identifierClaim] === options.resourceId;
  });
  if (entryIndex < 0) throw new TypeError('multichannel_operation_bundle_entry_required');
  const entry = entries[entryIndex];
  const resource = entry.resource as Record<string, unknown>;
  const request = entry.request as Record<string, unknown> | undefined;
  const flatClaims = reader.getEntryClaimsByArrayIndex(entryIndex);
  const claims = selectMultichannelOperationClaimValues(operationId, flatClaims);
  const attesterReference = flatClaims[CompositionClaim.Attester];
  const values = compactOperationValues({
    operation: options.operation,
    resourceId: flatClaims[descriptorValue.identifierClaim] || resource.id,
    subjectReference: flatClaims[descriptorValue.subjectClaim],
    language: flatClaims[`${descriptorValue.resourceType}.language`],
    createdAt: flatClaims[CompositionClaim.Date],
    dataAuthorReference: flatClaims[CompositionClaim.Author],
    attestationState: missing(attesterReference)
      ? MultichannelAttestationState.Draft
      : MultichannelAttestationState.Confirmed,
    attesterReference,
    attesterMode: flatClaims[CompositionClaim.AttesterMode],
    attestedAt: flatClaims[CompositionClaim.AttesterTime],
    ifMatch: options.ifMatch || request?.ifMatch,
    claims,
  }) as MultichannelOperationValues;
  assertValidMultichannelOperation(operationId, values);
  return Object.freeze({ ...values, claims: Object.freeze({ ...claims }) });
}

function descriptor(
  resourceType: string,
  identifierClaim: string,
  subjectClaim: string,
  claimProperties: Readonly<Record<string, MultichannelOperationSchemaNode>>,
  requiredClaims: readonly string[],
  anyOfClaims?: readonly (readonly string[])[],
): ResourceDescriptor {
  return Object.freeze({ resourceType, identifierClaim, subjectClaim, claimProperties: Object.freeze(claimProperties), requiredClaims: Object.freeze(requiredClaims), ...(anyOfClaims ? { anyOfClaims } : {}) });
}

function clinicalSchema(operationId: MultichannelOperationIdValue, resource: ResourceDescriptor): MultichannelOperationSchema {
  const claims: MultichannelOperationSchemaNode = Object.freeze({
    type: 'object', title: `${resource.resourceType} flat claims`, additionalProperties: false,
    properties: resource.claimProperties,
    required: resource.requiredClaims,
    ...(resource.anyOfClaims ? { anyOf: resource.anyOfClaims.map(required => Object.freeze({ required })) } : {}),
  });
  return Object.freeze({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `urn:cds:schema:multichannel:${operationId}:v1`,
    'x-operation-id': operationId,
    'x-resource-type': resource.resourceType,
    type: 'object', additionalProperties: false,
    properties: Object.freeze({ ...commonProperties, claims }),
    required: Object.freeze(['operation', 'resourceId', 'subjectReference', 'language', 'createdAt', 'dataAuthorReference', 'attestationState', 'claims']),
  });
}

function validateNode(schema: MultichannelOperationSchemaNode, value: unknown, path: string): void {
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`multichannel_operation_type:${path || 'root'}`);
    const record = value as Record<string, unknown>;
    for (const required of schema.required || []) {
      if (missing(record[required])) throw new TypeError(`multichannel_operation_required:${joinPath(path, required)}`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(record)) {
        if (!schema.properties?.[key]) throw new TypeError(`multichannel_operation_unknown:${joinPath(path, key)}`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (record[key] !== undefined) validateNode(child, record[key], joinPath(path, key));
    }
    if (schema.anyOf?.length && !schema.anyOf.some(option => (option.required || []).every(key => !missing(record[key])))) {
      throw new TypeError(`multichannel_operation_any_of:${path || 'root'}`);
    }
    return;
  }
  if (schema.type === 'string' && typeof value !== 'string') throw new TypeError(`multichannel_operation_type:${path}`);
  if (schema.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw new TypeError(`multichannel_operation_type:${path}`);
  if (schema.type === 'integer' && (!Number.isInteger(value))) throw new TypeError(`multichannel_operation_type:${path}`);
  if (schema.type === 'boolean' && typeof value !== 'boolean') throw new TypeError(`multichannel_operation_type:${path}`);
  if (schema.type === 'array' && !Array.isArray(value)) throw new TypeError(`multichannel_operation_type:${path}`);
  if (schema.enum && !schema.enum.includes(value)) throw new TypeError(`multichannel_operation_enum:${path}`);
  if (typeof value === 'string' && schema.format && !validFormat(schema.format, value)) throw new TypeError(`multichannel_operation_format:${path}`);
}

function validFormat(format: NonNullable<MultichannelOperationSchemaNode['format']>, value: string): boolean {
  if (format === 'uuid') return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  if (format === 'fhir-id') return /^[A-Za-z0-9\-.]{1,64}$/.test(value);
  if (format === 'date-time') return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
  if (format === 'fhir-date-time') return /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) && !Number.isNaN(Date.parse(value));
  if (format === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
  if (format === 'date-precision') return /^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/.test(value);
  return /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(value);
}

function missing(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0);
}

function joinPath(parent: string, child: string): string { return parent ? `${parent}.${child}` : child; }

function compactOperationValues(values: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => !missing(value)));
}
