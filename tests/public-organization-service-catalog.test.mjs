// Flow contract: 1) an authenticated organization controller marks departments, Schema.org Places and client Services as public or private; 2) the trusted publisher emits only a coherent public claims-first catalog and DCAT discovery descriptor; 3) a marketplace cache revalidates versioned descriptors without becoming authoritative; 4) private resources, broken public relationships and caller-authored trust never enter the published dataset.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DcatDatasetClaim,
  SchemaOrgServiceClaim,
  buildPublicOrganizationServiceCatalog,
  evaluateOrganizationCatalogCache,
} from '../dist/public-organization-service-catalog.js'
import { SchemaOrgPlaceClaim } from '../dist/location-proximity.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

const input = Object.freeze({
  datasetId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
  version: 3,
  issuedAt: '2026-10-21T10:00:00.000Z',
  modifiedAt: '2026-10-21T11:00:00.000Z',
  jurisdiction: 'CA-BC',
  sector: 'education',
  publisher: {
    id: 'organization-example',
    name: 'Example organization',
    publishInCatalog: true,
  },
  departments: [{
    id: 'department-learning',
    name: 'Learning services',
    publishInCatalog: true,
  }],
  places: [{
    id: 'place-campus',
    departmentId: 'department-learning',
    name: 'Main campus',
    publishInCatalog: true,
    geo: { latitude: 49.28, longitude: -123.12 },
  }, {
    id: 'place-internal-office',
    departmentId: 'department-learning',
    name: 'Internal office',
    publishInCatalog: false,
  }],
  services: [{
    id: 'service-assessment',
    departmentId: 'department-learning',
    name: 'Qualification assessment',
    serviceType: 'qualification-assessment',
    description: 'Assessment by appointment.',
    placeIds: ['place-campus'],
    publishInCatalog: true,
  }, {
    id: 'service-internal-review',
    departmentId: 'department-learning',
    name: 'Internal review',
    serviceType: 'internal-review',
    placeIds: ['place-internal-office'],
    publishInCatalog: false,
  }],
  distribution: {
    accessUrl: `${REPOSITORY_SAFE_EXAMPLES.httpsBaseUrl}/datasets/organization-example/services`,
    mediaType: 'application/vnd.api+json',
  },
})

test('publishes only explicitly public Schema.org resources with flat claims', () => {
  const catalog = buildPublicOrganizationServiceCatalog(input)

  assert.equal(catalog.dataset.meta.claims[DcatDatasetClaim.Version], '3')
  assert.equal(catalog.dataset.meta.claims[DcatDatasetClaim.Publisher], 'organization-example')
  assert.deepEqual(catalog.resources.map(resource => resource.resourceType), [
    'Organization', 'Organization', 'Place', 'Service',
  ])

  const place = catalog.resources.find(resource => resource.resourceType === 'Place')
  const service = catalog.resources.find(resource => resource.resourceType === 'Service')
  assert.equal(place.meta.claims[SchemaOrgPlaceClaim.name], 'Main campus')
  assert.equal(place.meta.claims[SchemaOrgPlaceClaim.latitude], '49.28')
  assert.equal(service.meta.claims[SchemaOrgServiceClaim.Name], 'Qualification assessment')
  assert.deepEqual(service.meta.claims[SchemaOrgServiceClaim.AvailableAtOrFrom], ['place-campus'])
  assert.equal(JSON.stringify(catalog).includes('Internal office'), false)
  assert.equal(JSON.stringify(catalog).includes('Internal review'), false)
  assert.equal(JSON.stringify(catalog).includes('HealthcareService'), false)
  assert.equal(JSON.stringify(catalog).includes('Location'), false)
  assert.equal(JSON.stringify(catalog).includes('Schedule'), false)
})

test('fails closed when a public service references a private or unknown place', () => {
  assert.throws(() => buildPublicOrganizationServiceCatalog({
    ...input,
    services: [{ ...input.services[0], placeIds: ['place-internal-office'] }],
  }), /public_service_place_not_public/)
  assert.throws(() => buildPublicOrganizationServiceCatalog({
    ...input,
    services: [{ ...input.services[0], placeIds: ['place-missing'] }],
  }), /public_service_place_not_found/)
})

test('keeps trust outside the descriptor and makes cache refresh deterministic', () => {
  const catalog = buildPublicOrganizationServiceCatalog(input)
  assert.equal('trusted' in catalog.descriptor, false)
  assert.equal('verified' in catalog.descriptor, false)

  assert.deepEqual(evaluateOrganizationCatalogCache({
    cached: undefined,
    discovered: catalog.descriptor,
    checkedAt: '2026-10-21T11:05:00.000Z',
    maxAgeSeconds: 900,
  }), { action: 'fetch', reason: 'not-cached' })

  assert.deepEqual(evaluateOrganizationCatalogCache({
    cached: { ...catalog.descriptor, checkedAt: '2026-10-21T11:05:00.000Z' },
    discovered: catalog.descriptor,
    checkedAt: '2026-10-21T11:10:00.000Z',
    maxAgeSeconds: 900,
  }), { action: 'use-cache', reason: 'fresh' })

  assert.deepEqual(evaluateOrganizationCatalogCache({
    cached: { ...catalog.descriptor, checkedAt: '2026-10-21T11:05:00.000Z' },
    discovered: { ...catalog.descriptor, version: 4, modifiedAt: '2026-10-21T11:15:00.000Z' },
    checkedAt: '2026-10-21T11:16:00.000Z',
    maxAgeSeconds: 900,
  }), { action: 'fetch', reason: 'new-version' })

  assert.deepEqual(evaluateOrganizationCatalogCache({
    cached: { ...catalog.descriptor, checkedAt: '2026-10-21T11:05:00.000Z' },
    discovered: { ...catalog.descriptor, status: 'withdrawn' },
    checkedAt: '2026-10-21T11:06:00.000Z',
    maxAgeSeconds: 900,
  }), { action: 'evict', reason: 'withdrawn' })
})
