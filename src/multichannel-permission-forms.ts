import { BundleEditableResourceTypes, BundleEditor, BundleOperations, BundleTypes } from 'gdc-common-utils-ts/utils/bundle-editor';
import { BundleReader } from 'gdc-common-utils-ts/utils/bundle-reader';
import { buildConsentClaimsSimple } from 'gdc-common-utils-ts/utils/consent';
import {
  exportConsentClaims,
  importConsentEntry,
  type PermissionGrantDecision,
} from 'gdc-common-utils-ts/utils/permission-templates';
import { ClaimConsent, ConsentStatuses, type ConsentStatus } from 'gdc-common-utils-ts/models/consent-rule';
import type { BundleEntry, BundleJsonApi } from 'gdc-common-utils-ts/models/bundle';
import { Format as DataFormat } from 'gdc-common-utils-ts/constants/Schemas';
import { HttpMediaTypes } from 'gdc-common-utils-ts/constants/http';
import { DataspaceSectors } from 'gdc-common-utils-ts/constants/sectors';
import { HealthcareActorRoles } from 'gdc-common-utils-ts/constants/healthcare';
import { EmergencyProfessionalRoles } from './emergency-professional-roles.js';
import { CrossSectorOperationalSectors } from './cross-sector-access-policy.js';

export type MultichannelJsonSchemaProperty = Readonly<{
  type: 'string' | 'integer' | 'array';
  title: string;
  format?: string;
  enum?: readonly string[];
  items?: Readonly<{ type: 'string' | 'object' }>;
  minimum?: number;
}>;

export const MultichannelPermissionAudienceKinds = Object.freeze({
  Country: 'country',
  Organization: 'organization',
  PersonPhone: 'person-phone',
} as const);

export type MultichannelPermissionAudienceKind =
  (typeof MultichannelPermissionAudienceKinds)[keyof typeof MultichannelPermissionAudienceKinds];

/**
 * Sector of the organization or professional receiving the permission.
 * This is intentionally separate from `sector`, which identifies the target
 * data channel (`animal-care` or `health-care`).
 */
export const MultichannelPermissionRecipientSectors = Object.freeze({
  AnimalCare: DataspaceSectors.AnimalCare,
  AnimalLab: 'animal-lab',
  HealthCare: DataspaceSectors.HealthCare,
  HealthLab: 'health-lab',
  PublicHealth: CrossSectorOperationalSectors.PublicHealth,
  PublicSafety: CrossSectorOperationalSectors.PublicSafety,
  PassengerTransport: CrossSectorOperationalSectors.PassengerTransport,
  AnimalInsurance: DataspaceSectors.AnimalInsurance,
  HealthInsurance: DataspaceSectors.HealthInsurance,
} as const);

export type MultichannelPermissionRecipientSector =
  (typeof MultichannelPermissionRecipientSectors)[keyof typeof MultichannelPermissionRecipientSectors];

/** Shared standardized occupations whose authority still comes from credentials and Consent. */
export const MultichannelPermissionRoleClaims = Object.freeze({
  /** ISCO-08 2131: Biologists, botanists, zoologists and related professionals. */
  Researcher: 'ISCO-08|2131',
} as const);

export const MultichannelPermissionDataScopes = Object.freeze({
  /**
   * Minimum subject context needed to identify whose authorized data is being
   * shown: display/usual name, birth date or year, administrative sex when
   * recorded and, for animals, species. It is never a stand-alone clinical
   * disclosure choice.
   */
  SubjectDemographics: 'subject-demographics',
  ClinicalSections: 'clinical-sections',
  EmergencyContacts: 'emergency-contacts',
  Appointments: 'appointments',
  Billing: 'billing',
} as const);

export type MultichannelPermissionDataScope =
  (typeof MultichannelPermissionDataScopes)[keyof typeof MultichannelPermissionDataScopes];

export const MultichannelPermissionClinicalScopeModes = Object.freeze({
  AllIpsSections: 'all-ips-sections',
  SelectedIpsSections: 'selected-ips-sections',
} as const);

export type MultichannelPermissionClinicalScopeMode =
  (typeof MultichannelPermissionClinicalScopeModes)[keyof typeof MultichannelPermissionClinicalScopeModes];

export type MultichannelPermissionAudience = Readonly<{
  kind: MultichannelPermissionAudienceKind;
  /** ISO 3166-1 alpha-2 country code or normalized E.164 public telephone. */
  value: string;
}>;

export type MultichannelPermissionSetInput = Readonly<{
  subjectRef: string;
  audiences: readonly MultichannelPermissionAudience[];
  roles: readonly string[];
  dataScopes: readonly MultichannelPermissionDataScope[];
  decision: PermissionGrantDecision['decision'];
  /** Target data channel whose subject data is protected. */
  sector: string;
  /** Business sector of the exact recipient organization or professional. */
  recipientSector: MultichannelPermissionRecipientSector;
  clinicalScopeMode?: MultichannelPermissionClinicalScopeMode;
  ipsSectionCodes?: readonly string[];
}>;

