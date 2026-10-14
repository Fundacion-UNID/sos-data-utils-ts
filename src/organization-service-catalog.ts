import { DataspaceSectors } from 'gdc-common-utils-ts/constants/sectors'

/** Sectors whose Organizations can publish department service catalogs. */
export const OrganizationServiceCatalogSector = Object.freeze({
  AnimalCare: DataspaceSectors.AnimalCare,
  HealthCare: DataspaceSectors.HealthCare,
  AnimalInsurance: DataspaceSectors.AnimalInsurance,
  HealthInsurance: DataspaceSectors.HealthInsurance,
  AnimalLab: DataspaceSectors.AnimalLab,
  HealthLab: DataspaceSectors.HealthLab,
  OneHealthLab: DataspaceSectors.OneHealthLab,
} as const)

export type OrganizationServiceCatalogSectorValue =
  typeof OrganizationServiceCatalogSector[keyof typeof OrganizationServiceCatalogSector]

export type GovernedCatalogMedia = Readonly<{
  objectReference: string
  contentType: 'image/png' | 'image/jpeg'
  sha256: string
  purpose: 'logo' | 'place' | 'official-address-evidence'
  visibility: 'marketplace' | 'verification-private'
  alternateName?: string
}>

export type OrganizationServiceCatalogPlaceInput = Readonly<{
  identifier: string
  name: string
  fhirLocationReference: string
  containedInPlaceReference?: string
  geo: Readonly<{ latitude: number; longitude: number; elevation?: number }>
  images: readonly GovernedCatalogMedia[]
}>

export type OrganizationServiceCatalogInput = Readonly<{
  id: string
  catalogVersion: number
  jurisdiction: string
  sector: OrganizationServiceCatalogSectorValue
  legalOrganizationReference: string
  department: Readonly<{
    identifier: string
    name: string
    fhirOrganizationReference: string
    loincSpecialty?: Readonly<{
      system: 'http://loinc.org'
      code: string
      display: string
    }>
    locations: readonly OrganizationServiceCatalogPlaceInput[]
    media: readonly GovernedCatalogMedia[]
  }>
  services: readonly Readonly<{
    identifier: string
    name: string
    fhirHealthcareServiceReference: string
    serviceType: string
    locationReferences: readonly string[]
  }>[]
}>

type SchemaOrgImageObject = Readonly<{
  '@type': 'ImageObject'
  identifier: string
  encodingFormat: 'image/png' | 'image/jpeg'
  sha256: string
  alternateName?: string
}>

type SchemaOrgPlace = Readonly<{
  '@type': 'Place'
  identifier: string
  name: string
  sameAs: string
  containedInPlace?: Readonly<{ '@id': string }>
  geo: Readonly<{
    '@type': 'GeoCoordinates'
    latitude: number
    longitude: number
    elevation?: number
  }>
  image: readonly SchemaOrgImageObject[]
}>

type SchemaOrgDepartment = Readonly<{
  '@type': 'Organization'
  identifier: string
  name: string
  sameAs: string
  parentOrganization: Readonly<{ '@id': string }>
  additionalType?: string
  location: readonly SchemaOrgPlace[]
  logo: readonly SchemaOrgImageObject[]
  image: readonly SchemaOrgImageObject[]
  makesOffer: readonly Readonly<{
    '@type': 'Offer'
    identifier: string
    itemOffered: Readonly<{
      '@type': 'Service'
      identifier: string
      name: string
      sameAs: string
      serviceType: string
      availableAtOrFrom: readonly Readonly<{ '@id': string }>[]
    }>
  }>[]
}>

export type OrganizationServiceCatalogEntry = Readonly<{
  type: string
  id: string
  attributes: SchemaOrgDepartment
  relationships: Readonly<{
    legalOrganization: Readonly<{ data: Readonly<{ type: 'organizations'; id: string }> }>
    healthcareServices: Readonly<{
      data: readonly Readonly<{ type: 'healthcare-services'; id: string }>[]
    }>
  }>
}>

/**
 * Builds one public JSON:API entry for a department and its offered services.
 * Verification-only address evidence is deliberately excluded from output.
 */
