// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  OrganizationServiceCatalogSector,
  buildOrganizationEquipmentCatalogEntry,
  buildOrganizationServiceCatalogEntry,
  buildProfessionalServiceCommunicationRoute,
  normalizeClinicalDocumentIdentity,
  normalizeProfessionalServiceGroupAssignment,
} from '../dist/organization-service-catalog.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

const LEGAL_ORGANIZATION = 'Organization/legal-provider'
const DEPARTMENT = 'Organization/blood-bank-department'
const BLOOD_DONATION_SERVICE = 'HealthcareService/blood-donation'
const PLASMA_DONATION_SERVICE = 'HealthcareService/plasma-donation'
const HEALTHCARE_SERVICE = BLOOD_DONATION_SERVICE
const PROFESSIONAL_GROUP = 'Group/emergency-team'
const PRACTITIONER_ROLE = 'PractitionerRole/veterinarian-on-duty'
const CONTROLLER = 'RelatedPerson/animal-controller'

test('builds one department with independently schedulable services and locations', () => {
  const entry = buildOrganizationServiceCatalogEntry({
    id: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    catalogVersion: 1,
    jurisdiction: 'CA-BC',
    sector: OrganizationServiceCatalogSector.AnimalCare,
    legalOrganizationReference: LEGAL_ORGANIZATION,
    department: {
      identifier: 'blood-bank-department',
      name: 'Blood bank department',
      fhirOrganizationReference: DEPARTMENT,
      loincSpecialty: {
        system: 'http://loinc.org',
        code: 'LP70684-8',
        display: 'Blood banking',
      },
      locations: [{
        identifier: 'blood-donation-point',
        name: 'Blood donation point',
        fhirLocationReference: 'Location/blood-donation-point',
        geo: { latitude: 49.2827, longitude: -123.1207 },
        images: [{
          objectReference: 'Object/public-place-image',
          contentType: 'image/jpeg',
          sha256: 'a'.repeat(64),
          purpose: 'place',
          visibility: 'marketplace',
        }],
      }, {
        identifier: 'blood-donation-room',
        name: 'Blood donation room',
        fhirLocationReference: 'Location/blood-donation-room',
        containedInPlaceReference: 'Location/blood-donation-point',
        geo: { latitude: 49.2827, longitude: -123.1207 },
        images: [{
          objectReference: 'Object/public-place-image',
          contentType: 'image/jpeg',
          sha256: 'a'.repeat(64),
          purpose: 'place',
          visibility: 'marketplace',
        }],
      }, {
        identifier: 'plasma-donation-room',
        name: 'Plasma donation room',
        fhirLocationReference: 'Location/plasma-donation-room',
        containedInPlaceReference: 'Location/blood-donation-point',
        geo: { latitude: 49.2827, longitude: -123.1207 },
        images: [{
          objectReference: 'Object/public-place-image',
          contentType: 'image/jpeg',
          sha256: 'a'.repeat(64),
          purpose: 'place',
          visibility: 'marketplace',
        }],
      }],
      media: [{
        objectReference: 'Object/public-logo',
        contentType: 'image/png',
        sha256: 'b'.repeat(64),
        purpose: 'logo',
        visibility: 'marketplace',
      }, {
        objectReference: 'Object/private-address-evidence',
        contentType: 'image/jpeg',
        sha256: 'c'.repeat(64),
        purpose: 'official-address-evidence',
        visibility: 'verification-private',
      }],
    },
    services: [{
      identifier: 'blood-donation',
      name: 'Blood donation',
      fhirHealthcareServiceReference: BLOOD_DONATION_SERVICE,
      serviceType: 'http://terminology.hl7.org/CodeSystem/service-type|117',
      locationReferences: ['Location/blood-donation-room'],
    }, {
      identifier: 'plasma-donation',
      name: 'Plasma donation',
      fhirHealthcareServiceReference: PLASMA_DONATION_SERVICE,
      serviceType: 'http://terminology.hl7.org/CodeSystem/service-type|167',
      locationReferences: ['Location/plasma-donation-room'],
    }],
  })

  assert.equal(entry.type, 'cds-CA-BC:v1:animal-care')
  assert.equal(entry.attributes['@type'], 'Organization')
  assert.deepEqual(entry.attributes.parentOrganization, { '@id': LEGAL_ORGANIZATION })
  assert.equal(entry.attributes.additionalType, 'http://loinc.org/LP70684-8')
  assert.equal(entry.attributes.location[0].geo.latitude, 49.2827)
  assert.equal(entry.attributes.location[0].image[0].encodingFormat, 'image/jpeg')
  assert.equal(entry.attributes.logo.length, 1)
  assert.equal(JSON.stringify(entry).includes('private-address-evidence'), false)
  assert.deepEqual(entry.relationships.healthcareServices.data, [{
    type: 'healthcare-services', id: BLOOD_DONATION_SERVICE,
  }, {
    type: 'healthcare-services', id: PLASMA_DONATION_SERVICE,
  }])
  assert.deepEqual(entry.attributes.makesOffer.map(offer => offer.itemOffered.identifier), [
    'blood-donation', 'plasma-donation',
  ])
  assert.deepEqual(entry.attributes.makesOffer.map(offer => offer.itemOffered.sameAs), [
    BLOOD_DONATION_SERVICE, PLASMA_DONATION_SERVICE,
  ])
  assert.notEqual(entry.attributes.location[1].sameAs, entry.attributes.location[2].sameAs)
  assert.deepEqual(entry.attributes.location[1].containedInPlace, { '@id': 'Location/blood-donation-point' })
  assert.deepEqual(entry.attributes.location[2].containedInPlace, { '@id': 'Location/blood-donation-point' })
  assert.deepEqual(entry.attributes.location.map(place => place.geo), Array(3).fill(entry.attributes.location[0].geo))
})