export type MultichannelPermissionPolicy = Readonly<{
  /** Countries recognizing the paramedic occupation; never use it as a mobile-team alias. */
  paramedicCountryCodes?: readonly string[];
  /** Recipient sectors for which a country-wide audience is governed in each country. */
  countryAudienceRecipientSectorsByCountry?: Readonly<Record<string, readonly MultichannelPermissionRecipientSector[]>>;
  /** Optional complete role allowlist used to narrow a sector in a jurisdiction. */
  recipientRoleClaimsBySectorAndCountry?: Readonly<Record<
    string,
    Readonly<Record<string, readonly string[]>>
  >>;
}>;

export type MultichannelPermissionRoleContext = Readonly<{
  targetSector: string;
  recipientSector: MultichannelPermissionRecipientSector;
  /** Known audience type, used to remove roles that cannot apply to it. */
  audienceKind?: MultichannelPermissionAudienceKind;
  countryCode?: string;
}>;

export type MultichannelPermissionAudienceContext = Readonly<{
  recipientSector: MultichannelPermissionRecipientSector;
  countryCode?: string;
}>;

export type MultichannelJsonFormSchema = Readonly<{
  $schema: 'https://json-schema.org/draft/2020-12/schema';
  $id: string;
  type: 'object';
  additionalProperties: false;
  properties: Readonly<Record<string, MultichannelJsonSchemaProperty>>;
  required: readonly string[];
}>;

/** Shared claim extensions used by every channel until the frozen base catalog can evolve. */
export const MultichannelPermissionClaim = Object.freeze({
  ActorReference: 'Consent.actor-reference',
  DurationDays: 'Consent.permission-duration',
  /** Recipient business sector, kept distinct from the protected data sector. */
  RecipientSector: 'Consent.recipient-sector',
} as const);

/** Canonical Consent lifecycle values for channel orchestrators on older shared-package baselines. */
export const MultichannelConsentStatus = ConsentStatuses;

/** Resource names used by the shared permission/contact persistence flow. */
export const MultichannelPermissionResource = Object.freeze({
  Consent: 'Consent',
  Communication: 'Communication',
  RelatedPerson: 'RelatedPerson',
} as const);

/**
 * Channel-neutral form for a subject-scoped address-book entry.
 *
 * A RelatedEntity is a selectable contact, never an access grant. Portal,
 * voice, WhatsApp and chat may render different controls but must collect the
 * same required values before persistence.
 */
export const MULTICHANNEL_RELATED_ENTITY_SCHEMA: MultichannelJsonFormSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:cds:schema:multichannel:related-entity:v1',
  type: 'object',
  additionalProperties: false,
  properties: Object.freeze({
    subjectRef: Object.freeze({ type: 'string', title: 'Subject reference' }),
    name: Object.freeze({ type: 'string', title: 'Contact name' }),
    entityType: Object.freeze({
      type: 'string', title: 'Entity type',
      enum: Object.freeze(['person', 'organization', 'department', 'location', 'country-set']),
    }),
    actorIdentifiers: Object.freeze({
      type: 'array', title: 'Public actor identifiers', items: Object.freeze({ type: 'string' }),
    }),
    relationship: Object.freeze({ type: 'string', title: 'Relationship' }),
  }),
  required: Object.freeze(['subjectRef', 'name', 'entityType', 'actorIdentifiers']),
});

/** Channel-neutral form for one Consent selected from a persisted contact. */
export const MULTICHANNEL_PERMISSION_GRANT_SCHEMA: MultichannelJsonFormSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:cds:schema:multichannel:permission-grant:v1',
  type: 'object',
  additionalProperties: false,
  properties: Object.freeze({
    subjectRef: Object.freeze({ type: 'string', title: 'Subject reference' }),
    contactReference: Object.freeze({ type: 'string', title: 'Persisted contact reference' }),
    actorIdentifiers: Object.freeze({
      type: 'array', title: 'Public actor identifiers', items: Object.freeze({ type: 'string' }),
    }),
    decision: Object.freeze({ type: 'string', title: 'Decision', enum: Object.freeze(['permit', 'deny']) }),
    purposes: Object.freeze({ type: 'array', title: 'Purposes', items: Object.freeze({ type: 'string' }) }),
    roles: Object.freeze({ type: 'array', title: 'Roles', items: Object.freeze({ type: 'string' }) }),
    targets: Object.freeze({ type: 'array', title: 'Data targets', items: Object.freeze({ type: 'object' }) }),
    durationDays: Object.freeze({ type: 'integer', title: 'Duration in days', minimum: 1 }),
  }),
  required: Object.freeze([
    'subjectRef', 'contactReference', 'actorIdentifiers', 'decision', 'purposes', 'roles', 'targets',
  ]),
});

