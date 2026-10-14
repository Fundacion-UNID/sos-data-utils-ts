// Flow contract: reusable SOS, Vet and UHC demos import named synthetic identities and encounter display identifiers without duplicating private-looking literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SOS_DEMO_IDENTITIES,
  SOS_ENCOUNTER_IDENTIFIER_EXAMPLE,
  buildSosEncounterDisplayIdentifier,
} from '../dist/demo-identities.js'

const FIRST_SAME_SECOND_COLLISION_SEQUENCE = 1

test('exports Doe individuals, role-labelled professionals and fictional 555 contacts', () => {
  const individual = SOS_DEMO_IDENTITIES.individual
  const emergencyContact = SOS_DEMO_IDENTITIES.emergencyContacts[0]
  const professional = SOS_DEMO_IDENTITIES.professionals.doctor

  assert.equal(individual.displayName, `${individual.givenName} ${individual.familyName}`)
  assert.equal(emergencyContact.familyName, individual.familyName)
  assert.match(emergencyContact.phoneDisplay, SOS_DEMO_IDENTITIES.fictionalPhoneDisplayPattern)
  assert.equal(professional.displayLabel, `${professional.givenName} — ${professional.roleLabel}`)
})

test('preserves ten epoch-second digits and adds a collision sequence without changing clinical time', () => {
  const baseIdentifier = buildSosEncounterDisplayIdentifier({
    occurredAt: SOS_ENCOUNTER_IDENTIFIER_EXAMPLE.occurredAt,
  })
  const collidingIdentifier = buildSosEncounterDisplayIdentifier({
    occurredAt: SOS_ENCOUNTER_IDENTIFIER_EXAMPLE.occurredAt,
    collisionSequence: FIRST_SAME_SECOND_COLLISION_SEQUENCE,
  })

  assert.equal(baseIdentifier, SOS_ENCOUNTER_IDENTIFIER_EXAMPLE.displayIdentifier)
  assert.equal(collidingIdentifier, SOS_ENCOUNTER_IDENTIFIER_EXAMPLE.firstCollisionDisplayIdentifier)
  assert.notEqual(baseIdentifier, collidingIdentifier)
})
