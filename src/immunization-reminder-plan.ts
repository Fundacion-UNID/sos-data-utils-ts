// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.

import { buildFlatClaimResourceEntry, type FlatClaimResourceEntry } from 'fhir-data-utils-ts/flat-claim-resource-graph';
import { TaskClaim, TaskIntent, TaskStatus } from './task-artifact-schema.js';

export const ImmunizationReminderChannels = Object.freeze([
  'push',
  'email',
  'sms',
  'whatsapp',
  'telephone',
] as const);

export type ImmunizationReminderChannel = (typeof ImmunizationReminderChannels)[number];

export type ImmunizationReminderPlanInput = Readonly<{
  entryIdPrefix: string;
  recommendationReference: string;
  subjectReference: string;
  coverageEndDate: string;
  /** Ordered delivery candidates; dispatch must filter them by current preferences and Consent. */
  channelCandidates: readonly ImmunizationReminderChannel[];
}>;

export type ImmunizationReminderDispatchState = Readonly<{
  channelCandidates: readonly ImmunizationReminderChannel[];
  attemptedChannels: readonly ImmunizationReminderChannel[];
  enabledPreferences: readonly ImmunizationReminderChannel[];
  consentedChannels: readonly ImmunizationReminderChannel[];
  acknowledged: boolean;
}>;

const OFFSETS = Object.freeze([
  Object.freeze({ suffix: '1m', subtract: subtractOneCalendarMonth }),
  Object.freeze({ suffix: '1w', subtract: (date: Date) => subtractUtcDays(date, 7) }),
  Object.freeze({ suffix: '1d', subtract: (date: Date) => subtractUtcDays(date, 1) }),
]);

/**
 * Builds the three notification Tasks attached to an ImmunizationRecommendation.
 * Task creation is automatic; actual delivery is a separate runtime decision
 * that rechecks channel preference, Consent and prior acknowledgement.
 */
export function buildImmunizationReminderTasks(
  input: ImmunizationReminderPlanInput,
): readonly FlatClaimResourceEntry[] {
  const prefix = required(input.entryIdPrefix, 'immunization_reminder_entry_id_required');
  const recommendation = required(input.recommendationReference, 'immunization_recommendation_reference_required');
  const subject = required(input.subjectReference, 'immunization_reminder_subject_required');
  const coverageEnd = parseIsoDate(input.coverageEndDate);
  const channels = [...new Set(input.channelCandidates)].filter((channel) =>
    ImmunizationReminderChannels.includes(channel));
  if (channels.length === 0) throw new TypeError('immunization_reminder_channels_required');

  return Object.freeze(OFFSETS.map(({ suffix, subtract }) => {
    const entryId = `${prefix}-reminder-${suffix}`;
    return buildFlatClaimResourceEntry({
      entryId,
      resourceType: 'Task',
      claims: {
        [TaskClaim.Identifier]: `urn:uuid:${entryId}`,
        [TaskClaim.GroupIdentifier]: recommendation,
        [TaskClaim.Status]: TaskStatus.Requested,
        [TaskClaim.Intent]: TaskIntent.Order,
        [TaskClaim.Code]: 'immunization-reminder',
        [TaskClaim.For]: subject,
        [TaskClaim.Focus]: recommendation,
        [TaskClaim.BasedOn]: recommendation,
        [TaskClaim.ScheduledAt]: formatIsoDate(subtract(coverageEnd)),
        [TaskClaim.TriggerType]: 'scheduled',
        [TaskClaim.Channel]: channels.join(','),
        [TaskClaim.Attempt]: '0',
        [TaskClaim.MaxAttempts]: String(channels.length),
        [TaskClaim.Confirmed]: 'false',
      },
    });
  }));
}

/**
 * Selects one next delivery channel without bypassing the subject's current
 * preferences or Consent. Acknowledgement ends escalation immediately.
 */
export function selectNextImmunizationReminderChannel(
  state: ImmunizationReminderDispatchState,
): ImmunizationReminderChannel | undefined {
  if (state.acknowledged) return undefined;
  const attempted = new Set(state.attemptedChannels);
  const preferred = new Set(state.enabledPreferences);
  const consented = new Set(state.consentedChannels);
  return state.channelCandidates.find((channel) =>
    ImmunizationReminderChannels.includes(channel)
      && !attempted.has(channel)
      && preferred.has(channel)
      && consented.has(channel));
}

function parseIsoDate(value: string): Date {
  const normalized = required(value, 'immunization_coverage_end_date_invalid');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) throw new TypeError('immunization_coverage_end_date_invalid');
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (formatIsoDate(date) !== normalized) throw new TypeError('immunization_coverage_end_date_invalid');
  return date;
}

function subtractOneCalendarMonth(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const targetMonth = month === 0 ? 11 : month - 1;
  const targetYear = month === 0 ? year - 1 : year;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, targetMonth, Math.min(date.getUTCDate(), lastDay)));
}

function subtractUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 86_400_000);
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function required(value: string, error: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new TypeError(error);
  return normalized;
}