/**
 * Channel-neutral draft for the complete authorization review ceremony.
 *
 * Every adapter captures audience, roles and data scopes independently. The
 * final reviewed draft can then be expanded into one or more RelatedEntity and
 * Consent records by the authenticated application use case. A telephone UI
 * may accept only country names and public telephone numbers while web/chat
 * adapters may additionally resolve verified email or organization searches.
 */
export const MULTICHANNEL_PERMISSION_SET_SCHEMA: MultichannelJsonFormSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:cds:schema:multichannel:permission-set:v1',
  type: 'object',
  additionalProperties: false,
  properties: Object.freeze({
    subjectRef: Object.freeze({ type: 'string', title: 'Subject reference' }),
    audiences: Object.freeze({ type: 'array', title: 'Authorized audiences', items: Object.freeze({ type: 'object' }) }),
    roles: Object.freeze({ type: 'array', title: 'Authorized roles', items: Object.freeze({ type: 'string' }) }),
    dataScopes: Object.freeze({ type: 'array', title: 'Authorized data scopes', items: Object.freeze({ type: 'string' }) }),
    decision: Object.freeze({ type: 'string', title: 'Decision', enum: Object.freeze(['permit', 'deny']) }),
    sector: Object.freeze({ type: 'string', title: 'Data-space sector' }),
    recipientSector: Object.freeze({
      type: 'string',
      title: 'Recipient organization sector',
      enum: Object.freeze(Object.values(MultichannelPermissionRecipientSectors)),
    }),
    clinicalScopeMode: Object.freeze({
      type: 'string',
      title: 'Human clinical section mode',
      enum: Object.freeze(Object.values(MultichannelPermissionClinicalScopeModes)),
    }),
    ipsSectionCodes: Object.freeze({ type: 'array', title: 'Selected IPS sections', items: Object.freeze({ type: 'string' }) }),
  }),
  required: Object.freeze(['subjectRef', 'audiences', 'roles', 'dataScopes', 'decision', 'sector', 'recipientSector']),
});

export type MultichannelRelatedEntityInput = Readonly<{
  identifier: string;
  resourceId?: string;
  subjectRef: string;
  name: string;
  entityType: 'person' | 'organization' | 'department' | 'location' | 'country-set';
  actorIdentifiers: readonly string[];
  relationship?: string;
}>;

export type MultichannelPermissionConsentInput = Readonly<{
  consentIdentifier: string;
  resourceId?: string;
  subjectRef: string;
  contactReference: string;
  decision: PermissionGrantDecision;
  durationDays?: number;
  date?: string;
  status?: ConsentStatus;
  extraClaims?: Readonly<Record<string, unknown>>;
}>;

export type MultichannelPermissionConsent = Readonly<{
  consentIdentifier: string;
  subjectRef: string;
  contactReference?: string;
  decision: PermissionGrantDecision;
  claims: Readonly<Record<string, unknown>>;
}>;

/**
 * Builds the native FHIR Communication used by every BFF to read the exact
 * subject's Consent projections. Authentication, route selection and polling
 * stay with the caller; query semantics and the attachment shape stay shared.
 */
export function buildSubjectPermissionConsentSearchBundle(subjectRef: string): Record<string, unknown> {
  const subject = requiredText(subjectRef, 'permission_consent_search_subject_required');
  const encodedSearchParameters = Buffer.from(JSON.stringify({
    resourceType: 'Parameters',
    parameter: [{ name: 'subject', valueString: subject }],
  }), 'utf8').toString('base64');
  return {
    resourceType: 'Bundle',
    type: 'batch',
    entry: [{
      request: { method: 'POST', url: `individual/${DataFormat.FHIR_R4}/Communication` },
      resource: {
        resourceType: 'Communication',
        status: 'completed',
        subject: { reference: subject },
        payload: [{
          contentReference: { reference: `individual/${DataFormat.FHIR_API}/Subject/_search` },
          contentAttachment: {
            contentType: HttpMediaTypes.FhirJson,
            title: 'subject-consent-search-parameters.json',
            data: encodedSearchParameters,
          },
        }],
      },
    }],
  };
}

/**
 * Builds one RelatedPerson batch through the shared typed `BundleEditor`.
 * This pure function never chooses a GW route, wraps DIDComm or submits data.
 */
export function buildRelatedEntityBundle(input: MultichannelRelatedEntityInput): BundleJsonApi<BundleEntry> {
  assertRequiredFormValues(MULTICHANNEL_RELATED_ENTITY_SCHEMA, input);
  const identifier = requiredText(input.identifier, 'related_entity_identifier_required');
  const resourceId = String(input.resourceId || identifier.replace(/^urn:uuid:/, '')).trim();
  const editor = new BundleEditor()
    .setBundleOperation(BundleOperations.create)
    .setBundleType(BundleTypes.batch)
    .setAllowedResourceType(BundleEditableResourceTypes.relatedPerson);
  const contact = editor.newEntryAs(BundleEditableResourceTypes.relatedPerson, resourceId)
    .setIdentifier(identifier)
    .setResourceId(resourceId)
    .setSubject(input.subjectRef)
    .setName(input.name)
    .setRelatedEntityType(input.entityType)
    .setActorIdentifierList(input.actorIdentifiers)
    .setActive(true);
  if (input.relationship) contact.setRelationship(input.relationship);
  contact.create();
  return editor.buildJsonApi();
}

