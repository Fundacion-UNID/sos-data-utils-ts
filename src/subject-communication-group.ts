import { createHash } from 'node:crypto'

/** Purpose boundaries for subject-owned communication audiences. */
export const SubjectCommunicationAudiencePurpose = Object.freeze({
  EmergencyUpdates: 'emergency-updates',
  CareContinuity: 'care-continuity',
} as const)

export type SubjectCommunicationAudiencePurposeValue =
  typeof SubjectCommunicationAudiencePurpose[keyof typeof SubjectCommunicationAudiencePurpose]

const PURPOSE_GROUP_SEGMENT = Object.freeze({
  [SubjectCommunicationAudiencePurpose.EmergencyUpdates]: 'emergency',
  [SubjectCommunicationAudiencePurpose.CareContinuity]: 'care-continuity',
} satisfies Record<SubjectCommunicationAudiencePurposeValue, string>)

/**
 * Builds the stable opaque FHIR Group reference used by the subject's current
 * controllers and caregivers. The reference identifies a queue/key recipient;
 * membership and access remain independent authorization decisions.
 *
 * @deprecated Use `buildSubjectCommunicationPurposeGroupReference` for new
 * emergency-update or care-continuity audiences. This legacy wire identity is
 * retained unchanged for stored records and compatibility reads.
 */
export function buildSubjectCommunicationGroupReference(subjectDid: string): string {
  const subject = String(subjectDid || '').trim()
  if (!subject) throw new TypeError('subject_group_subject_required')
  return `Group/subject-access-${createHash('sha256').update(subject).digest('hex').slice(0, 32)}`
}

/**
 * Builds a stable, opaque Group reference for one subject and one purpose.
 *
 * The reference is only an addressable audience identity. Membership,
 * relationship, Consent, recipient expansion and delivery remain independent
 * server-side authorization decisions. New identities use SHA3-256 while the
 * legacy helper above preserves its historical SHA-256 wire contract.
 */
export function buildSubjectCommunicationPurposeGroupReference(input: Readonly<{
  subject: string
  purpose: SubjectCommunicationAudiencePurposeValue
}>): `Group/subject-${string}` {
  const subject = String(input.subject || '').trim()
  if (!subject) throw new TypeError('subject_group_subject_required')
  const purposeSegment = PURPOSE_GROUP_SEGMENT[input.purpose]
  if (!purposeSegment) throw new TypeError('subject_group_purpose_invalid')
  const digest = createHash('sha3-256')
    .update(`${input.purpose}\u0000${subject}`)
    .digest('hex')
    .slice(0, 32)
  return `Group/subject-${purposeSegment}-${digest}`
}
