/** Product-neutral flat Task claim paths used by SOS, Vet and UHC. */
export const TaskClaim = Object.freeze({
  Id: 'Task.id', Identifier: 'Task.identifier', GroupIdentifier: 'Task.group-identifier',
  Status: 'Task.status', StatusReason: 'Task.status-reason', BusinessStatus: 'Task.business-status',
  Intent: 'Task.intent', Code: 'Task.code', Description: 'Task.description', Subject: 'Task.subject',
  For: 'Task.for', Requester: 'Task.requester', Owner: 'Task.owner', Focus: 'Task.focus',
  PartOf: 'Task.part-of', BasedOn: 'Task.based-on', BasedOnDisplay: 'Task.based-on-display',
  Language: 'Task.language', Channel: 'Task.channel', AuthoredOn: 'Task.authored-on',
  LastModified: 'Task.last-modified', ScheduledAt: 'Task.scheduled-at',
  RetryIntervalMinutes: 'Task.retry-interval-minutes', MaxAttempts: 'Task.max-attempts',
  TriggerType: 'Task.trigger-type', Attempt: 'Task.attempt', WindowStart: 'Task.window-start',
  WindowEnd: 'Task.window-end', AutoCloseAt: 'Task.auto-close-at',
  EscalationRecipient: 'Task.escalation-recipient', Confirmed: 'Task.confirmed',
  ConfirmedAt: 'Task.confirmed-at', Repetitions: 'Task.repetitions', DaysOfWeek: 'Task.days-of-week',
  RepeatCount: 'Task.repeat-count', RepeatDurationValue: 'Task.repeat-duration-value',
  RepeatDurationUnit: 'Task.repeat-duration-unit', Modified: 'Task.modified', Priority: 'Task.priority',
  RestrictionPeriodStart: 'Task.restriction-period-start', RestrictionPeriodEnd: 'Task.restriction-period-end',
  ExecutionPeriodStart: 'Task.execution-period-start', ExecutionPeriodEnd: 'Task.execution-period-end',
  OutputType: 'Task.output-type', OutputValueReference: 'Task.output-value-reference',
  OutputValueString: 'Task.output-value-string', UserSelected: 'Task.user-selected',
} as const);

/** FHIR Task status values currently emitted or accepted by shared workflows. */
export const TaskStatus = Object.freeze({
  Draft: 'draft',
  Requested: 'requested',
  Received: 'received',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Ready: 'ready',
  Cancelled: 'cancelled',
  InProgress: 'in-progress',
  OnHold: 'on-hold',
  Failed: 'failed',
  Completed: 'completed',
  EnteredInError: 'entered-in-error',
} as const);

/** FHIR Task intent values currently emitted or accepted by shared workflows. */
export const TaskIntent = Object.freeze({
  Proposal: 'proposal',
  Plan: 'plan',
  Order: 'order',
} as const);

/** Product-neutral authoring contract for flat FHIR-like Task claims. */
export type TaskArtifactSchemaContract = Readonly<{
  resourceType: 'Task';
  requiredClaims: readonly string[];
  optionalClaims: readonly string[];
}>;

/**
 * Shared Task contract used by human, animal, service and asynchronous-job
 * channels. FHIR requires both status and intent; presentation fields remain
 * optional because a machine-created job need not have a display title.
 */
export const TaskArtifactSchema: TaskArtifactSchemaContract = Object.freeze({
  resourceType: 'Task',
  requiredClaims: Object.freeze([
    TaskClaim.Status,
    TaskClaim.Intent,
  ]),
  optionalClaims: Object.freeze([
    TaskClaim.Id,
    TaskClaim.Identifier,
    TaskClaim.GroupIdentifier,
    TaskClaim.StatusReason,
    TaskClaim.BusinessStatus,
    TaskClaim.Code,
    TaskClaim.Description,
    TaskClaim.Subject,
    TaskClaim.For,
    TaskClaim.Requester,
    TaskClaim.Owner,
    TaskClaim.Focus,
    TaskClaim.PartOf,
    TaskClaim.BasedOn,
    TaskClaim.BasedOnDisplay,
    TaskClaim.Language,
    TaskClaim.Channel,
    TaskClaim.AuthoredOn,
    TaskClaim.LastModified,
    TaskClaim.ScheduledAt,
    TaskClaim.RetryIntervalMinutes,
    TaskClaim.MaxAttempts,
    TaskClaim.TriggerType,
    TaskClaim.Attempt,
    TaskClaim.WindowStart,
    TaskClaim.WindowEnd,
    TaskClaim.AutoCloseAt,
    TaskClaim.EscalationRecipient,
    TaskClaim.Confirmed,
    TaskClaim.ConfirmedAt,
    TaskClaim.Repetitions,
    TaskClaim.DaysOfWeek,
    TaskClaim.RepeatCount,
    TaskClaim.RepeatDurationValue,
    TaskClaim.RepeatDurationUnit,
    TaskClaim.Modified,
    TaskClaim.Priority,
    TaskClaim.RestrictionPeriodStart,
    TaskClaim.RestrictionPeriodEnd,
    TaskClaim.ExecutionPeriodStart,
    TaskClaim.ExecutionPeriodEnd,
    TaskClaim.OutputType,
    TaskClaim.OutputValueReference,
    TaskClaim.OutputValueString,
    TaskClaim.UserSelected,
  ]),
});