/**
 * Builds one active Consent batch through the shared permission importer and
 * typed `ConsentEntryEditor`. The transport adapter remains responsible only
 * for route selection, DIDComm wrapping, authorization, submission and poll.
 */
export function buildPermissionConsentBundle(input: MultichannelPermissionConsentInput): BundleJsonApi<BundleEntry> {
  assertRequiredFormValues(MULTICHANNEL_PERMISSION_GRANT_SCHEMA, {
    subjectRef: input.subjectRef,
    contactReference: input.contactReference,
    actorIdentifiers: input.decision.actorIdentifiers,
    decision: input.decision.decision,
    purposes: input.decision.purposes,
    roles: input.decision.roles,
    targets: input.decision.targets,
  });
  const consentIdentifier = requiredText(input.consentIdentifier, 'permission_consent_identifier_required');
  const resourceId = String(input.resourceId || consentIdentifier.replace(/^urn:uuid:/, '')).trim();
  const consentDate = String(input.date || new Date().toISOString());
  const exportedClaims = exportConsentClaims(input.decision, {
    identifier: consentIdentifier,
    subject: input.subjectRef,
  });
  const requiredClaims = buildConsentClaimsSimple({
    actor: [...input.decision.actorIdentifiers],
    actorRole: input.decision.roles.join(','),
    purpose: input.decision.purposes.join(','),
    actions: String(exportedClaims[ClaimConsent.action] || '').split(',').filter(Boolean),
    consentIdentifier,
    consentDate,
    subjectDid: input.subjectRef,
    decision: input.decision.decision,
  }).consentClaims;
  const editor = new BundleEditor()
    .setBundleOperation(BundleOperations.create)
    .setBundleType(BundleTypes.batch)
    .setAllowedResourceType(BundleEditableResourceTypes.consent);
  const consent = editor.newEntryAs(BundleEditableResourceTypes.consent, resourceId)
    .setIdentifier(consentIdentifier)
    .setResourceId(resourceId)
    .setSubject(input.subjectRef)
    .setStatus(input.status || ConsentStatuses.Active)
    .setDecision(input.decision.decision)
    .setActorIdentifierList(input.decision.actorIdentifiers)
    .setActorRoleList(input.decision.roles)
    .setPurposeList(input.decision.purposes)
    .setSectionList(input.decision.targets.filter(({ kind }) => kind === 'section').map(({ code }) => code))
    .setResourceTypeList(input.decision.targets.filter(({ kind }) => kind === 'resource-type').map(({ code }) => code))
    .setDate(consentDate)
    .setClaim(MultichannelPermissionClaim.ActorReference, input.contactReference);
  for (const [claim, value] of Object.entries({
    ...requiredClaims,
    ...exportedClaims,
    [ClaimConsent.status]: input.status || ConsentStatuses.Active,
  })) consent.setClaim(claim, value);
  if (input.durationDays !== undefined) consent.setClaim(MultichannelPermissionClaim.DurationDays, input.durationDays);
  for (const [claim, value] of Object.entries(input.extraClaims || {})) consent.setClaim(claim, value);
  consent.create();
  return editor.buildJsonApi();
}

/**
 * Reads persisted Consent resources through `BundleReader` and the canonical
 * permission importer. It accepts both a normal Bundle and the GW search
 * projection envelope used by portal and server-side channels.
 */
export function readPermissionConsentBundle(payload: unknown): MultichannelPermissionConsent[] {
  const bundle = normalizeConsentReadBundle(payload);
  const reader = new BundleReader(bundle as unknown as Record<string, unknown>);
  return reader.getEntries().flatMap((rawEntry, entryIndex) => {
    const entry = rawEntry as BundleEntry;
    if (entry.resource?.resourceType !== 'Consent') return [];
    const claims = reader.getEntryClaimsByArrayIndex(entryIndex);
    const consentIdentifier = String(claims[ClaimConsent.identifier] || entry.resource?.id || entry.fullUrl || '').trim();
    const subjectRef = String(claims[ClaimConsent.subject] || '').trim();
    if (!consentIdentifier || !subjectRef) return [];
    return [{
      consentIdentifier,
      subjectRef,
      contactReference: optionalText(claims[MultichannelPermissionClaim.ActorReference]),
      decision: importConsentEntry(entry),
      claims,
    }];
  });
}

