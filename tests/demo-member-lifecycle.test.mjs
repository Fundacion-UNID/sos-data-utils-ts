// Flow contract: a resettable Demo invitation remains subject-scoped, idempotent and actor-bounded across invite, acceptance, suspension, reactivation and revocation.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SoschainDemoMemberActions,
  SoschainDemoMemberRoles,
  createSoschainDemoMemberInvitation,
  transitionSoschainDemoMemberInvitation,
} from '../dist/demo-member-lifecycle.js'
import { SoschainPersonalDemoSubjectIds } from '../dist/portal-demo-fixtures.js'

const base = Object.freeze({
  id: 'demo-invitation-id',
  workspaceOwnerUid: 'demo-owner-uid',
  subjectId: SoschainPersonalDemoSubjectIds.Partner,
  inviteeEmailHash: 'a'.repeat(64),
  inviteeEmailHint: 'j***@example.invalid',
  role: SoschainDemoMemberRoles.Caregiver,
  now: '2026-10-27T12:00:00.000Z',
  expiresAt: '2026-10-28T12:00:00.000Z',
})

test('creates one pending invitation without implying controller authority', () => {
  const invitation = createSoschainDemoMemberInvitation(base)
  assert.equal(invitation.status, 'pending')
  assert.equal(invitation.access, 'delegated-read')
  assert.equal(invitation.controller, false)
  assert.equal(Object.isFrozen(invitation), true)
})

test('lets only the intended invitee accept and the workspace owner control lifecycle', () => {
  const pending = createSoschainDemoMemberInvitation(base)
  assert.throws(() => transitionSoschainDemoMemberInvitation(pending, {
    action: SoschainDemoMemberActions.Accept,
    actorUid: 'different-account',
    actorEmailHash: 'b'.repeat(64),
    now: '2026-10-27T12:05:00.000Z',
  }), /invitee_required/u)

  const active = transitionSoschainDemoMemberInvitation(pending, {
    action: SoschainDemoMemberActions.Accept,
    actorUid: 'demo-invitee-uid',
    actorEmailHash: base.inviteeEmailHash,
    now: '2026-10-27T12:05:00.000Z',
  })
  assert.equal(active.status, 'active')
  assert.equal(active.memberUid, 'demo-invitee-uid')
  assert.equal(transitionSoschainDemoMemberInvitation(active, {
    action: SoschainDemoMemberActions.Accept,
    actorUid: 'demo-invitee-uid',
    actorEmailHash: base.inviteeEmailHash,
    now: '2026-10-27T12:06:00.000Z',
  }), active)

  const suspended = transitionSoschainDemoMemberInvitation(active, {
    action: SoschainDemoMemberActions.Suspend,
    actorUid: base.workspaceOwnerUid,
    now: '2026-10-27T12:10:00.000Z',
  })
  assert.equal(suspended.status, 'suspended')

  const reactivated = transitionSoschainDemoMemberInvitation(suspended, {
    action: SoschainDemoMemberActions.Reactivate,
    actorUid: base.workspaceOwnerUid,
    now: '2026-10-27T12:15:00.000Z',
  })
  assert.equal(reactivated.status, 'active')

  const revoked = transitionSoschainDemoMemberInvitation(reactivated, {
    action: SoschainDemoMemberActions.Revoke,
    actorUid: base.workspaceOwnerUid,
    now: '2026-10-27T12:20:00.000Z',
  })
  assert.equal(revoked.status, 'revoked')
  assert.throws(() => transitionSoschainDemoMemberInvitation(revoked, {
    action: SoschainDemoMemberActions.Reactivate,
    actorUid: base.workspaceOwnerUid,
    now: '2026-10-27T12:25:00.000Z',
  }), /terminal/u)
})

test('projects emergency contacts without health access and rejects expired acceptance', () => {
  const emergencyContact = createSoschainDemoMemberInvitation({
    ...base,
    role: SoschainDemoMemberRoles.EmergencyContact,
  })
  assert.equal(emergencyContact.access, 'emergency-contact')
  assert.equal(emergencyContact.controller, false)
  assert.throws(() => transitionSoschainDemoMemberInvitation(emergencyContact, {
    action: SoschainDemoMemberActions.Accept,
    actorUid: 'demo-invitee-uid',
    actorEmailHash: base.inviteeEmailHash,
    now: base.expiresAt,
  }), /expired/u)
})
