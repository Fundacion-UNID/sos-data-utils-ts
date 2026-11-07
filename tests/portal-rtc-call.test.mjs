// Flow contract: portal audio/video is authorized by a dedicated RTC provider while invitation, terminal state and optional unanswered audio are canonical Communications; no assistant or RTC signaling data enters this payload.
import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizePortalRtcCallEvent, PortalRtcCallState } from '../dist/portal-rtc-call.js'

const event = { version: 1, callId: 'call-1', threadId: 'thread-1', subjectIdentifier: 'did:web:subject.example', professionalGroupReference: 'Group/clinic-1', callerActorIdentifier: 'did:web:professional.example', recipientActorIdentifier: 'did:web:controller.example', media: ['audio', 'video'], state: PortalRtcCallState.Missed, occurredAt: '2026-11-07T12:00:00.000Z', unansweredAudio: { uri: 'urn:uuid:audio-1', mediaType: 'audio/webm', durationSeconds: 12 } }

test('normalizes the Communication call event without RTC or assistant fields', () => {
  assert.deepEqual(normalizePortalRtcCallEvent(event), event)
  assert.equal(JSON.stringify(event).match(/token|sdp|ice|assistant|chat/iu), null)
})
test('accepts unanswered audio only for a missed call and rejects invalid media', () => {
  assert.throws(() => normalizePortalRtcCallEvent({ ...event, state: PortalRtcCallState.Completed }), /unanswered_audio_requires_missed/u)
  assert.throws(() => normalizePortalRtcCallEvent({ ...event, media: ['screen'] }), /media_invalid/u)
})