/** Returns missing JSON Schema required fields without binding to any UI framework. */
export function listMissingRequiredFormFields(
  schema: MultichannelJsonFormSchema,
  values: Readonly<Record<string, unknown>>,
): string[] {
  return schema.required.filter((field) => isMissing(values[field]));
}

/** Fails closed when any channel submits an incomplete form draft. */
export function assertRequiredFormValues(
  schema: MultichannelJsonFormSchema,
  values: Readonly<Record<string, unknown>>,
): void {
  const missing = listMissingRequiredFormFields(schema, values);
  if (missing.length > 0) throw new TypeError(`multichannel_form_required:${missing.join(',')}`);
}

/**
 * Normalizes and validates the authorization summary before any channel asks
 * the controller to confirm it. This validates policy only; it never resolves
 * an organization, creates a contact or grants access.
 */
export function validateMultichannelPermissionSet(
  input: MultichannelPermissionSetInput,
  policy: MultichannelPermissionPolicy = {},
): MultichannelPermissionSetInput {
  assertRequiredFormValues(MULTICHANNEL_PERMISSION_SET_SCHEMA, input as unknown as Record<string, unknown>);
  const subjectRef = requiredText(input.subjectRef, 'permission_subject_required');
  const audiences = uniqueBy(
    input.audiences.map(normalizePermissionAudience),
    ({ kind, value }) => `${kind}:${value}`,
  );
  if (audiences.length === 0) throw new TypeError('permission_audience_required');

  const roles = uniqueText(input.roles);
  if (roles.length === 0) throw new TypeError('permission_roles_required');
  const selectedDataScopes = uniqueText(input.dataScopes) as MultichannelPermissionDataScope[];
  if (selectedDataScopes.length === 0) throw new TypeError('permission_data_scopes_required');
  if (selectedDataScopes.some((scope) => !Object.values(MultichannelPermissionDataScopes).includes(scope))) {
    throw new TypeError('permission_data_scope_invalid');
  }
  const needsSubjectDemographics = selectedDataScopes.some((scope) => (
    scope === MultichannelPermissionDataScopes.ClinicalSections
    || scope === MultichannelPermissionDataScopes.EmergencyContacts
  ));
  const dataScopes = needsSubjectDemographics
    ? [
        MultichannelPermissionDataScopes.SubjectDemographics,
        ...selectedDataScopes.filter((scope) => scope !== MultichannelPermissionDataScopes.SubjectDemographics),
      ]
    : selectedDataScopes;

  const sector = requiredText(input.sector, 'permission_sector_required');
  const recipientSector = requiredText(
    input.recipientSector,
    'permission_recipient_sector_required',
  ) as MultichannelPermissionRecipientSector;
  if (!Object.values(MultichannelPermissionRecipientSectors).includes(recipientSector)) {
    throw new TypeError('permission_recipient_sector_invalid');
  }
  const countryCodes = audiences
    .filter(({ kind }) => kind === MultichannelPermissionAudienceKinds.Country)
    .map(({ value }) => value);
  assertRecipientSectorCanReadTarget(recipientSector, sector);
  assertRecipientSectorAudienceKinds(recipientSector, countryCodes, policy);
  const administrativeRoles = new Set([
    HealthcareActorRoles.Receptionist,
    HealthcareActorRoles.MedicalSecretary,
  ]);
  const hasAdministrativeRole = roles.some((role) => administrativeRoles.has(role as any));
  if (countryCodes.length > 0 && hasAdministrativeRole) {
    throw new TypeError('permission_country_administrative_role_forbidden');
  }
  if (hasAdministrativeRole && (
    dataScopes.length !== 1 || dataScopes[0] !== MultichannelPermissionDataScopes.Billing
  )) {
    throw new TypeError('permission_administrative_scope_forbidden');
  }

  if (roles.includes(HealthcareActorRoles.Paramedic)) {
    const enabledCountries = new Set((policy.paramedicCountryCodes || []).map(normalizeCountryCode));
    if (countryCodes.length === 0 || countryCodes.some((country) => !enabledCountries.has(country))) {
      throw new TypeError('permission_paramedic_country_not_enabled');
    }
  }
  const roleCountries = countryCodes.length > 0 ? countryCodes : [undefined];
  if (roleCountries.some((countryCode) => {
    const allowedRoles = resolveMultichannelPermissionRoles({
      targetSector: sector,
      recipientSector,
      ...(countryCode ? { countryCode } : {}),
    }, policy);
    return roles.some((role) => !allowedRoles.includes(role));
  })) {
    throw new TypeError('permission_role_recipient_sector_forbidden');
  }

  const includesClinical = dataScopes.includes(MultichannelPermissionDataScopes.ClinicalSections);
  const clinicalScopeMode = input.clinicalScopeMode;
  const ipsSectionCodes = uniqueText(input.ipsSectionCodes || []);
  if (sector === DataspaceSectors.HealthCare && includesClinical) {
    if (!Object.values(MultichannelPermissionClinicalScopeModes).includes(clinicalScopeMode as any)) {
      throw new TypeError('permission_human_clinical_scope_mode_required');
    }
    if (
      clinicalScopeMode === MultichannelPermissionClinicalScopeModes.SelectedIpsSections
      && ipsSectionCodes.length === 0
    ) {
      throw new TypeError('permission_selected_ips_sections_required');
    }
  }

  return Object.freeze({
    subjectRef,
    audiences: Object.freeze(audiences),
    roles: Object.freeze(roles),
    dataScopes: Object.freeze(dataScopes),
    decision: input.decision,
    sector,
    recipientSector,
    ...(clinicalScopeMode ? { clinicalScopeMode } : {}),
    ...(ipsSectionCodes.length > 0 ? { ipsSectionCodes: Object.freeze(ipsSectionCodes) } : {}),
  });
}

