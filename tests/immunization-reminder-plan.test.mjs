// Flow contract: a current immunization coverage end creates one recommendation-linked Task at one month, one week and one day before coverage ends; delivery candidates are ordered but dispatch still requires current preferences and Consent.
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildImmunizationReminderTasks, selectNextImmunizationReminderChannel } from '../dist/immunization-reminder-plan.js';

test('builds deterministic 1m, 1w and 1d reminder Tasks from the coverage end date', () => {
  const tasks = buildImmunizationReminderTasks({
    entryIdPrefix: 'rabies-recommendation',
    recommendationReference: 'ImmunizationRecommendation/rabies-recommendation',
    subjectReference: 'Patient/animal-1',
    coverageEndDate: '2027-05-23',
    channelCandidates: ['push', 'email', 'sms', 'whatsapp', 'telephone'],
  });

  assert.deepEqual(tasks.map(({ entryId }) => entryId), [
    'rabies-recommendation-reminder-1m',
    'rabies-recommendation-reminder-1w',
    'rabies-recommendation-reminder-1d',
  ]);
  assert.deepEqual(tasks.map(({ claims }) => claims['Task.scheduled-at']), [
    '2027-04-23',
    '2027-05-16',
    '2027-05-22',
  ]);
  for (const { claims } of tasks) {
    assert.equal(claims['Task.status'], 'requested');
    assert.equal(claims['Task.intent'], 'order');
    assert.equal(claims['Task.focus'], 'ImmunizationRecommendation/rabies-recommendation');
    assert.equal(claims['Task.channel'], 'push,email,sms,whatsapp,telephone');
    assert.equal(claims['Task.confirmed'], 'false');
  }
});

test('clamps the calendar-month reminder and rejects invalid plans', () => {
  const [month] = buildImmunizationReminderTasks({
    entryIdPrefix: 'coverage',
    recommendationReference: 'ImmunizationRecommendation/coverage',
    subjectReference: 'Patient/subject-1',
    coverageEndDate: '2027-03-31',
    channelCandidates: ['email'],
  });
  assert.equal(month.claims['Task.scheduled-at'], '2027-02-28');

  assert.throws(() => buildImmunizationReminderTasks({
    entryIdPrefix: 'coverage',
    recommendationReference: 'ImmunizationRecommendation/coverage',
    subjectReference: 'Patient/subject-1',
    coverageEndDate: 'not-a-date',
    channelCandidates: ['email'],
  }), /immunization_coverage_end_date_invalid/);
  assert.throws(() => buildImmunizationReminderTasks({
    entryIdPrefix: 'coverage',
    recommendationReference: 'ImmunizationRecommendation/coverage',
    subjectReference: 'Patient/subject-1',
    coverageEndDate: '2027-03-31',
    channelCandidates: [],
  }), /immunization_reminder_channels_required/);
});

test('escalates only to an allowed untried channel and stops after acknowledgement', () => {
  const input = {
    channelCandidates: ['push', 'email', 'sms', 'whatsapp', 'telephone'],
    attemptedChannels: ['push'],
    enabledPreferences: ['push', 'email', 'telephone'],
    consentedChannels: ['email', 'sms', 'telephone'],
    acknowledged: false,
  };
  assert.equal(selectNextImmunizationReminderChannel(input), 'email');
  assert.equal(selectNextImmunizationReminderChannel({
    ...input,
    attemptedChannels: ['push', 'email'],
  }), 'telephone');
  assert.equal(selectNextImmunizationReminderChannel({ ...input, acknowledged: true }), undefined);
});