export function buildOrganizationServiceCatalogEntry(
  input: OrganizationServiceCatalogInput,
): OrganizationServiceCatalogEntry {
  const sector = catalogSector(input.sector)
  const jurisdiction = normalizeJurisdiction(input.jurisdiction)
  if (!Number.isInteger(input.catalogVersion) || input.catalogVersion < 1) {
    throw new TypeError('organization_service_catalog_version_invalid')
  }
  const legalOrganizationReference = reference(
    input.legalOrganizationReference,
    'Organization',
    'organization_service_catalog_legal_organization_invalid',
  )
  const departmentReference = reference(
    input.department.fhirOrganizationReference,
    'Organization',
    'organization_service_catalog_department_invalid',
  )
  if (departmentReference === legalOrganizationReference) {
    throw new TypeError('organization_service_catalog_department_parent_required')
  }
  const locations = Object.freeze(input.department.locations.map(normalizePlace))
  const knownLocations = new Set(locations.map(location => location.sameAs))
  if (locations.some(location => location.containedInPlace
    && (location.containedInPlace['@id'] === location.sameAs
      || !knownLocations.has(location.containedInPlace['@id'])))) {
    throw new TypeError('organization_service_catalog_place_parent_invalid')
  }
  const healthcareServiceReferences = new Set<string>()
  const services = Object.freeze(input.services.map(service => {
    const healthcareServiceReference = reference(
      service.fhirHealthcareServiceReference,
      'HealthcareService',
      'organization_service_catalog_healthcare_service_invalid',
    )
    if (healthcareServiceReferences.has(healthcareServiceReference)) {
      throw new TypeError('organization_service_catalog_healthcare_service_duplicate')
    }
    healthcareServiceReferences.add(healthcareServiceReference)
    const locationReferences = unique(service.locationReferences.map(value => reference(
      value,
      'Location',
      'organization_service_catalog_service_location_invalid',
    )))
    if (locationReferences.some(locationReference => !knownLocations.has(locationReference))) {
      throw new TypeError('organization_service_catalog_service_location_not_in_department')
    }
    return Object.freeze({
      '@type': 'Offer' as const,
      identifier: required(service.identifier, 'organization_service_catalog_service_identifier_required'),
      itemOffered: Object.freeze({
        '@type': 'Service' as const,
        identifier: required(service.identifier, 'organization_service_catalog_service_identifier_required'),
        name: required(service.name, 'organization_service_catalog_service_name_required'),
        sameAs: healthcareServiceReference,
        serviceType: coding(service.serviceType, 'organization_service_catalog_service_type_invalid'),
        availableAtOrFrom: Object.freeze(locationReferences.map(id => Object.freeze({ '@id': id }))),
      }),
    })
  }))

  const publicDepartmentMedia = input.department.media
    .map(normalizeMedia)
    .filter(media => media.visibility === 'marketplace')
  const logo = Object.freeze(publicDepartmentMedia.filter(media => media.purpose === 'logo').map(toImageObject))
  const image = Object.freeze(publicDepartmentMedia.filter(media => media.purpose !== 'logo').map(toImageObject))
  const loincSpecialty = input.department.loincSpecialty
  if (loincSpecialty && (loincSpecialty.system !== 'http://loinc.org' || !/^L(?:A|P)\d+(?:-\d+)?$/.test(loincSpecialty.code))) {
    throw new TypeError('organization_service_catalog_loinc_specialty_invalid')
  }

  return Object.freeze({
    type: `cds-${jurisdiction}:v${input.catalogVersion}:${sector}`,
    id: uuid(input.id),
    attributes: Object.freeze({
      '@type': 'Organization' as const,
      identifier: required(input.department.identifier, 'organization_service_catalog_department_identifier_required'),
      name: required(input.department.name, 'organization_service_catalog_department_name_required'),
      sameAs: departmentReference,
      parentOrganization: Object.freeze({ '@id': legalOrganizationReference }),
      ...(loincSpecialty ? { additionalType: `${loincSpecialty.system}/${loincSpecialty.code}` } : {}),
      location: locations,
      logo,
      image,
      makesOffer: services,
    }),
    relationships: Object.freeze({
      legalOrganization: Object.freeze({
        data: Object.freeze({ type: 'organizations' as const, id: legalOrganizationReference }),
      }),
      healthcareServices: Object.freeze({
        data: Object.freeze(services.map(offer => Object.freeze({
          type: 'healthcare-services' as const,
          id: offer.itemOffered.sameAs,
        }))),
      }),
    }),
  })
}