/**
 * Resolves the role choices shown by every channel after target sector,
 * recipient sector and (when available) jurisdiction are known. A country
 * policy can only narrow governed roles; it cannot introduce arbitrary role
 * claims. The paramedic occupation is enabled explicitly per jurisdiction and
 * never replaces the separately modelled roles of a mobile emergency team.
 */
export function resolveMultichannelPermissionRoles(
  context: MultichannelPermissionRoleContext,
  policy: MultichannelPermissionPolicy = {},
): readonly string[] {
  const targetSector = requiredText(context.targetSector, 'permission_sector_required');
  const recipientSector = requiredText(
    context.recipientSector,
    'permission_recipient_sector_required',
  ) as MultichannelPermissionRecipientSector;
  assertRecipientSectorCanReadTarget(recipientSector, targetSector);

  const governedRoles = new Set(RECIPIENT_SECTOR_ROLE_CLAIMS[recipientSector] || []);
  if (
    targetSector === DataspaceSectors.AnimalCare
    && (
      recipientSector === MultichannelPermissionRecipientSectors.HealthCare
      || recipientSector === MultichannelPermissionRecipientSectors.HealthLab
    )
  ) {
    for (const role of governedRoles) {
      if (role !== MultichannelPermissionRoleClaims.Researcher) governedRoles.delete(role);
    }
  }
  if (context.audienceKind === MultichannelPermissionAudienceKinds.Country) {
    governedRoles.delete(HealthcareActorRoles.Receptionist);
    governedRoles.delete(HealthcareActorRoles.MedicalSecretary);
  }
  const countryCode = context.countryCode ? normalizeCountryCode(context.countryCode) : undefined;
  if (
    countryCode
    && targetSector === DataspaceSectors.HealthCare
    && (
      recipientSector === MultichannelPermissionRecipientSectors.HealthCare
      || recipientSector === MultichannelPermissionRecipientSectors.PublicSafety
    )
    && new Set((policy.paramedicCountryCodes || []).map(normalizeCountryCode)).has(countryCode)
  ) {
    governedRoles.add(HealthcareActorRoles.Paramedic);
  }

  const configuredRoles = countryCode
    ? policy.recipientRoleClaimsBySectorAndCountry?.[recipientSector]?.[countryCode]
    : undefined;
  if (configuredRoles) {
    const configured = new Set(uniqueText(configuredRoles));
    return Object.freeze([...governedRoles].filter((role) => configured.has(role)));
  }
  return Object.freeze([...governedRoles]);
}

/**
 * Resolves the audience choices rendered after the recipient sector. Clinical
 * care can be authorized by country, exact organization or exact person.
 * Public-safety country grants are jurisdiction policy; passenger transport
 * and insurance always require an exact organization or person.
 */
export function resolveMultichannelPermissionAudienceKinds(
  context: MultichannelPermissionAudienceContext,
  policy: MultichannelPermissionPolicy = {},
): readonly MultichannelPermissionAudienceKind[] {
  const recipientSector = requiredText(
    context.recipientSector,
    'permission_recipient_sector_required',
  ) as MultichannelPermissionRecipientSector;
  if (!Object.values(MultichannelPermissionRecipientSectors).includes(recipientSector)) {
    throw new TypeError('permission_recipient_sector_invalid');
  }
  const exactAudiences = [
    MultichannelPermissionAudienceKinds.Organization,
    MultichannelPermissionAudienceKinds.PersonPhone,
  ] as const;
  if (
    recipientSector === MultichannelPermissionRecipientSectors.AnimalCare
    || recipientSector === MultichannelPermissionRecipientSectors.HealthCare
  ) {
    return Object.freeze([MultichannelPermissionAudienceKinds.Country, ...exactAudiences]);
  }
  if (recipientSector === MultichannelPermissionRecipientSectors.PublicSafety && context.countryCode) {
    const countryCode = normalizeCountryCode(context.countryCode);
    const enabled = policy.countryAudienceRecipientSectorsByCountry?.[countryCode] || [];
    if (enabled.includes(recipientSector)) {
      return Object.freeze([MultichannelPermissionAudienceKinds.Country, ...exactAudiences]);
    }
  }
  return Object.freeze([...exactAudiences]);
}

