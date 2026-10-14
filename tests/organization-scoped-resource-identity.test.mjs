// Flow contract: derive every organization-owned resource from the legal Organization URN, preserve the exact URN as Identifier, and expose only its SHA3-256 multibase multihash as the bounded FHIR id.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildOrganizationScopedResourceIdentity,
  buildOrganizationScopedResourceUrn,
  buildScheduleSlotIdentity,
} from '../dist/organization-scoped-resource-identity.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

const examples = REPOSITORY_SAFE_EXAMPLES.organizationScopedResources

test('builds the organization, department, service, place and schedule hierarchy without DID routing data', () => {
  const departmentUrn = buildOrganizationScopedResourceUrn({
    parentUrn: examples.organizationUrn,
    kind: 'department',
    resourceUuid: examples.departmentUuid,
  })
  const serviceUrn = buildOrganizationScopedResourceUrn({
    parentUrn: departmentUrn,
    kind: 'service',
    resourceUuid: examples.serviceUuid,
  })
  const placeUrn = buildOrganizationScopedResourceUrn({
    parentUrn: departmentUrn,
    kind: 'place',
    resourceUuid: examples.placeUuid,
  })
  const scheduleIdentity = buildOrganizationScopedResourceIdentity({
    parentUrn: serviceUrn,
    kind: 'schedule',
    resourceUuid: examples.scheduleUuid,
  })

  assert.equal(departmentUrn, `${examples.organizationUrn}:department:${examples.departmentUuid}`)
  assert.equal(serviceUrn, `${departmentUrn}:service:${examples.serviceUuid}`)
  assert.equal(placeUrn, `${departmentUrn}:place:${examples.placeUuid}`)
  assert.equal(scheduleIdentity.identifier, `${serviceUrn}:schedule:${examples.scheduleUuid}`)
  assert.match(scheduleIdentity.id, /^z[1-9A-HJ-NP-Za-km-z]+$/u)
  assert.ok(scheduleIdentity.id.length <= 64)
  assert.equal(scheduleIdentity.identifier.includes(REPOSITORY_SAFE_EXAMPLES.didWeb), false)
})

test('uses one second-precision interval segment for the Slot identity', () => {
  const scheduleUrn = buildOrganizationScopedResourceUrn({
    parentUrn: buildOrganizationScopedResourceUrn({
      parentUrn: buildOrganizationScopedResourceUrn({
        parentUrn: examples.organizationUrn,
        kind: 'department',
        resourceUuid: examples.departmentUuid,
      }),
      kind: 'service',
      resourceUuid: examples.serviceUuid,
    }),
    kind: 'schedule',
    resourceUuid: examples.scheduleUuid,
  })
  const slotIdentity = buildScheduleSlotIdentity({
    scheduleUrn,
    start: examples.slotStart,
    end: examples.slotEnd,
  })

  assert.equal(
    slotIdentity.identifier,
    `${scheduleUrn}:slot:${examples.slotStartEpochSeconds}-${examples.slotEndEpochSeconds}`,
  )
  assert.equal(slotIdentity.identifier.split(':').at(-1), `${examples.slotStartEpochSeconds}-${examples.slotEndEpochSeconds}`)
  assert.match(slotIdentity.id, /^z[1-9A-HJ-NP-Za-km-z]+$/u)
  assert.ok(slotIdentity.id.length <= 64)
})

test('normalizes fractional FHIR instants to seconds and rejects invalid hierarchy or intervals', () => {
  const scheduleUrn = `${examples.organizationUrn}:department:${examples.departmentUuid}:service:${examples.serviceUuid}:schedule:${examples.scheduleUuid}`
  assert.equal(buildScheduleSlotIdentity({
    scheduleUrn,
    start: examples.slotStartWithMilliseconds,
    end: examples.slotEndWithMilliseconds,
  }).identifier, `${scheduleUrn}:slot:${examples.slotStartEpochSeconds}-${examples.slotEndEpochSeconds}`)

  assert.throws(() => buildOrganizationScopedResourceUrn({
    parentUrn: examples.organizationUrn,
    kind: 'service',
    resourceUuid: examples.serviceUuid,
  }), /organization_scoped_resource_parent_invalid/u)
  assert.throws(() => buildScheduleSlotIdentity({
    scheduleUrn,
    start: examples.slotEnd,
    end: examples.slotStart,
  }), /schedule_slot_interval_invalid/u)
})