export type ProfessionalServiceGroupAssignment = Readonly<{
  groupReference: string
  departmentOrganizationReference: string
  healthcareServiceReference: string
}>

export type OrganizationEquipmentCatalogInput = Readonly<{
  id: string
  catalogVersion: number
  jurisdiction: string
  sector: OrganizationServiceCatalogSectorValue
  departmentOrganizationReference: string
  installationLocationReference: string
  deviceReference: string
  equipment: Readonly<{
    identifier: string
    name: string
    serialNumber: string
    model?: string
    manufacturerOrganizationReference?: string
    certifications: readonly Readonly<{
      identifier: string
      name: string
      status: 'CertificationActive' | 'CertificationInactive'
      issuedByOrganizationReference: string
      validFrom: string
      expires: string
      validIn: string
      fhirRegulatedAuthorizationReference: string
    }>[]
  }>
}>

export type OrganizationEquipmentCatalogEntry = Readonly<{
  type: string
  id: string
  attributes: Readonly<{
    '@type': 'IndividualProduct'
    identifier: string
    name: string
    serialNumber: string
    model?: string
    sameAs: string
    manufacturer?: Readonly<{ '@id': string }>
    hasCertification: readonly Readonly<{
      '@type': 'Certification'
      certificationIdentification: string
      name: string
      certificationStatus: 'CertificationActive' | 'CertificationInactive'
      issuedBy: Readonly<{ '@id': string }>
      validFrom: string
      expires: string
      validIn: string
      sameAs: string
    }>[]
  }>
  relationships: Readonly<{
    department: Readonly<{ data: Readonly<{ type: 'organizations'; id: string }> }>
    installationLocation: Readonly<{ data: Readonly<{ type: 'locations'; id: string }> }>
    device: Readonly<{ data: Readonly<{ type: 'devices'; id: string }> }>
    regulatedAuthorizations: Readonly<{ data: readonly Readonly<{ type: 'regulated-authorizations'; id: string }>[] }>
  }>
}>

/**
 * Builds the public Schema.org identity of one installed equipment instance.
 *
 * Calibration events are deliberately absent: they remain protected FHIR
 * Procedure/DeviceMetric/DocumentReference records. Public certifications link
 * to their independent RegulatedAuthorization identities.
 */
