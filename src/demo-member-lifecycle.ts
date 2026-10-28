import type { SoschainPersonalDemoSubjectId } from './portal-demo-fixtures.js'

export const SoschainDemoMemberRoles = Object.freeze({
  FamilyMember: 'family-member',
  Caregiver: 'caregiver',
  EmergencyContact: 'emergency-contact',
} as const)

export type SoschainDemoMemberRole = typeof SoschainDemoMemberRoles[keyof typeof SoschainDemoMemberRoles]
export type SoschainDemoMemberStatus = 'pending' | 'active' | 'suspended' | 'revoked'
export type SoschainDemoMemberAccess = 'member-no-health' | 'delegated-read' | 'emergency-contact'

export const SoschainDemoMemberActions = Object.freeze({
  Accept: 'accept',
  Suspend: 'suspend',
  Reactivate: 'reactivate',
  Revoke: 'revoke',
} as const)

export type SoschainDemoMemberAction = typeof SoschainDemoMemberActions[keyof typeof SoschainDemoMemberActions]

export type SoschainDemoMemberInvitation = Readonly<{
  id: string
  workspaceOwnerUid: string
  subjectId: SoschainPersonalDemoSubjectId
  inviteeEmailHash: string
  inviteeEmailHint: string
  role: SoschainDemoMemberRole
  access: SoschainDemoMemberAccess
  controller: false
  status: SoschainDemoMemberStatus
  memberUid?: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}>

export type CreateSoschainDemoMemberInvitation = Readonly<{
  id: string
  workspaceOwnerUid: string
  subjectId: SoschainPersonalDemoSubjectId
  inviteeEmailHash: string
  inviteeEmailHint: string
  role: SoschainDemoMemberRole
  now: string
  expiresAt: string
}>

export type TransitionSoschainDemoMemberInvitation = Readonly<{
  action: SoschainDemoMemberAction
  actorUid: string
  actorEmailHash?: string
  now: string
}>

const roleAccess: Readonly<Record<SoschainDemoMemberRole, SoschainDemoMemberAccess>> = Object.freeze({
  [SoschainDemoMemberRoles.FamilyMember]: 'member-no-health',
  [SoschainDemoMemberRoles.Caregiver]: 'delegated-read',
  [SoschainDemoMemberRoles.EmergencyContact]: 'emergency-contact',
})

export function createSoschainDemoMemberInvitation(input: CreateSoschainDemoMemberInvitation): SoschainDemoMemberInvitation {
  const createdAt = instant(input.now, 'demo_member_now_invalid')
  const expiresAt = instant(input.expiresAt, 'demo_member_expiry_invalid')
  if (Date.parse(expiresAt) <= Date.parse(createdAt)) throw new Error('demo_member_expiry_invalid')
  const role = demoMemberRole(input.role)
  return Object.freeze({
    id: required(input.id, 'demo_member_id_required'),
    workspaceOwnerUid: required(input.workspaceOwnerUid, 'demo_member_owner_required'),
    subjectId: input.subjectId,
    inviteeEmailHash: emailHash(input.inviteeEmailHash),
    inviteeEmailHint: required(input.inviteeEmailHint, 'demo_member_email_hint_required'),
    role,
    access: roleAccess[role],
    controller: false,
    status: 'pending',
    createdAt,
    updatedAt: createdAt,
    expiresAt,
  })
}

export function transitionSoschainDemoMemberInvitation(
  invitation: SoschainDemoMemberInvitation,
  input: TransitionSoschainDemoMemberInvitation,
): SoschainDemoMemberInvitation {
  const now = instant(input.now, 'demo_member_now_invalid')
  const actorUid = required(input.actorUid, 'demo_member_actor_required')
  if (invitation.status === 'revoked') throw new Error('demo_member_revocation_terminal')

  if (input.action === SoschainDemoMemberActions.Accept) {
    const actorEmailHash = emailHash(input.actorEmailHash || '')
    if (actorEmailHash !== invitation.inviteeEmailHash) throw new Error('demo_member_invitee_required')
    if (invitation.status === 'active' && invitation.memberUid === actorUid) return invitation
    if (invitation.status !== 'pending') throw new Error('demo_member_acceptance_not_pending')
    if (Date.parse(now) >= Date.parse(invitation.expiresAt)) throw new Error('demo_member_invitation_expired')
    return Object.freeze({ ...invitation, status: 'active', memberUid: actorUid, updatedAt: now })
  }

  if (actorUid !== invitation.workspaceOwnerUid) throw new Error('demo_member_owner_required')
  if (input.action === SoschainDemoMemberActions.Suspend) {
    if (invitation.status === 'suspended') return invitation
    if (invitation.status !== 'active') throw new Error('demo_member_suspension_requires_active')
    return Object.freeze({ ...invitation, status: 'suspended', updatedAt: now })
  }
  if (input.action === SoschainDemoMemberActions.Reactivate) {
    if (invitation.status === 'active') return invitation
    if (invitation.status !== 'suspended') throw new Error('demo_member_reactivation_requires_suspended')
    return Object.freeze({ ...invitation, status: 'active', updatedAt: now })
  }
  if (input.action === SoschainDemoMemberActions.Revoke) {
    return Object.freeze({ ...invitation, status: 'revoked', updatedAt: now })
  }
  throw new Error('demo_member_action_invalid')
}

function demoMemberRole(value: unknown): SoschainDemoMemberRole {
  if (Object.values(SoschainDemoMemberRoles).includes(value as SoschainDemoMemberRole)) return value as SoschainDemoMemberRole
  throw new Error('demo_member_role_invalid')
}

function required(value: unknown, code: string): string {
  const normalized = String(value || '').trim()
  if (!normalized) throw new Error(code)
  return normalized
}

function emailHash(value: unknown): string {
  const normalized = String(value || '').trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/u.test(normalized)) throw new Error('demo_member_email_hash_invalid')
  return normalized
}

function instant(value: unknown, code: string): string {
  const normalized = String(value || '').trim()
  const milliseconds = Date.parse(normalized)
  if (!normalized || !Number.isFinite(milliseconds)) throw new Error(code)
  return new Date(milliseconds).toISOString()
}