test('keeps service sectors explicit and rejects a service catalog that crosses sector or department boundaries', () => {
  assert.deepEqual(Object.values(OrganizationServiceCatalogSector), [
    'animal-care', 'health-care', 'animal-insurance', 'health-insurance',
    'animal-lab', 'health-lab', 'onehealth-lab',
  ])

  assert.throws(() => buildOrganizationServiceCatalogEntry({
    id: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    catalogVersion: 1,
    jurisdiction: 'CA-BC',
    sector: 'animal-research',
    legalOrganizationReference: LEGAL_ORGANIZATION,
    department: {
      identifier: 'emergency-department', name: 'Emergency department',
      fhirOrganizationReference: DEPARTMENT,
      locations: [], media: [],
    },
    services: [],
  }), /organization_service_catalog_sector_invalid/)
})

test('assigns a professional Group to one department and does not require a department DID', () => {
  const assignment = normalizeProfessionalServiceGroupAssignment({
    groupReference: PROFESSIONAL_GROUP,
    departmentOrganizationReference: DEPARTMENT,
    healthcareServiceReference: HEALTHCARE_SERVICE,
  })
  assert.equal(assignment.departmentOrganizationReference, DEPARTMENT)
  assert.equal('departmentDid' in assignment, false)
  assert.throws(() => normalizeProfessionalServiceGroupAssignment({
    ...assignment,
    departmentOrganizationReference: [DEPARTMENT, 'Organization/other-department'],
  }), /professional_service_group_department_invalid/)
})

test('separates legal author and professional attester from the transport sender', () => {
  const identity = normalizeClinicalDocumentIdentity({
    legalOrganizationReference: LEGAL_ORGANIZATION,
    clinicalDocumentAuthorReference: LEGAL_ORGANIZATION,
    professionalAttesterReference: PRACTITIONER_ROLE,
    transportSenderReference: PRACTITIONER_ROLE,
  })
  assert.equal(identity.clinicalDocumentAuthorReference, LEGAL_ORGANIZATION)
  assert.equal(identity.professionalAttesterReference, PRACTITIONER_ROLE)
  assert.throws(() => normalizeClinicalDocumentIdentity({
    ...identity,
    clinicalDocumentAuthorReference: PROFESSIONAL_GROUP,
  }), /clinical_document_author_must_be_legal_organization/)
})