export function buildOrganizationEquipmentCatalogEntry(
  input: OrganizationEquipmentCatalogInput,
): OrganizationEquipmentCatalogEntry {
  const jurisdiction = normalizeJurisdiction(input.jurisdiction)
  const sector = catalogSector(input.sector)
  if (!Number.isInteger(input.catalogVersion) || input.catalogVersion < 1) {
    throw new TypeError('organization_equipment_catalog_version_invalid')
  }
  const department = reference(
    input.departmentOrganizationReference,
    'Organization',
    'organization_equipment_catalog_department_invalid',
  )
  const installationLocation = reference(
    input.installationLocationReference,
    'Location',
    'organization_equipment_catalog_location_invalid',
  )
  const device = reference(input.deviceReference, 'Device', 'organization_equipment_catalog_device_invalid')
  const certificationIds = new Set<string>()
  const certifications = Object.freeze(input.equipment.certifications.map(certification => {
    const identifier = required(certification.identifier, 'organization_equipment_certification_identifier_required')
    if (certificationIds.has(identifier)) throw new TypeError('organization_equipment_certification_duplicate')
    certificationIds.add(identifier)
    if (certification.status !== 'CertificationActive' && certification.status !== 'CertificationInactive') {
      throw new TypeError('organization_equipment_certification_status_invalid')
    }
    const validFrom = date(certification.validFrom, 'organization_equipment_certification_validity_invalid')
    const expires = date(certification.expires, 'organization_equipment_certification_validity_invalid')
    if (Date.parse(expires) < Date.parse(validFrom)) throw new TypeError('organization_equipment_certification_validity_invalid')
    return Object.freeze({
      '@type': 'Certification' as const,
      certificationIdentification: identifier,
      name: required(certification.name, 'organization_equipment_certification_name_required'),
      certificationStatus: certification.status,
      issuedBy: Object.freeze({
        '@id': reference(
          certification.issuedByOrganizationReference,
          'Organization',
          'organization_equipment_certification_issuer_invalid',
        ),
      }),
      validFrom,
      expires,
      validIn: normalizeJurisdiction(certification.validIn),
      sameAs: reference(
        certification.fhirRegulatedAuthorizationReference,
        'RegulatedAuthorization',
        'organization_equipment_certification_authorization_invalid',
      ),
    })
  }))
  const manufacturer = input.equipment.manufacturerOrganizationReference
    ? reference(input.equipment.manufacturerOrganizationReference, 'Organization', 'organization_equipment_manufacturer_invalid')
    : undefined
  return Object.freeze({
    type: `cds-${jurisdiction}:v${input.catalogVersion}:${sector}:equipment`,
    id: uuid(input.id),
    attributes: Object.freeze({
      '@type': 'IndividualProduct' as const,
      identifier: required(input.equipment.identifier, 'organization_equipment_identifier_required'),
      name: required(input.equipment.name, 'organization_equipment_name_required'),
      serialNumber: required(input.equipment.serialNumber, 'organization_equipment_serial_number_required'),
      ...(input.equipment.model ? { model: required(input.equipment.model, 'organization_equipment_model_invalid') } : {}),
      sameAs: device,
      ...(manufacturer ? { manufacturer: Object.freeze({ '@id': manufacturer }) } : {}),
      hasCertification: certifications,
    }),
    relationships: Object.freeze({
      department: Object.freeze({ data: Object.freeze({ type: 'organizations' as const, id: department }) }),
      installationLocation: Object.freeze({ data: Object.freeze({ type: 'locations' as const, id: installationLocation }) }),
      device: Object.freeze({ data: Object.freeze({ type: 'devices' as const, id: device }) }),
      regulatedAuthorizations: Object.freeze({ data: Object.freeze(certifications.map(certification => Object.freeze({
        type: 'regulated-authorizations' as const,
        id: certification.sameAs,
      }))) }),
    }),
  })
}

/** One Group belongs to exactly one department; membership grants no access. */
export function normalizeProfessionalServiceGroupAssignment(
  input: ProfessionalServiceGroupAssignment,
): ProfessionalServiceGroupAssignment {
  if (Array.isArray(input.departmentOrganizationReference)) {
    throw new TypeError('professional_service_group_department_invalid')
  }
  return Object.freeze({
    groupReference: reference(input.groupReference, 'Group', 'professional_service_group_reference_invalid'),
    departmentOrganizationReference: reference(
      input.departmentOrganizationReference,
      'Organization',
      'professional_service_group_department_invalid',
    ),
    healthcareServiceReference: reference(
      input.healthcareServiceReference,
      'HealthcareService',
      'professional_service_group_healthcare_service_invalid',
    ),
  })
}

export type ClinicalDocumentIdentity = Readonly<{
  legalOrganizationReference: string
  clinicalDocumentAuthorReference: string
  professionalAttesterReference?: string
  transportSenderReference: string
}>

/**
 * Keeps the legal author, professional attester and authenticated transport
 * actor independent. This record validates identity shape, never authority.
 */
export function normalizeClinicalDocumentIdentity(input: ClinicalDocumentIdentity): ClinicalDocumentIdentity {
  const legalOrganizationReference = reference(
    input.legalOrganizationReference,
    'Organization',
    'clinical_document_legal_organization_invalid',
  )
  const clinicalDocumentAuthorReference = reference(
    input.clinicalDocumentAuthorReference,
    'Organization',
    'clinical_document_author_must_be_legal_organization',
  )
  if (clinicalDocumentAuthorReference !== legalOrganizationReference) {
    throw new TypeError('clinical_document_author_must_be_legal_organization')
  }
  return Object.freeze({
    legalOrganizationReference,
    clinicalDocumentAuthorReference,
    ...(input.professionalAttesterReference ? {
      professionalAttesterReference: reference(
        input.professionalAttesterReference,
        'PractitionerRole',
        'clinical_document_professional_attester_invalid',
      ),
    } : {}),
    transportSenderReference: reference(
      input.transportSenderReference,
      undefined,
      'clinical_document_transport_sender_invalid',
    ),
  })
}

