// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SOSCHAIN_DEMO_DEPARTMENTS,
  SOSCHAIN_DEMO_ORGANIZATIONS,
  SOSCHAIN_PORTAL_ACCESS_MODES,
  SOSCHAIN_PROFESSIONAL_DEMO_PROFILES,
  SoschainProfessionalDemoProfileIds,
  SoschainProfessionalDemoSectorIds,
  getSoschainDemoProfilesForSector,
} from '../dist/portal-access-profiles.data.js'

const expectedAccessModeIds = ['personal', 'partner', 'test-network', 'demo']
const enabledProfessionalDemoSectors = Object.values(SoschainProfessionalDemoSectorIds)
const priorityMvpProfileIds = [
  SoschainProfessionalDemoProfileIds.Doctor,
  SoschainProfessionalDemoProfileIds.Nurse,
  SoschainProfessionalDemoProfileIds.Paramedic,
  SoschainProfessionalDemoProfileIds.Firefighter,
  SoschainProfessionalDemoProfileIds.Lifeguard,
  SoschainProfessionalDemoProfileIds.PoliceOfficer,
]
const focusedDemoSectorIds = [
  SoschainProfessionalDemoSectorIds.AnimalCare,
  SoschainProfessionalDemoSectorIds.HealthCare,
  SoschainProfessionalDemoSectorIds.PublicHealth,
  SoschainProfessionalDemoSectorIds.PublicSafety,
]

test('publishes explicit real, test-network and preloaded-demo portal modes', () => {
  assert.deepEqual(SOSCHAIN_PORTAL_ACCESS_MODES.map(({ id }) => id), expectedAccessModeIds)
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'personal')?.dataKind, 'real')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'partner')?.dataKind, 'real')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'test-network')?.dataKind, 'synthetic-persistent')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'demo')?.dataKind, 'synthetic-resettable')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'personal')?.ledgerKind, 'production')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'partner')?.ledgerKind, 'production')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'test-network')?.ledgerKind, 'test-network')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'demo')?.ledgerKind, 'mock')
  assert.equal(new Set(SOSCHAIN_PORTAL_ACCESS_MODES.map(({ portalShell }) => portalShell)).size, 1)
})

test('publishes every priority health-care and public-safety MVP profile without granting authority', () => {
  assert.deepEqual(enabledProfessionalDemoSectors.toSorted(), focusedDemoSectorIds.toSorted())
  assert.deepEqual(
    [...new Set(SOSCHAIN_PROFESSIONAL_DEMO_PROFILES.filter(({ enabled }) => enabled).map(({ sector }) => sector))],
    enabledProfessionalDemoSectors,
  )
  const enabledProfileIds = SOSCHAIN_PROFESSIONAL_DEMO_PROFILES.filter(({ enabled }) => enabled).map(({ id }) => id)
  assert.ok(priorityMvpProfileIds.every(profileId => enabledProfileIds.includes(profileId)))
  assert.ok(getSoschainDemoProfilesForSector(SoschainProfessionalDemoSectorIds.PublicSafety).length > 0)
})

test('publishes bounded public-health profiles without adding animal services', () => {
  const publicHealthProfiles = getSoschainDemoProfilesForSector(SoschainProfessionalDemoSectorIds.PublicHealth)
  assert.deepEqual(publicHealthProfiles.map(({ id }) => id), [
    SoschainProfessionalDemoProfileIds.Doctor,
    SoschainProfessionalDemoProfileIds.Nurse,
    SoschainProfessionalDemoProfileIds.MedicalSecretary,
    SoschainProfessionalDemoProfileIds.Researcher,
  ])
  assert.ok(publicHealthProfiles.every(({ grantsAuthority }) => grantsAuthority === false))
  assert.equal(JSON.stringify(SOSCHAIN_PROFESSIONAL_DEMO_PROFILES).includes('animal-shelter'), false)
})

test('keeps emergency departments as operational demo context rather than authority', () => {
  assert.deepEqual(SOSCHAIN_DEMO_DEPARTMENTS.map(({ sector }) => sector), enabledProfessionalDemoSectors)
  assert.ok(SOSCHAIN_DEMO_DEPARTMENTS.every(({ grantsAuthority }) => grantsAuthority === false))
  assert.ok(SOSCHAIN_PROFESSIONAL_DEMO_PROFILES.every(({ grantsAuthority }) => grantsAuthority === false))
})

test('publishes one stable synthetic organization URN per demo sector without granting authority', () => {
  assert.deepEqual(SOSCHAIN_DEMO_ORGANIZATIONS.map(({ sector }) => sector), enabledProfessionalDemoSectors)
  assert.equal(new Set(SOSCHAIN_DEMO_ORGANIZATIONS.map(({ organizationUrn }) => organizationUrn)).size, enabledProfessionalDemoSectors.length)
  assert.ok(SOSCHAIN_DEMO_ORGANIZATIONS.every(({ organizationUrn }) => organizationUrn.startsWith('urn:uuid:')))
  assert.ok(SOSCHAIN_DEMO_ORGANIZATIONS.every(({ grantsAuthority }) => grantsAuthority === false))
})