test('routes replies through the department Group while separating the FHIR sender from the authenticated transport actor', () => {
  const route = buildProfessionalServiceCommunicationRoute({
    threadId: 'thread-emergency-one',
    direction: 'subject-to-professional',
    departmentOrganizationReference: DEPARTMENT,
    healthcareServiceReference: HEALTHCARE_SERVICE,
    professionalGroupReference: PROFESSIONAL_GROUP,
    communicationSenderReference: CONTROLLER,
    transportSenderReference: CONTROLLER,
    recipientReference: PROFESSIONAL_GROUP,
  })
  assert.equal(route.communicationSenderReference, CONTROLLER)
  assert.equal(route.transportSenderReference, CONTROLLER)
  assert.equal(route.recipientReference, PROFESSIONAL_GROUP)
  assert.equal(route.professionalGroupReference, PROFESSIONAL_GROUP)
  assert.equal('authorReference' in route, false)
  assert.throws(() => buildProfessionalServiceCommunicationRoute({
    ...route,
    communicationSenderReference: PROFESSIONAL_GROUP,
  }), /professional_service_communication_group_sender_forbidden/)

  const professionalCall = buildProfessionalServiceCommunicationRoute({
    ...route,
    direction: 'professional-to-subject',
    communicationSenderReference: DEPARTMENT,
    transportSenderReference: PRACTITIONER_ROLE,
    recipientReference: CONTROLLER,
  })
  assert.equal(professionalCall.communicationSenderReference, DEPARTMENT)
  assert.equal(professionalCall.transportSenderReference, PRACTITIONER_ROLE)
  assert.equal(professionalCall.recipientReference, CONTROLLER)
  assert.throws(() => buildProfessionalServiceCommunicationRoute({
    ...professionalCall,
    communicationSenderReference: LEGAL_ORGANIZATION,
  }), /professional_service_communication_department_sender_required/)
})

test('publishes an installed machine with public certification while keeping technical calibration separate', () => {
  const entry = buildOrganizationEquipmentCatalogEntry({
    id: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    catalogVersion: 1,
    jurisdiction: REPOSITORY_SAFE_EXAMPLES.countryIso2,
    sector: OrganizationServiceCatalogSector.HealthLab,
    departmentOrganizationReference: 'Organization/laboratory-department',
    installationLocationReference: 'Location/analyzer-station-1',
    deviceReference: 'Device/analyzer-1',
    equipment: {
      identifier: 'analyzer-1',
      name: 'Clinical chemistry analyzer 1',
      serialNumber: 'SERIAL-EXAMPLE-1',
      model: 'MODEL-EXAMPLE',
      manufacturerOrganizationReference: 'Organization/equipment-manufacturer',
      certifications: [{
        identifier: 'operating-authorization-1',
        name: 'Installed equipment operating authorization',
        status: 'CertificationActive',
        issuedByOrganizationReference: 'Organization/public-health-authority',
        validFrom: '2026-09-29',
        expires: '2027-09-29',
        validIn: REPOSITORY_SAFE_EXAMPLES.countryIso2,
        fhirRegulatedAuthorizationReference: 'RegulatedAuthorization/operating-authorization-1',
      }],
    },
  })

  assert.equal(entry.attributes['@type'], 'IndividualProduct')
  assert.equal(entry.attributes.sameAs, 'Device/analyzer-1')
  assert.equal(entry.attributes.hasCertification[0].issuedBy['@id'], 'Organization/public-health-authority')
  assert.equal(entry.relationships.installationLocation.data.id, 'Location/analyzer-station-1')
  assert.equal(entry.relationships.regulatedAuthorizations.data[0].id, 'RegulatedAuthorization/operating-authorization-1')
  assert.equal(JSON.stringify(entry).includes('calibration'), false)
})