export type ProfessionalServiceCommunicationRoute = Readonly<{
  threadId: string
  direction: 'professional-to-subject' | 'subject-to-professional'
  departmentOrganizationReference: string
  healthcareServiceReference: string
  professionalGroupReference: string
  communicationSenderReference: string
  transportSenderReference: string
  recipientReference: string
}>

/**
 * Routes a text, IP-call or video thread through a department service Group.
 *
 * The FHIR Communication sender and authenticated transport actor are
 * deliberately independent. A professional-to-subject Communication is sent
 * by the department Organization; the acting PractitionerRole or Device signs
 * and transports the envelope. A Group is only the department queue used for
 * subject-to-professional delivery.
 */
export function buildProfessionalServiceCommunicationRoute(
  input: ProfessionalServiceCommunicationRoute,
): ProfessionalServiceCommunicationRoute {
  const professionalGroupReference = reference(
    input.professionalGroupReference,
    'Group',
    'professional_service_communication_group_invalid',
  )
  const departmentOrganizationReference = reference(
    input.departmentOrganizationReference,
    'Organization',
    'professional_service_communication_department_invalid',
  )
  const communicationSenderReference = reference(
    input.communicationSenderReference,
    undefined,
    'professional_service_communication_sender_invalid',
  )
  if (communicationSenderReference.startsWith('Group/')) {
    throw new TypeError('professional_service_communication_group_sender_forbidden')
  }
  const transportSenderReference = reference(
    input.transportSenderReference,
    undefined,
    'professional_service_communication_transport_sender_invalid',
  )
  const recipientReference = reference(
    input.recipientReference,
    undefined,
    'professional_service_communication_recipient_invalid',
  )
  if (input.direction !== 'professional-to-subject' && input.direction !== 'subject-to-professional') {
    throw new TypeError('professional_service_communication_direction_invalid')
  }
  if (input.direction === 'subject-to-professional' && recipientReference !== professionalGroupReference) {
    throw new TypeError('professional_service_communication_group_route_required')
  }
  if (input.direction === 'professional-to-subject' && recipientReference === professionalGroupReference) {
    throw new TypeError('professional_service_communication_subject_recipient_required')
  }
  if (input.direction === 'professional-to-subject' && communicationSenderReference !== departmentOrganizationReference) {
    throw new TypeError('professional_service_communication_department_sender_required')
  }
  return Object.freeze({
    threadId: required(input.threadId, 'professional_service_communication_thread_required'),
    direction: input.direction,
    departmentOrganizationReference,
    healthcareServiceReference: reference(
      input.healthcareServiceReference,
      'HealthcareService',
      'professional_service_communication_healthcare_service_invalid',
    ),
    professionalGroupReference,
    communicationSenderReference,
    transportSenderReference,
    recipientReference,
  })
}

function normalizePlace(input: OrganizationServiceCatalogPlaceInput): SchemaOrgPlace {
  if (!Number.isFinite(input.geo.latitude) || input.geo.latitude < -90 || input.geo.latitude > 90) {
    throw new TypeError('organization_service_catalog_place_latitude_invalid')
  }
  if (!Number.isFinite(input.geo.longitude) || input.geo.longitude < -180 || input.geo.longitude > 180) {
    throw new TypeError('organization_service_catalog_place_longitude_invalid')
  }
  const placeImages = input.images.map(normalizeMedia)
  if (placeImages.some(media => media.visibility !== 'marketplace' || media.purpose !== 'place')) {
    throw new TypeError('organization_service_catalog_place_image_invalid')
  }
  return Object.freeze({
    '@type': 'Place',
    identifier: required(input.identifier, 'organization_service_catalog_place_identifier_required'),
    name: required(input.name, 'organization_service_catalog_place_name_required'),
    sameAs: reference(input.fhirLocationReference, 'Location', 'organization_service_catalog_place_reference_invalid'),
    ...(input.containedInPlaceReference ? {
      containedInPlace: Object.freeze({
        '@id': reference(
          input.containedInPlaceReference,
          'Location',
          'organization_service_catalog_place_parent_invalid',
        ),
      }),
    } : {}),
    geo: Object.freeze({
      '@type': 'GeoCoordinates',
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
      ...(input.geo.elevation === undefined ? {} : { elevation: finite(input.geo.elevation, 'organization_service_catalog_place_elevation_invalid') }),
    }),
    image: Object.freeze(placeImages.map(toImageObject)),
  })
}

