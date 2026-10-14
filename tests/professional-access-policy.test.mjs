// Flow contract: an active, unexpired professional grant authorizes only an exact role and an ISO jurisdiction it covers; a country grant includes its subdivisions, while a subdivision grant never broadens to its country or sibling subdivisions.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateProfessionalAccess,
  jurisdictionGrantCovers,
} from '../dist/professional-access-policy.js';

test('a country permission covers that country and every ISO 3166-2 subdivision', () => {
  assert.equal(jurisdictionGrantCovers('CA', 'CA'), true);
  assert.equal(jurisdictionGrantCovers('ca', 'CA-BC'), true);
  assert.equal(jurisdictionGrantCovers('CA', 'CA-ON'), true);
  assert.equal(jurisdictionGrantCovers('CA', 'US-WA'), false);
});

test('a subdivision permission covers only the exact subdivision', () => {
  assert.equal(jurisdictionGrantCovers('CA-BC', 'CA-BC'), true);
  assert.equal(jurisdictionGrantCovers('CA-BC', 'CA'), false);
  assert.equal(jurisdictionGrantCovers('CA-BC', 'CA-ON'), false);
});

test('fails closed for malformed or empty jurisdiction values', () => {
  for (const value of ['', 'CAN', 'CA_', 'CA-', 'CA/BC']) {
    assert.equal(jurisdictionGrantCovers(value, 'CA-BC'), false);
    assert.equal(jurisdictionGrantCovers('CA', value), false);
  }
});

test('requires active status, exact role, covered jurisdiction and an unexpired grant', () => {
  const grant = {
    status: 'active',
    roles: ['veterinarian'],
    jurisdictions: ['CA'],
    expiresAt: '2027-01-01T00:00:00.000Z',
  };

  assert.deepEqual(evaluateProfessionalAccess(grant, {
    role: 'Veterinarian',
    jurisdiction: 'CA-BC',
    now: '2026-09-20T00:00:00.000Z',
  }), { authorized: true, reason: 'authorized' });
  assert.deepEqual(evaluateProfessionalAccess(grant, {
    role: 'police-officer',
    jurisdiction: 'CA-BC',
    now: '2026-09-20T00:00:00.000Z',
  }), { authorized: false, reason: 'role_not_granted' });
  assert.deepEqual(evaluateProfessionalAccess(grant, {
    role: 'veterinarian',
    jurisdiction: 'US-WA',
    now: '2026-09-20T00:00:00.000Z',
  }), { authorized: false, reason: 'jurisdiction_not_granted' });
  assert.deepEqual(evaluateProfessionalAccess(grant, {
    role: 'veterinarian',
    jurisdiction: 'CA-BC',
    now: '2027-01-01T00:00:00.000Z',
  }), { authorized: false, reason: 'grant_expired' });
  assert.deepEqual(evaluateProfessionalAccess({ ...grant, status: 'inactive' }, {
    role: 'veterinarian',
    jurisdiction: 'CA-BC',
    now: '2026-09-20T00:00:00.000Z',
  }), { authorized: false, reason: 'grant_inactive' });
});
