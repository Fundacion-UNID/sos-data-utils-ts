// Flow contract: every portal, voice, chat and messaging channel uses the same typed permission forms and bundle editors/readers.
import test from 'node:test';
import assert from 'node:assert/strict';

import { ConsentDecisions } from 'gdc-common-utils-ts/models/consent-rule';
import { HealthcareActorRoles, HealthcareConsentPurposes } from 'gdc-common-utils-ts/constants/healthcare';
import { DataspaceSectors } from 'gdc-common-utils-ts/constants/sectors';
import { importPermissionTemplate, resolvePermissionTemplate } from 'gdc-common-utils-ts/utils/permission-templates';
import { BundleReader } from 'gdc-common-utils-ts/utils/bundle-reader';
import { Format as DataFormat } from 'gdc-common-utils-ts/constants/Schemas';
import { HttpMediaTypes } from 'gdc-common-utils-ts/constants/http';
import {
  MULTICHANNEL_PERMISSION_SET_SCHEMA,
  MULTICHANNEL_PERMISSION_GRANT_SCHEMA,
  MULTICHANNEL_RELATED_ENTITY_SCHEMA,
  MultichannelPermissionAudienceKinds,
  MultichannelPermissionClinicalScopeModes,
  MultichannelPermissionClaim,
  MultichannelPermissionDataScopes,
  MultichannelPermissionRecipientSectors,
  MultichannelPermissionRoleClaims,
  buildPermissionConsentBundle,
  buildRelatedEntityBundle,
  buildSubjectPermissionConsentSearchBundle,
  readPermissionConsentBundle,
  resolveMultichannelPermissionAudienceKinds,
  resolveMultichannelPermissionRoles,
  validateMultichannelPermissionSet,
} from '../dist/multichannel-permission-forms.js';
import {
  EmergencyProfessionalRoleIds,
  EmergencyProfessionalRoles,
} from '../dist/emergency-professional-roles.js';
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js';

const SUBJECT_REF = REPOSITORY_SAFE_EXAMPLES.didWeb;
const CONTACT_ID = `urn:uuid:${REPOSITORY_SAFE_EXAMPLES.tenantId}-contact`;
const CONTACT_REFERENCE = `RelatedPerson/${REPOSITORY_SAFE_EXAMPLES.tenantId}-contact`;
const CONSENT_ID = `urn:uuid:${REPOSITORY_SAFE_EXAMPLES.tenantId}-consent`;
const COUNTRY_ACTOR = 'CA';

test('channel-neutral schemas own required and optional fields', () => {
  assert.deepEqual(MULTICHANNEL_RELATED_ENTITY_SCHEMA.required, [
    'subjectRef', 'name', 'entityType', 'actorIdentifiers',
  ]);
  assert.deepEqual(MULTICHANNEL_PERMISSION_GRANT_SCHEMA.required, [
    'subjectRef', 'contactReference', 'actorIdentifiers', 'decision', 'purposes', 'roles', 'targets',
  ]);
  assert.equal(MULTICHANNEL_PERMISSION_GRANT_SCHEMA.properties.durationDays.type, 'integer');
  assert.deepEqual(MULTICHANNEL_PERMISSION_SET_SCHEMA.required, [
    'subjectRef', 'audiences', 'roles', 'dataScopes', 'decision', 'sector', 'recipientSector',
  ]);
});

test('channels persist recipient sector under one shared Consent claim', () => {
  assert.equal(MultichannelPermissionClaim.RecipientSector, 'Consent.recipient-sector');
});

