// Flow contract: Personal and Professional Demo consumers reuse one typed SOS fixture graph layered over the neutral clinical fixture.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SOSCHAIN_PERSONAL_DEMO_HOUSEHOLD,
  SOSCHAIN_PERSONAL_DEMO_STORIES,
  SOSCHAIN_PROFESSIONAL_DEMO_FIXTURE,
  SoschainPersonalDemoSubjectIds,
} from '../dist/portal-demo-fixtures.js'

test('publishes the household once with exact controller and delegated-access boundaries', () => {
  assert.equal(SOSCHAIN_PERSONAL_DEMO_HOUSEHOLD.length, 4)
  assert.equal(new Set(SOSCHAIN_PERSONAL_DEMO_HOUSEHOLD.map(({ organizationId }) => organizationId)).size, 4)

  const partner = SOSCHAIN_PERSONAL_DEMO_HOUSEHOLD.find(({ id }) => id === SoschainPersonalDemoSubjectIds.Partner)
  assert.equal(partner?.canManage, false)
  assert.equal(partner?.relationship, 'DOMPART')
  assert.equal(SOSCHAIN_PERSONAL_DEMO_STORIES[SoschainPersonalDemoSubjectIds.Partner].authorization, 'delegated-read')
  assert.equal(SOSCHAIN_PERSONAL_DEMO_STORIES[SoschainPersonalDemoSubjectIds.Partner].contacts[0]?.primary, true)
  assert.ok(SOSCHAIN_PERSONAL_DEMO_STORIES[SoschainPersonalDemoSubjectIds.Partner].encounter)
})

test('reuses the household, contacts and clinical journey in the Professional fixture', () => {
  const householdIds = new Set(SOSCHAIN_PERSONAL_DEMO_HOUSEHOLD.map(({ id }) => id))

  assert.ok(SOSCHAIN_PROFESSIONAL_DEMO_FIXTURE.cards.every(({ subjectId }) => householdIds.has(subjectId)))
  assert.equal(
    SOSCHAIN_PROFESSIONAL_DEMO_FIXTURE.humanEmergencySubject.encounter,
    SOSCHAIN_PERSONAL_DEMO_STORIES[SoschainPersonalDemoSubjectIds.Partner].encounter,
  )
  assert.equal(
    SOSCHAIN_PROFESSIONAL_DEMO_FIXTURE.humanEmergencySubject.contacts,
    SOSCHAIN_PERSONAL_DEMO_STORIES[SoschainPersonalDemoSubjectIds.Partner].contacts,
  )
})

test('freezes the reusable fixture graph instead of exposing mutable portal literals', () => {
  assert.ok(Object.isFrozen(SOSCHAIN_PERSONAL_DEMO_HOUSEHOLD))
  assert.ok(Object.isFrozen(SOSCHAIN_PERSONAL_DEMO_STORIES))
  assert.ok(Object.isFrozen(SOSCHAIN_PROFESSIONAL_DEMO_FIXTURE))
})
