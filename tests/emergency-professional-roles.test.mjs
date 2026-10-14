// Flow contract: every SOS/VET/UHC channel resolves shared public-health and transport occupations to one governed ISCO-08 claim; product policy separately decides access.
// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EmergencyProfessionalRoleIds,
  EmergencyProfessionalRoles,
  getEmergencyProfessionalRole,
} from '../dist/emergency-professional-roles.js';

test('the shared emergency and transport catalog exposes canonical ISCO-08 claims', () => {
  for (const roleId of Object.values(EmergencyProfessionalRoleIds)) {
    const role = getEmergencyProfessionalRole(roleId);
    assert.equal(role, EmergencyProfessionalRoles[roleId]);
    assert.match(role.claim, /^ISCO-08\|\d{4}$/);
    assert.equal(role.code, role.claim.slice('ISCO-08|'.length));
    assert.ok(role.titleEn.length > 0);
    assert.equal(role.i18nKey, `org.ilo.isco-08.${role.code}`);
  }
});

test('unknown product labels never become occupation claims', () => {
  assert.equal(getEmergencyProfessionalRole('unknown-role'), undefined);
});

test('airline cabin and ground staff remain distinct governed occupations', () => {
  assert.equal(
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.FlightAttendant].claim,
    'ISCO-08|5111',
  );
  assert.equal(
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.AirlineGroundClerk].claim,
    'ISCO-08|4221',
  );
});

test('insurance employees use the governed ISCO-08 finance and insurance clerk occupation', () => {
  assert.equal(
    EmergencyProfessionalRoles[EmergencyProfessionalRoleIds.InsuranceClerk].claim,
    'ISCO-08|4312',
  );
});