test('recipient sector determines compatible audiences before roles are selected', () => {
  const flightAttendantRole = EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.FlightAttendant].claim;
  const organizationGrant = validateMultichannelPermissionSet({
    subjectRef: SUBJECT_REF,
    audiences: [{
      kind: MultichannelPermissionAudienceKinds.Organization,
      value: REPOSITORY_SAFE_EXAMPLES.phoneE164,
    }],
    roles: [flightAttendantRole],
    dataScopes: [MultichannelPermissionDataScopes.ClinicalSections],
    decision: ConsentDecisions.Permit,
    sector: DataspaceSectors.AnimalCare,
    recipientSector: MultichannelPermissionRecipientSectors.PassengerTransport,
  });
  assert.equal(organizationGrant.recipientSector, MultichannelPermissionRecipientSectors.PassengerTransport);

  assert.throws(() => validateMultichannelPermissionSet({
    ...organizationGrant,
    audiences: [{
      kind: MultichannelPermissionAudienceKinds.Country,
      value: REPOSITORY_SAFE_EXAMPLES.countryIso2,
    }],
  }), /permission_recipient_sector_country_audience_forbidden/);
  assert.throws(() => validateMultichannelPermissionSet({
    ...organizationGrant,
    roles: [HealthcareActorRoles.Veterinarian],
  }), /permission_role_recipient_sector_forbidden/);
});

test('recipient-sector audience choices are shared by every channel', () => {
  assert.deepEqual(resolveMultichannelPermissionAudienceKinds({
    recipientSector: MultichannelPermissionRecipientSectors.PassengerTransport,
  }), [
    MultichannelPermissionAudienceKinds.Organization,
    MultichannelPermissionAudienceKinds.PersonPhone,
  ]);
  assert.deepEqual(resolveMultichannelPermissionAudienceKinds({
    recipientSector: MultichannelPermissionRecipientSectors.AnimalCare,
  }), [
    MultichannelPermissionAudienceKinds.Country,
    MultichannelPermissionAudienceKinds.Organization,
    MultichannelPermissionAudienceKinds.PersonPhone,
  ]);
  assert.deepEqual(resolveMultichannelPermissionAudienceKinds({
    recipientSector: MultichannelPermissionRecipientSectors.PublicSafety,
    countryCode: REPOSITORY_SAFE_EXAMPLES.countryIso2,
  }), [
    MultichannelPermissionAudienceKinds.Organization,
    MultichannelPermissionAudienceKinds.PersonPhone,
  ]);
  assert.deepEqual(resolveMultichannelPermissionAudienceKinds({
    recipientSector: MultichannelPermissionRecipientSectors.PublicSafety,
    countryCode: REPOSITORY_SAFE_EXAMPLES.countryIso2,
  }, {
    countryAudienceRecipientSectorsByCountry: {
      [REPOSITORY_SAFE_EXAMPLES.countryIso2]: [MultichannelPermissionRecipientSectors.PublicSafety],
    },
  }), [
    MultichannelPermissionAudienceKinds.Country,
    MultichannelPermissionAudienceKinds.Organization,
    MultichannelPermissionAudienceKinds.PersonPhone,
  ]);
});

test('country audiences omit administrative roles before any channel renders them', () => {
  assert.equal(resolveMultichannelPermissionRoles({
    targetSector: DataspaceSectors.AnimalCare,
    recipientSector: MultichannelPermissionRecipientSectors.AnimalCare,
    audienceKind: MultichannelPermissionAudienceKinds.Country,
    countryCode: REPOSITORY_SAFE_EXAMPLES.countryIso2,
  }).includes(HealthcareActorRoles.Receptionist), false);
  assert.equal(resolveMultichannelPermissionRoles({
    targetSector: DataspaceSectors.AnimalCare,
    recipientSector: MultichannelPermissionRecipientSectors.AnimalCare,
    audienceKind: MultichannelPermissionAudienceKinds.Organization,
  }).includes(HealthcareActorRoles.Receptionist), true);
});