const ANIMAL_CARE_PERMISSION_ROLES = Object.freeze([
  HealthcareActorRoles.Veterinarian,
  HealthcareActorRoles.VeterinaryTechnicianOrAssistant,
  HealthcareActorRoles.Receptionist,
  MultichannelPermissionRoleClaims.Researcher,
]);

const HEALTH_CARE_PERMISSION_ROLES = Object.freeze([
  HealthcareActorRoles.MedicalDoctors,
  HealthcareActorRoles.GeneralistMedicalPractitioner,
  HealthcareActorRoles.SpecialistMedicalPractitioner,
  HealthcareActorRoles.NursingProfessional,
  HealthcareActorRoles.MidwiferyProfessional,
  HealthcareActorRoles.Receptionist,
  HealthcareActorRoles.MedicalSecretary,
  MultichannelPermissionRoleClaims.Researcher,
]);

const PUBLIC_SAFETY_PERMISSION_ROLES = Object.freeze([
  EmergencyProfessionalRoles.police_officer.claim,
  EmergencyProfessionalRoles.firefighter.claim,
  EmergencyProfessionalRoles.security_guard.claim,
  EmergencyProfessionalRoles.lifeguard.claim,
  EmergencyProfessionalRoles.ambulance_worker.claim,
]);

const RESEARCH_LAB_PERMISSION_ROLES = Object.freeze([
  MultichannelPermissionRoleClaims.Researcher,
]);

const PUBLIC_HEALTH_PERMISSION_ROLES = Object.freeze([
  EmergencyProfessionalRoles.police_officer.claim,
  EmergencyProfessionalRoles.firefighter.claim,
  EmergencyProfessionalRoles.lifeguard.claim,
  EmergencyProfessionalRoles.paramedic.claim,
  EmergencyProfessionalRoles.ambulance_worker.claim,
  MultichannelPermissionRoleClaims.Researcher,
]);

const PASSENGER_TRANSPORT_PERMISSION_ROLES = Object.freeze([
  EmergencyProfessionalRoles.flight_attendant.claim,
  EmergencyProfessionalRoles.airline_ground_clerk.claim,
  EmergencyProfessionalRoles.train_attendant.claim,
  EmergencyProfessionalRoles.transport_conductor.claim,
]);

const INSURANCE_PERMISSION_ROLES = Object.freeze([
  EmergencyProfessionalRoles.insurance_clerk.claim,
]);

const RECIPIENT_SECTOR_ROLE_CLAIMS: Readonly<Record<MultichannelPermissionRecipientSector, readonly string[]>> = Object.freeze({
  [MultichannelPermissionRecipientSectors.AnimalCare]: ANIMAL_CARE_PERMISSION_ROLES,
  [MultichannelPermissionRecipientSectors.AnimalLab]: RESEARCH_LAB_PERMISSION_ROLES,
  [MultichannelPermissionRecipientSectors.HealthCare]: HEALTH_CARE_PERMISSION_ROLES,
  [MultichannelPermissionRecipientSectors.HealthLab]: RESEARCH_LAB_PERMISSION_ROLES,
  [MultichannelPermissionRecipientSectors.PublicHealth]: PUBLIC_HEALTH_PERMISSION_ROLES,
  [MultichannelPermissionRecipientSectors.PublicSafety]: PUBLIC_SAFETY_PERMISSION_ROLES,
  [MultichannelPermissionRecipientSectors.PassengerTransport]: PASSENGER_TRANSPORT_PERMISSION_ROLES,
  [MultichannelPermissionRecipientSectors.AnimalInsurance]: INSURANCE_PERMISSION_ROLES,
  [MultichannelPermissionRecipientSectors.HealthInsurance]: INSURANCE_PERMISSION_ROLES,
});

function assertRecipientSectorCanReadTarget(
  recipientSector: MultichannelPermissionRecipientSector,
  targetSector: string,
): void {
  const allowed = recipientSector === MultichannelPermissionRecipientSectors.AnimalCare
    || recipientSector === MultichannelPermissionRecipientSectors.AnimalLab
    || recipientSector === MultichannelPermissionRecipientSectors.AnimalInsurance
    ? targetSector === DataspaceSectors.AnimalCare
    : recipientSector === MultichannelPermissionRecipientSectors.HealthCare
      || recipientSector === MultichannelPermissionRecipientSectors.HealthLab
      ? targetSector === DataspaceSectors.HealthCare || targetSector === DataspaceSectors.AnimalCare
      : recipientSector === MultichannelPermissionRecipientSectors.HealthInsurance
      ? targetSector === DataspaceSectors.HealthCare
      : (
        recipientSector === MultichannelPermissionRecipientSectors.PublicHealth
        || recipientSector === MultichannelPermissionRecipientSectors.PublicSafety
        || recipientSector === MultichannelPermissionRecipientSectors.PassengerTransport
      ) && (targetSector === DataspaceSectors.AnimalCare || targetSector === DataspaceSectors.HealthCare);
  if (!allowed) throw new TypeError('permission_recipient_sector_target_forbidden');
}

