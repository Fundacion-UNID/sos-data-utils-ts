// Flow contract: every documented Demo profile receives an explicit synthetic capability projection; selecting the role never grants real authority.
import assert from 'node:assert/strict'
import test from 'node:test'
import { SoschainProfessionalDemoProfileIds } from '../dist/portal-access-profiles.data.js'
import { resolveProfessionalDemoCapabilities } from '../dist/professional-demo-capabilities.js'

const expected = new Map([
  [SoschainProfessionalDemoProfileIds.Doctor, ['ips', 'attested-record', true]],
  [SoschainProfessionalDemoProfileIds.Nurse, ['ips', 'attested-record', true]],
  [SoschainProfessionalDemoProfileIds.Paramedic, ['ips', 'attested-record', true]],
  [SoschainProfessionalDemoProfileIds.MedicalSecretary, ['none', 'none', false]],
  [SoschainProfessionalDemoProfileIds.Veterinarian, ['ips', 'attested-record', true]],
  [SoschainProfessionalDemoProfileIds.VeterinaryAssistant, ['ips', 'none', false]],
  [SoschainProfessionalDemoProfileIds.Receptionist, ['none', 'none', false]],
  [SoschainProfessionalDemoProfileIds.Firefighter, ['emergency-minimum', 'none', false]],
  [SoschainProfessionalDemoProfileIds.PoliceOfficer, ['emergency-minimum', 'none', false]],
  [SoschainProfessionalDemoProfileIds.Lifeguard, ['emergency-minimum', 'none', false]],
  [SoschainProfessionalDemoProfileIds.Researcher, ['none', 'none', false]],
])

test('publishes the exact positive and negative capability projection for all eleven Demo profiles', () => {
  assert.equal(expected.size, 11)
  for (const [profileId, [healthScope, clinicalWriteScope, canRequestBreakGlass]] of expected) {
    const capabilities = resolveProfessionalDemoCapabilities(profileId)
    assert.equal(capabilities.healthScope, healthScope, profileId)
    assert.equal(capabilities.clinicalWriteScope, clinicalWriteScope, profileId)
    assert.equal(capabilities.canRequestBreakGlass, canRequestBreakGlass, profileId)
    assert.equal(capabilities.grantsRealAuthority, false, profileId)
  }
})

test('keeps the Researcher in governed research workflows without subject or emergency access', () => {
  const capabilities = resolveProfessionalDemoCapabilities(SoschainProfessionalDemoProfileIds.Researcher)
  assert.equal(capabilities.workflowFamily, 'research-governed')
  assert.equal(capabilities.healthScope, 'none')
  assert.equal(capabilities.communicationLaunchSurface, 'none')
  assert.equal(capabilities.sections.every(({ mode }) => mode === 'unavailable'), true)
})

test('keeps administrative and assistant profiles outside encounter and communication writes', () => {
  for (const profileId of [SoschainProfessionalDemoProfileIds.MedicalSecretary, SoschainProfessionalDemoProfileIds.Receptionist, SoschainProfessionalDemoProfileIds.VeterinaryAssistant]) {
    const capabilities = resolveProfessionalDemoCapabilities(profileId)
    assert.equal(capabilities.communicationLaunchSurface, 'none')
    assert.equal(capabilities.sections.some(({ mode }) => mode === 'manage-encounter'), false)
  }
})

test('limits public-safety profiles to the documented emergency projection', () => {
  for (const profileId of [SoschainProfessionalDemoProfileIds.Firefighter, SoschainProfessionalDemoProfileIds.PoliceOfficer, SoschainProfessionalDemoProfileIds.Lifeguard]) {
    const capabilities = resolveProfessionalDemoCapabilities(profileId)
    assert.equal(capabilities.healthScope, 'emergency-minimum')
    assert.equal(capabilities.canRequestBreakGlass, false)
    assert.equal(capabilities.clinicalWriteScope, 'none')
  }
})