test('country policy customizes sector roles without leaking them into other sectors', () => {
  const paramedicRole = EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.Paramedic].claim;
  const policeRole = EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.PoliceOfficer].claim;
  const policy = {
    paramedicCountryCodes: [REPOSITORY_SAFE_EXAMPLES.countryIso2],
    countryAudienceRecipientSectorsByCountry: {
      [REPOSITORY_SAFE_EXAMPLES.countryIso2]: [MultichannelPermissionRecipientSectors.PublicSafety],
    },
  };

  assert.equal(resolveMultichannelPermissionRoles({
    targetSector: DataspaceSectors.HealthCare,
    recipientSector: DataspaceSectors.HealthCare,
    countryCode: REPOSITORY_SAFE_EXAMPLES.countryIso2,
  }, policy).includes(paramedicRole), true);
  assert.equal(resolveMultichannelPermissionRoles({
    targetSector: DataspaceSectors.AnimalCare,
    recipientSector: MultichannelPermissionRecipientSectors.PassengerTransport,
    countryCode: REPOSITORY_SAFE_EXAMPLES.countryIso2,
  }, policy).includes(paramedicRole), false);

  const publicSafetyCountryGrant = validateMultichannelPermissionSet({
    subjectRef: SUBJECT_REF,
    audiences: [{
      kind: MultichannelPermissionAudienceKinds.Country,
      value: REPOSITORY_SAFE_EXAMPLES.countryIso2,
    }],
    roles: [policeRole],
    dataScopes: [MultichannelPermissionDataScopes.ClinicalSections],
    decision: ConsentDecisions.Permit,
    sector: DataspaceSectors.AnimalCare,
    recipientSector: MultichannelPermissionRecipientSectors.PublicSafety,
  }, policy);
  assert.equal(publicSafetyCountryGrant.roles[0], policeRole);
});

test('public-health exposes local responders for animal emergency contacts and police for vaccine verification', () => {
  const roles = resolveMultichannelPermissionRoles({
    targetSector: DataspaceSectors.AnimalCare,
    recipientSector: MultichannelPermissionRecipientSectors.PublicHealth,
    audienceKind: MultichannelPermissionAudienceKinds.Organization,
  });
  for (const roleId of [
    EmergencyProfessionalRoleIds.PoliceOfficer,
    EmergencyProfessionalRoleIds.Firefighter,
    EmergencyProfessionalRoleIds.Lifeguard,
    EmergencyProfessionalRoleIds.Paramedic,
  ]) {
    assert.ok(roles.includes(EmergencyProfessionalRoles[roleId].claim));
  }
});

test('passenger transport exposes both cabin crew and airline ground clerks', () => {
  const roles = resolveMultichannelPermissionRoles({
    targetSector: DataspaceSectors.AnimalCare,
    recipientSector: MultichannelPermissionRecipientSectors.PassengerTransport,
    audienceKind: MultichannelPermissionAudienceKinds.Organization,
  });
  assert.ok(roles.includes(EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.FlightAttendant].claim));
  assert.ok(roles.includes(EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.AirlineGroundClerk].claim));
});

test('animal insurance exposes the governed insurance employee role', () => {
  const roles = resolveMultichannelPermissionRoles({
    targetSector: DataspaceSectors.AnimalCare,
    recipientSector: MultichannelPermissionRecipientSectors.AnimalInsurance,
    audienceKind: MultichannelPermissionAudienceKinds.Organization,
  });
  assert.ok(roles.includes(EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.InsuranceClerk].claim));
});

test('researcher is selectable in every requested care, laboratory and public-health recipient sector', () => {
  assert.equal(MultichannelPermissionRoleClaims.Researcher, 'ISCO-08|2131');
  for (const [targetSector, recipientSector] of [
    [DataspaceSectors.AnimalCare, MultichannelPermissionRecipientSectors.AnimalCare],
    [DataspaceSectors.AnimalCare, MultichannelPermissionRecipientSectors.AnimalLab],
    [DataspaceSectors.AnimalCare, MultichannelPermissionRecipientSectors.HealthCare],
    [DataspaceSectors.AnimalCare, MultichannelPermissionRecipientSectors.HealthLab],
    [DataspaceSectors.AnimalCare, MultichannelPermissionRecipientSectors.PublicHealth],
  ]) {
    const roles = resolveMultichannelPermissionRoles({
      targetSector,
      recipientSector,
      audienceKind: MultichannelPermissionAudienceKinds.Organization,
    });
    assert.ok(roles.includes(MultichannelPermissionRoleClaims.Researcher));
  }
});

