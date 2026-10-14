// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SOSCHAIN_DEMO_DEPARTMENTS,
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

test('publishes explicit real, test-network and preloaded-demo portal modes', () => {
  assert.deepEqual(SOSCHAIN_PORTAL_ACCESS_MODES.map(({ id }) => id), expectedAccessModeIds)
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'personal')?.dataKind, 'real')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'partner')?.dataKind, 'real')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'test-network')?.dataKind, 'synthetic-persistent')
  assert.equal(SOSCHAIN_PORTAL_ACCESS_MODES.find(({ id }) => id === 'demo')?.dataKind, 'synthetic-resettable')
})

test('publishes every priority health-care and public-safety MVP profile without granting authority', () => {
  assert.deepEqual(
    [...new Set(SOSCHAIN_PROFESSIONAL_DEMO_PROFILES.filter(({ enabled }) => enabled).map(({ sector }) => sector))],
    enabledProfessionalDemoSectors,
  )
  const enabledProfileIds = SOSCHAIN_PROFESSIONAL_DEMO_PROFILES.filter(({ enabled }) => enabled).map(({ id }) => id)
  assert.ok(priorityMvpProfileIds.every(profileId => enabledProfileIds.includes(profileId)))
  assert.ok(getSoschainDemoProfilesForSector(SoschainProfessionalDemoSectorIds.PublicSafety).length > 0)
})

test('keeps emergency departments as operational demo context rather than authority', () => {
  const emergencyDepartments = SOSCHAIN_DEMO_DEPARTMENTS.filter(({ id }) => id === 'emergency')
  assert.deepEqual(emergencyDepartments.map(({ sector }) => sector), enabledProfessionalDemoSectors)
  assert.ok(emergencyDepartments.every(({ grantsAuthority }) => grantsAuthority === false))
  assert.ok(SOSCHAIN_PROFESSIONAL_DEMO_PROFILES.every(({ grantsAuthority }) => grantsAuthority === false))
})