function normalizeMedia(input: GovernedCatalogMedia): GovernedCatalogMedia {
  if (input.contentType !== 'image/png' && input.contentType !== 'image/jpeg') {
    throw new TypeError('organization_service_catalog_media_type_invalid')
  }
  if (!/^[a-f0-9]{64}$/i.test(input.sha256)) {
    throw new TypeError('organization_service_catalog_media_digest_invalid')
  }
  if (!['logo', 'place', 'official-address-evidence'].includes(input.purpose)) {
    throw new TypeError('organization_service_catalog_media_purpose_invalid')
  }
  if (input.visibility !== 'marketplace' && input.visibility !== 'verification-private') {
    throw new TypeError('organization_service_catalog_media_visibility_invalid')
  }
  if (input.purpose === 'official-address-evidence' && input.visibility !== 'verification-private') {
    throw new TypeError('organization_service_catalog_address_evidence_must_be_private')
  }
  return Object.freeze({
    objectReference: required(input.objectReference, 'organization_service_catalog_media_reference_required'),
    contentType: input.contentType,
    sha256: input.sha256.toLowerCase(),
    purpose: input.purpose,
    visibility: input.visibility,
    ...(input.alternateName ? { alternateName: required(input.alternateName, 'organization_service_catalog_media_name_invalid') } : {}),
  })
}

function toImageObject(media: GovernedCatalogMedia): SchemaOrgImageObject {
  return Object.freeze({
    '@type': 'ImageObject',
    identifier: media.objectReference,
    encodingFormat: media.contentType,
    sha256: media.sha256,
    ...(media.alternateName ? { alternateName: media.alternateName } : {}),
  })
}

function catalogSector(value: unknown): OrganizationServiceCatalogSectorValue {
  if (!Object.values(OrganizationServiceCatalogSector).includes(value as OrganizationServiceCatalogSectorValue)) {
    throw new TypeError('organization_service_catalog_sector_invalid')
  }
  return value as OrganizationServiceCatalogSectorValue
}

function normalizeJurisdiction(value: unknown): string {
  const normalized = required(value, 'organization_service_catalog_jurisdiction_invalid').toUpperCase()
  if (!/^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(normalized)) {
    throw new TypeError('organization_service_catalog_jurisdiction_invalid')
  }
  return normalized
}

function reference(value: unknown, expectedType: string | undefined, error: string): string {
  const normalized = required(value, error)
  const match = /^([A-Z][A-Za-z0-9]+)\/([A-Za-z0-9.-]{1,128})$/.exec(normalized)
  if (!match || (expectedType && match[1] !== expectedType)) throw new TypeError(error)
  return normalized
}

function coding(value: unknown, error: string): string {
  const normalized = required(value, error)
  const separator = normalized.indexOf('|')
  if (separator < 1 || separator === normalized.length - 1 || normalized.indexOf('|', separator + 1) >= 0) {
    throw new TypeError(error)
  }
  return normalized
}

function uuid(value: unknown): string {
  const normalized = required(value, 'organization_service_catalog_id_invalid')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    throw new TypeError('organization_service_catalog_id_invalid')
  }
  return normalized.toLowerCase()
}

function required(value: unknown, error: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(error)
  return value.trim()
}

function finite(value: unknown, error: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(error)
  return value
}

function date(value: unknown, error: string): string {
  const normalized = required(value, error)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || !Number.isFinite(Date.parse(`${normalized}T00:00:00Z`))) {
    throw new TypeError(error)
  }
  return normalized
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)])
}