test('country and organization permission sets preserve role and data-scope policy', () => {
  const countryVeterinaryGrant = validateMultichannelPermissionSet({
    subjectRef: SUBJECT_REF,
    audiences: [{
      kind: MultichannelPermissionAudienceKinds.Country,
      value: REPOSITORY_SAFE_EXAMPLES.countryIso2,
    }],
    roles: [
      HealthcareActorRoles.Veterinarian,
      HealthcareActorRoles.VeterinaryTechnicianOrAssistant,
    ],
    dataScopes: [MultichannelPermissionDataScopes.ClinicalSections],
    decision: ConsentDecisions.Permit,
    sector: DataspaceSectors.AnimalCare,
    recipientSector: DataspaceSectors.AnimalCare,
  });
  assert.deepEqual(countryVeterinaryGrant.audiences, [{
    kind: MultichannelPermissionAudienceKinds.Country,
    value: REPOSITORY_SAFE_EXAMPLES.countryIso2,
  }]);
  assert.deepEqual(countryVeterinaryGrant.dataScopes, [
    MultichannelPermissionDataScopes.SubjectDemographics,
    MultichannelPermissionDataScopes.ClinicalSections,
  ]);

  assert.throws(() => validateMultichannelPermissionSet({
    ...countryVeterinaryGrant,
    roles: [HealthcareActorRoles.Receptionist],
    dataScopes: [MultichannelPermissionDataScopes.Billing],
  }), /permission_country_administrative_role_forbidden/);

  const organizationAdministrativeGrant = validateMultichannelPermissionSet({
    ...countryVeterinaryGrant,
    audiences: [{
      kind: MultichannelPermissionAudienceKinds.Organization,
      value: REPOSITORY_SAFE_EXAMPLES.phoneE164,
    }],
    roles: [HealthcareActorRoles.Receptionist],
    dataScopes: [MultichannelPermissionDataScopes.Billing],
  });
  assert.deepEqual(organizationAdministrativeGrant.dataScopes, [MultichannelPermissionDataScopes.Billing]);
  assert.throws(() => validateMultichannelPermissionSet({
    ...organizationAdministrativeGrant,
    dataScopes: [MultichannelPermissionDataScopes.ClinicalSections],
  }), /permission_administrative_scope_forbidden/);
});

test('clinical and emergency-contact permissions always disclose their minimum subject identity context', () => {
  const baseInput = {
    subjectRef: SUBJECT_REF,
    audiences: [{
      kind: MultichannelPermissionAudienceKinds.Country,
      value: REPOSITORY_SAFE_EXAMPLES.countryIso2,
    }],
    roles: [HealthcareActorRoles.Veterinarian],
    decision: ConsentDecisions.Permit,
    sector: DataspaceSectors.AnimalCare,
    recipientSector: DataspaceSectors.AnimalCare,
  };

  for (const selectedScope of [
    MultichannelPermissionDataScopes.ClinicalSections,
    MultichannelPermissionDataScopes.EmergencyContacts,
  ]) {
    assert.deepEqual(validateMultichannelPermissionSet({
      ...baseInput,
      dataScopes: [selectedScope],
    }).dataScopes, [
      MultichannelPermissionDataScopes.SubjectDemographics,
      selectedScope,
    ]);
  }

  assert.deepEqual(validateMultichannelPermissionSet({
    ...baseInput,
    dataScopes: [MultichannelPermissionDataScopes.Appointments],
  }).dataScopes, [MultichannelPermissionDataScopes.Appointments]);
});

test('human permissions require jurisdiction-enabled paramedics and explicit IPS section selection', () => {
  const paramedicRole = EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.Paramedic].claim;
  const baseInput = {
    subjectRef: SUBJECT_REF,
    audiences: [{
      kind: MultichannelPermissionAudienceKinds.Country,
      value: REPOSITORY_SAFE_EXAMPLES.countryIso2,
    }],
    roles: [paramedicRole],
    dataScopes: [MultichannelPermissionDataScopes.ClinicalSections],
    clinicalScopeMode: MultichannelPermissionClinicalScopeModes.SelectedIpsSections,
    ipsSectionCodes: ['allergies-and-intolerances'],
    decision: ConsentDecisions.Permit,
    sector: DataspaceSectors.HealthCare,
    recipientSector: DataspaceSectors.HealthCare,
  };
  assert.throws(
    () => validateMultichannelPermissionSet(baseInput),
    /permission_paramedic_country_not_enabled/,
  );
  assert.equal(validateMultichannelPermissionSet(baseInput, {
    paramedicCountryCodes: [REPOSITORY_SAFE_EXAMPLES.countryIso2],
  }).roles[0], paramedicRole);
  assert.throws(() => validateMultichannelPermissionSet({
    ...baseInput,
    ipsSectionCodes: [],
  }, {
    paramedicCountryCodes: [REPOSITORY_SAFE_EXAMPLES.countryIso2],
  }), /permission_selected_ips_sections_required/);
});

