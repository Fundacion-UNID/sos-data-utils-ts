export const PORTAL_RTC_CALL_CONTENT_TYPE = 'application/vnd.sos.portal-rtc-call+json'

export const PortalRtcCallState = Object.freeze({ Ringing: 'ringing', Received: 'received', Completed: 'completed', Missed: 'missed', Declined: 'declined', Cancelled: 'cancelled' } as const)
export type PortalRtcCallState = typeof PortalRtcCallState[keyof typeof PortalRtcCallState]
export type PortalRtcCallMedia = 'audio' | 'video'

/** Canonical Communication payload; RTC tokens, SDP, ICE and media never enter it. */
export type PortalRtcCallEvent = Readonly<{
  version: 1; callId: string; threadId: string; subjectIdentifier: string
  professionalGroupReference: string; callerActorIdentifier: string; recipientActorIdentifier: string
  media: readonly PortalRtcCallMedia[]; state: PortalRtcCallState; occurredAt: string
  unansweredAudio?: Readonly<{ uri: string; mediaType: string; durationSeconds?: number }>
}>

export function normalizePortalRtcCallEvent(value: unknown): PortalRtcCallEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('portal_rtc_call_event_required')
  const input = value as Record<string, unknown>
  if (input.version !== 1) throw new TypeError('portal_rtc_call_version_invalid')
  const media = Array.isArray(input.media) ? [...new Set(input.media.map(String))] : []
  if (!media.length || media.some(item => item !== 'audio' && item !== 'video')) throw new TypeError('portal_rtc_call_media_invalid')
  const state = required(input.state, 'portal_rtc_call_state_required')
  if (!Object.values(PortalRtcCallState).includes(state as PortalRtcCallState)) throw new TypeError('portal_rtc_call_state_invalid')
  const occurredAt = required(input.occurredAt, 'portal_rtc_call_occurred_at_required')
  if (!Number.isFinite(Date.parse(occurredAt))) throw new TypeError('portal_rtc_call_occurred_at_invalid')
  const unansweredAudio = normalizeAudio(input.unansweredAudio)
  if (unansweredAudio && state !== PortalRtcCallState.Missed) throw new TypeError('portal_rtc_unanswered_audio_requires_missed_call')
  return Object.freeze({ version: 1,
    callId: required(input.callId, 'portal_rtc_call_id_required'), threadId: required(input.threadId, 'portal_rtc_thread_id_required'),
    subjectIdentifier: required(input.subjectIdentifier, 'portal_rtc_subject_required'), professionalGroupReference: required(input.professionalGroupReference, 'portal_rtc_professional_group_required'),
    callerActorIdentifier: required(input.callerActorIdentifier, 'portal_rtc_caller_required'), recipientActorIdentifier: required(input.recipientActorIdentifier, 'portal_rtc_recipient_required'),
    media: Object.freeze(media as PortalRtcCallMedia[]), state: state as PortalRtcCallState, occurredAt, ...(unansweredAudio ? { unansweredAudio } : {}) })
}

function normalizeAudio(value: unknown): PortalRtcCallEvent['unansweredAudio'] {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('portal_rtc_unanswered_audio_invalid')
  const input = value as Record<string, unknown>
  const mediaType = required(input.mediaType, 'portal_rtc_unanswered_audio_media_type_required').toLowerCase()
  if (!mediaType.startsWith('audio/')) throw new TypeError('portal_rtc_unanswered_audio_media_type_invalid')
  const duration = input.durationSeconds === undefined ? undefined : Number(input.durationSeconds)
  if (duration !== undefined && (!Number.isFinite(duration) || duration <= 0 || duration > 40)) throw new TypeError('portal_rtc_unanswered_audio_duration_invalid')
  return Object.freeze({ uri: required(input.uri, 'portal_rtc_unanswered_audio_uri_required'), mediaType, ...(duration === undefined ? {} : { durationSeconds: duration }) })
}
function required(value: unknown, error: string) { const normalized = String(value || '').trim(); if (!normalized) throw new TypeError(error); return normalized }
