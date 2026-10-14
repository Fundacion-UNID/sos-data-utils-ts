// Flow contract: shared organization verification policy varies by sector and ISO country, keeps legal Organization on _transaction, and never confuses verification challenges with DCR activation.
import assert from 'node:assert/strict';
import test from 'node:test';
import * as organizationPolicy from '../dist/organization-verification-policy.js';

const { resolveOrganizationVerificationPolicy } = organizationPolicy;

test('uses official marketplace phone OTP for veterinary organizations in Canada and the US', () => {
  for (const countryCode of ['CA', 'US']) {
    const policy = resolveOrganizationVerificationPolicy({ sector: 'animal-care', countryCode });

    assert.equal(policy.contactProof, 'official-marketplace-phone-otp');
    assert.deepEqual(policy.contactProofAlternatives, [
      ['official-marketplace-phone-otp'],
      ['technical-controller-phone-otp'],
    ]);
    assert.equal(policy.legalAddressProof, 'marketplace-primary-location');
    assert.equal(policy.organizationActivationGate, 'verified-marketplace-or-technical-controller-phone');
    assert.deepEqual(policy.confirmationChannels, ['web', 'telephone']);
    assert.equal(policy.legalOrganizationRoute, 'Organization/_transaction');
    assert.equal(policy.telephoneLegalActivationAllowed, true);
    assert.deepEqual(policy.professionalInvitationOtp, {
      requiredContacts: ['employee-email', 'employee-phone'],
      deliveryChannel: 'employee-email',
      requiresActivatedOrganization: true,
      dcrActivationCodeIsSeparate: true,
    });
  }
});

test('uses authenticated representative email plus a postal numeric code for human health in Canada and the US', () => {
  for (const countryCode of ['CA', 'US']) {
    const policy = resolveOrganizationVerificationPolicy({ sector: 'health-care', countryCode });

    assert.equal(policy.contactProof, 'authenticated-representative-email');
    assert.equal(policy.legalAddressProof, 'postal-numeric-code');
    assert.equal(policy.organizationActivationGate, 'postal-code-bound-to-form-pdf-hash');
    assert.equal(policy.organizationMustRemainInactiveUntilGate, true);
    assert.deepEqual(policy.confirmationChannels, ['web']);
    assert.equal(policy.legalOrganizationRoute, 'Organization/_transaction');
    assert.equal(policy.telephoneLegalActivationAllowed, false);
    assert.deepEqual(policy.professionalInvitationOtp, {
      requiredContacts: ['employee-email', 'employee-phone'],
      deliveryChannel: 'employee-email',
      requiresActivatedOrganization: true,
      dcrActivationCodeIsSeparate: true,
    });
  }
});

test('fails closed for an ungoverned sector or country instead of guessing a postal flow', () => {
  assert.throws(
    () => resolveOrganizationVerificationPolicy({ sector: 'health-care', countryCode: 'ES' }),
    /organization_verification_policy_not_configured/,
  );
  assert.throws(
    () => resolveOrganizationVerificationPolicy({ sector: 'public-safety', countryCode: 'CA' }),
    /organization_verification_policy_not_configured/,
  );
});

test('keeps private deployment hostnames out of the public data package', () => {
  assert.equal('SharedProductionHostnames' in organizationPolicy, false);
});