test('RelatedEntity authoring uses the typed BundleEditor surface', () => {
  const bundle = buildRelatedEntityBundle({
    identifier: CONTACT_ID,
    subjectRef: SUBJECT_REF,
    name: REPOSITORY_SAFE_EXAMPLES.organizationLegalName,
    entityType: 'country-set',
    actorIdentifiers: [COUNTRY_ACTOR],
  });
  const reader = new BundleReader(bundle);
  const claims = reader.getEntryClaimsByArrayIndex(0);

  assert.equal(claims['RelatedPerson.active'], true);
  assert.equal(claims['RelatedPerson.patient'], SUBJECT_REF);
  assert.equal(claims['RelatedPerson.actor-identifier'], COUNTRY_ACTOR);
});

test('Consent authoring and readback round-trip through shared editor/importer types', () => {
  const veterinarianTemplate = resolvePermissionTemplate({
    sector: DataspaceSectors.AnimalCare,
    roleClaim: HealthcareActorRoles.Veterinarian,
  });
  assert.ok(veterinarianTemplate);
  const bundle = buildPermissionConsentBundle({
    consentIdentifier: CONSENT_ID,
    subjectRef: SUBJECT_REF,
    contactReference: CONTACT_REFERENCE,
    decision: importPermissionTemplate(veterinarianTemplate, {
      actorIdentifiers: [COUNTRY_ACTOR],
      decision: ConsentDecisions.Permit,
      purposes: [HealthcareConsentPurposes.EmergencyTreatment],
    }),
  });
  const [persisted] = readPermissionConsentBundle(bundle);

  assert.equal(persisted.consentIdentifier, CONSENT_ID);
  assert.equal(persisted.subjectRef, SUBJECT_REF);
  assert.equal(persisted.contactReference, CONTACT_REFERENCE);
  assert.deepEqual(persisted.decision.actorIdentifiers, [COUNTRY_ACTOR]);
  assert.deepEqual(persisted.decision.roles, [HealthcareActorRoles.Veterinarian]);
});

test('Consent readback unwraps the authoritative Subject search projection before BundleReader', () => {
  const [persisted] = readPermissionConsentBundle({
    resourceType: 'Bundle',
    type: 'batch-response',
    data: [{
      type: 'Subject-search-response-v1.0',
      resource: {
        data: [{
          id: CONSENT_ID,
          '@context': 'org.hl7.fhir.api',
          'org.hl7.fhir.api.Consent.identifier': CONSENT_ID,
          'org.hl7.fhir.api.Consent.subject': SUBJECT_REF,
          'org.hl7.fhir.api.Consent.actor-reference': CONTACT_REFERENCE,
          'org.hl7.fhir.api.Consent.actor-identifier': COUNTRY_ACTOR,
          'org.hl7.fhir.api.Consent.actor-role': HealthcareActorRoles.Veterinarian,
          'org.hl7.fhir.api.Consent.purpose': HealthcareConsentPurposes.EmergencyTreatment,
          'org.hl7.fhir.api.Consent.decision': ConsentDecisions.Permit,
        }],
      },
    }],
  });

  assert.equal(persisted.consentIdentifier, CONSENT_ID);
  assert.equal(persisted.contactReference, CONTACT_REFERENCE);
});

test('Consent search uses one shared native FHIR Communication request', () => {
  const bundle = buildSubjectPermissionConsentSearchBundle(SUBJECT_REF);
  const communication = bundle.entry[0];
  const attachment = communication.resource.payload[0].contentAttachment;
  const parameters = JSON.parse(Buffer.from(attachment.data, 'base64').toString('utf8'));

  assert.equal(communication.request.url, `individual/${DataFormat.FHIR_R4}/Communication`);
  assert.equal(attachment.contentType, HttpMediaTypes.FhirJson);
  assert.equal(parameters.parameter[0].valueString, SUBJECT_REF);
});
