// Flow contract: 1) Personal, Professional and Expo project the same authorized conversation entries into one IMessage-compatible shape; 2) text, FHIR documents, calendar files, audio and call audit events retain typed metadata; 3) ordering and sender direction never grant authority. Authorization invariant: this projection renders only host-authorized materialized data. Persistence invariant: it creates no second chat store.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SubjectConversationContentKind,
  SubjectConversationDirection,
  projectSubjectConversationChatMessages,
} from '../dist/subject-conversation-chat.js'

const sender = { id: 'PractitionerRole/clinician-1', name: 'Clinic team' }

test('projects every supported conversation content kind into one IMessage-compatible model', () => {
  const messages = projectSubjectConversationChatMessages([
    { id: 'text-1', createdAt: '2026-11-06T10:00:00.000Z', direction: SubjectConversationDirection.Incoming, sender, content: { kind: SubjectConversationContentKind.Text, text: 'Vaccination confirmed.' } },
    { id: 'bundle-1', createdAt: '2026-11-06T10:01:00.000Z', direction: SubjectConversationDirection.Incoming, sender, content: { kind: SubjectConversationContentKind.FhirDocument, label: 'Vaccination Bundle', bundle: { resourceType: 'Bundle', type: 'document' } } },
    { id: 'calendar-1', createdAt: '2026-11-06T10:02:00.000Z', direction: SubjectConversationDirection.Incoming, sender, content: { kind: SubjectConversationContentKind.Calendar, label: 'appointment.ics', uri: 'data:text/calendar,BEGIN:VCALENDAR' } },
    { id: 'audio-1', createdAt: '2026-11-06T10:03:00.000Z', direction: SubjectConversationDirection.Outgoing, sender: { id: 'Patient/self', name: 'Me' }, content: { kind: SubjectConversationContentKind.Audio, label: 'Voice message', uri: 'blob:voice', mediaType: 'audio/webm', durationSeconds: 12 } },
    { id: 'call-1', createdAt: '2026-11-06T10:04:00.000Z', direction: SubjectConversationDirection.Incoming, sender, content: { kind: SubjectConversationContentKind.Call, media: 'video', state: 'missed', label: 'Missed video call' } },
    { id: 'index-1', createdAt: '2026-11-06T10:05:00.000Z', direction: SubjectConversationDirection.System, sender, content: { kind: SubjectConversationContentKind.SubjectIndexUpdate, organizationReference: 'Organization/clinic-1', serviceReference: 'Service/records', serviceName: 'Vaccination records', authoritativeSystem: 'ehr', references: [{ label: 'Vaccination record', href: 'https://portal.example/record/1' }] } },
  ])

  assert.deepEqual(messages.map(message => message._id), ['index-1', 'call-1', 'audio-1', 'calendar-1', 'bundle-1', 'text-1'])
  assert.equal(messages[0].system, true)
  assert.equal(messages[0].subjectConversation.content.kind, SubjectConversationContentKind.SubjectIndexUpdate)
  assert.equal(messages[0].text, 'Vaccination records')
  assert.equal(messages[1].subjectConversation.content.kind, SubjectConversationContentKind.Call)
  assert.equal(messages[2].user._id, 'Patient/self')
  assert.equal(messages[2].audio, 'blob:voice')
  assert.equal(messages[2].duration, 12)
  assert.deepEqual(messages[3].file, { uri: 'data:text/calendar,BEGIN:VCALENDAR', name: 'appointment.ics', mimeType: 'text/calendar' })
  assert.equal(messages[3].subjectConversation.content.label, 'appointment.ics')
  assert.equal(messages[4].subjectConversation.content.bundle.resourceType, 'Bundle')
  assert.equal(messages[5].text, 'Vaccination confirmed.')
})

test('rejects malformed timestamps and duplicate message ids before rendering', () => {
  assert.throws(() => projectSubjectConversationChatMessages([
    { id: 'duplicate', createdAt: 'invalid', direction: SubjectConversationDirection.Incoming, sender, content: { kind: SubjectConversationContentKind.Text, text: 'One' } },
  ]), /subject_conversation_created_at_invalid/u)
  assert.throws(() => projectSubjectConversationChatMessages([
    { id: 'duplicate', createdAt: '2026-11-06T10:00:00.000Z', direction: SubjectConversationDirection.Incoming, sender, content: { kind: SubjectConversationContentKind.Text, text: 'One' } },
    { id: 'duplicate', createdAt: '2026-11-06T10:01:00.000Z', direction: SubjectConversationDirection.Incoming, sender, content: { kind: SubjectConversationContentKind.Text, text: 'Two' } },
  ]), /subject_conversation_id_duplicate/u)
})