function assertRecipientSectorAudienceKinds(
  recipientSector: MultichannelPermissionRecipientSector,
  countryCodes: readonly string[],
  policy: MultichannelPermissionPolicy,
): void {
  if (countryCodes.length === 0) return;
  if (
    recipientSector === MultichannelPermissionRecipientSectors.PassengerTransport
    || recipientSector === MultichannelPermissionRecipientSectors.AnimalInsurance
    || recipientSector === MultichannelPermissionRecipientSectors.HealthInsurance
  ) {
    throw new TypeError('permission_recipient_sector_country_audience_forbidden');
  }
  if (
    recipientSector === MultichannelPermissionRecipientSectors.PublicHealth
    || recipientSector === MultichannelPermissionRecipientSectors.PublicSafety
  ) {
    for (const countryCode of countryCodes) {
      const enabled = policy.countryAudienceRecipientSectorsByCountry?.[countryCode] || [];
      if (!enabled.includes(recipientSector)) {
        throw new TypeError('permission_recipient_sector_country_audience_forbidden');
      }
    }
  }
}

function normalizePermissionAudience(audience: MultichannelPermissionAudience): MultichannelPermissionAudience {
  const kind = String(audience?.kind || '').trim() as MultichannelPermissionAudienceKind;
  if (!Object.values(MultichannelPermissionAudienceKinds).includes(kind)) {
    throw new TypeError('permission_audience_kind_invalid');
  }
  const value = kind === MultichannelPermissionAudienceKinds.Country
    ? normalizeCountryCode(audience.value)
    : String(audience.value || '').replace(/[\s().-]/g, '');
  if (kind !== MultichannelPermissionAudienceKinds.Country && !/^\+[1-9]\d{7,14}$/.test(value)) {
    throw new TypeError('permission_audience_phone_invalid');
  }
  return Object.freeze({ kind, value });
}

function normalizeCountryCode(value: unknown): string {
  const countryCode = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new TypeError('permission_country_invalid');
  return countryCode;
}

function uniqueText(values: readonly unknown[]): string[] {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function uniqueBy<T>(values: readonly T[], key: (value: T) => string): T[] {
  const entries = new Map<string, T>();
  for (const value of values) entries.set(key(value), value);
  return [...entries.values()];
}

function normalizeConsentReadBundle(payload: unknown): BundleJsonApi<BundleEntry> {
  const root = payload as any;
  const responseData = root?.body?.data || root?.data || [];
  const searchEntry = Array.isArray(responseData)
    ? responseData.find((entry: any) => (
      ['Consent-search-response-v1.0', 'Subject-search-response-v1.0'].includes(String(entry?.type || ''))
      && Array.isArray(entry?.resource?.data)
    ))
    : undefined;
  if (searchEntry) {
    return {
      resourceType: 'Bundle',
      type: 'searchset',
      data: searchEntry.resource.data.map(projectionToConsentEntry),
    };
  }
  if (root?.resourceType === 'Bundle' && (Array.isArray(root.data) || Array.isArray(root.entry))) {
    return {
      resourceType: 'Bundle',
      type: String(root.type || 'searchset') as BundleJsonApi<BundleEntry>['type'],
      data: (root.data || root.entry) as BundleEntry[],
    };
  }
  const records = responseData?.[0]?.resource?.data;
  if (!Array.isArray(records)) throw new TypeError('permission_consent_search_result_invalid');
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    data: records.map(projectionToConsentEntry),
  };
}

function projectionToConsentEntry(record: Record<string, unknown>): BundleEntry {
  const claims = record.meta && typeof record.meta === 'object' && !Array.isArray(record.meta)
    ? { ...((record.meta as any).claims || {}) }
    : Object.fromEntries(Object.entries(record)
      .filter(([key]) => !['id', 'indexed', 'meta'].includes(key))
      .map(([key, value]) => [key.replace(/^org\.hl7\.fhir\.api\./, ''), value]));
  const identifier = String(claims[ClaimConsent.identifier] || record.id || '').trim();
  return {
    id: String(record.id || identifier),
    type: 'Consent',
    fullUrl: identifier,
    resource: { resourceType: 'Consent', meta: { claims } },
  } as BundleEntry;
}

function isMissing(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function requiredText(value: unknown, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new TypeError(code);
  return normalized;
}

function optionalText(value: unknown): string | undefined {
  const normalized = String(value || '').trim();
  return normalized || undefined;
}
