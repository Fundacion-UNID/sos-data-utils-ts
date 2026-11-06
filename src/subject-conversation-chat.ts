/** Platform-neutral content kinds rendered by the shared web and Expo chat UI. */
export const SubjectConversationContentKind = Object.freeze({
  Text: 'text',
  Audio: 'audio',
  FhirDocument: 'fhir-document',
  Calendar: 'calendar',
  File: 'file',
  Call: 'call',
  SubjectIndexUpdate: 'subject-index-update',
} as const)

export type SubjectConversationContentKind = typeof SubjectConversationContentKind[keyof typeof SubjectConversationContentKind]

export const SubjectConversationDirection = Object.freeze({
  Incoming: 'incoming',
  Outgoing: 'outgoing',
  System: 'system',
} as const)

export type SubjectConversationDirection = typeof SubjectConversationDirection[keyof typeof SubjectConversationDirection]

export const SubjectIndexUpdateConversationEnvelopeType = 'urn:antifraudservices:conversation:subject-index-update:v1' as const

/** Serializes the encrypted text payload persisted as a durable channel Communication. */
export function serializeSubjectIndexUpdateConversationEvent(event: ServiceSubjectIndexUpdate): string {
  return JSON.stringify({ type: SubjectIndexUpdateConversationEnvelopeType, event })
}

/** Parses only the governed versioned envelope; ordinary private text remains ordinary text. */
export function parseSubjectIndexUpdateConversationEvent(value: string): ServiceSubjectIndexUpdate | undefined {
  let parsed: unknown
  try { parsed = JSON.parse(value) } catch { return undefined }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined
  const envelope = parsed as Record<string, unknown>
  if (envelope.type !== SubjectIndexUpdateConversationEnvelopeType || !envelope.event
    || typeof envelope.event !== 'object' || Array.isArray(envelope.event)) return undefined
  const event = envelope.event as ServiceSubjectIndexUpdate
  try {
    return buildServiceSubjectIndexUpdate({
      id: event.id, createdAt: event.createdAt,
      organizationReference: event.content?.organizationReference,
      serviceReference: event.content?.serviceReference,
      serviceName: event.content?.serviceName,
      authoritativeSystem: event.content?.authoritativeSystem,
      references: event.content?.references || [],
    })
  } catch { return undefined }
}

export type SubjectConversationActor = Readonly<{
  id: string
  name: string
  avatar?: string
}>

export type SubjectConversationContent =
  | Readonly<{ kind: 'text'; text: string }>
  | Readonly<{ kind: 'audio'; label: string; uri: string; mediaType: string; durationSeconds?: number }>
  | Readonly<{ kind: 'fhir-document'; label: string; bundle: Readonly<Record<string, unknown>> }>
  | Readonly<{ kind: 'calendar' | 'file'; label: string; uri: string; mediaType?: string }>
  | Readonly<{ kind: 'call'; label: string; media: 'audio' | 'video'; state: 'ringing' | 'received' | 'completed' | 'missed' | 'declined' | 'ended' }>
  | ServiceSubjectIndexUpdate['content']

export type SubjectConversationEntry = Readonly<{
  id: string
  createdAt: string
  direction: SubjectConversationDirection
  sender: SubjectConversationActor
  content: SubjectConversationContent
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
}>

/** Structural subset shared with `@kesha-antonov/react-native-chat` IMessage. */
export type SubjectConversationChatMessage = Readonly<{
  _id: string
  text: string
  createdAt: Date
  user: Readonly<{ _id: string; name: string; avatar?: string }>
  system?: boolean
  sent?: boolean
  received?: boolean
  pending?: boolean
  audio?: string
  duration?: number
  file?: Readonly<{ uri: string; name: string; mimeType?: string }>
  subjectConversation: SubjectConversationEntry
}>

/**
 * Projects already-authorized materialized entries for the shared chat UI.
 * This function performs no search, decryption, persistence or authorization.
 */
export function projectSubjectConversationChatMessages(
  entries: readonly SubjectConversationEntry[],
): readonly SubjectConversationChatMessage[] {
  const ids = new Set<string>()
  const projected = entries.map((entry) => {
    const id = required(entry.id, 'subject_conversation_id_required')
    if (ids.has(id)) throw new TypeError('subject_conversation_id_duplicate')
    ids.add(id)
    const timestamp = Date.parse(entry.createdAt)
    if (!Number.isFinite(timestamp)) throw new TypeError('subject_conversation_created_at_invalid')
    const senderId = required(entry.sender.id, 'subject_conversation_sender_required')
    const senderName = required(entry.sender.name, 'subject_conversation_sender_name_required')
    return Object.freeze({
      _id: id,
      text: entry.content.kind === SubjectConversationContentKind.Text
        ? entry.content.text
        : entry.content.kind === SubjectConversationContentKind.SubjectIndexUpdate
          ? entry.content.serviceName
          : entry.content.label,
      createdAt: new Date(timestamp),
      user: Object.freeze({ _id: senderId, name: senderName, ...(entry.sender.avatar ? { avatar: entry.sender.avatar } : {}) }),
      ...(entry.content.kind === SubjectConversationContentKind.Call || entry.content.kind === SubjectConversationContentKind.SubjectIndexUpdate || entry.direction === SubjectConversationDirection.System ? { system: true } : {}),
      ...(entry.status === 'pending' ? { pending: true } : {}),
      ...(entry.status === 'sent' || entry.status === 'delivered' || entry.status === 'read' ? { sent: true } : {}),
      ...(entry.status === 'delivered' || entry.status === 'read' ? { received: true } : {}),
      ...(entry.content.kind === SubjectConversationContentKind.Audio ? {
        audio: entry.content.uri,
        ...(entry.content.durationSeconds === undefined ? {} : { duration: entry.content.durationSeconds }),
      } : {}),
      ...(entry.content.kind === SubjectConversationContentKind.Calendar || entry.content.kind === SubjectConversationContentKind.File ? {
        file: Object.freeze({ uri: entry.content.uri, name: entry.content.label, ...(entry.content.mediaType ? { mimeType: entry.content.mediaType } : entry.content.kind === SubjectConversationContentKind.Calendar ? { mimeType: 'text/calendar' } : {}) }),
      } : {}),
      subjectConversation: entry,
    }) satisfies SubjectConversationChatMessage
  })
  return Object.freeze(projected.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()))
}

function required(value: string, code: string): string {
  const normalized = String(value || '').trim()
  if (!normalized) throw new TypeError(code)
  return normalized
}
import { buildServiceSubjectIndexUpdate, type ServiceSubjectIndexUpdate } from 'antifraud-data-utils-ts/service-conversation'

