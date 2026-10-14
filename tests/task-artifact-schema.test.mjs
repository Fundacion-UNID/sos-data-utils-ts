// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TaskArtifactSchema,
  TaskClaim,
  TaskStatus,
} from '../dist/task-artifact-schema.js';

test('shared Task authoring uses mandatory FHIR workflow claims', () => {
  assert.equal(TaskArtifactSchema.resourceType, 'Task');
  assert.deepEqual(TaskArtifactSchema.requiredClaims, [
    TaskClaim.Status,
    TaskClaim.Intent,
  ]);
  assert.ok(TaskArtifactSchema.optionalClaims.includes(TaskClaim.Identifier));
  assert.ok(TaskArtifactSchema.optionalClaims.includes(TaskClaim.GroupIdentifier));
  assert.ok(TaskArtifactSchema.optionalClaims.includes(TaskClaim.Requester));
  assert.ok(TaskArtifactSchema.optionalClaims.includes(TaskClaim.OutputValueReference));
});

test('shared Task statuses cover the standard responder triage lifecycle', () => {
  assert.deepEqual(TaskStatus, {
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
  });
});
