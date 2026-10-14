export const OrganizationVerificationSectors = Object.freeze([
  'animal-care',
  'health-care',
] as const);

export const OrganizationVerificationCountryCodes = Object.freeze([
  'CA',
  'US',
] as const);

export type OrganizationVerificationSector = (typeof OrganizationVerificationSectors)[number];
export type OrganizationVerificationCountryCode = (typeof OrganizationVerificationCountryCodes)[number];
export type OrganizationVerificationContactProof =
  | 'official-marketplace-phone-otp'
  | 'technical-controller-phone-otp'
  | 'authenticated-representative-email';
export type OrganizationVerificationLegalAddressProof =
  | 'marketplace-primary-location'
  | 'postal-numeric-code';
export type OrganizationVerificationConfirmationChannel = 'web' | 'telephone';
export type OrganizationVerificationActivationGate =
  | 'verified-marketplace-or-technical-controller-phone'
  | 'postal-code-bound-to-form-pdf-hash';
export type ProfessionalInvitationContact = 'employee-email' | 'employee-phone';
export type ProfessionalInvitationOtpPolicy = Readonly<{
  requiredContacts: readonly ProfessionalInvitationContact[];
  deliveryChannel: 'employee-email';
  requiresActivatedOrganization: true;
  dcrActivationCodeIsSeparate: true;
}>;

export type OrganizationVerificationPolicy = Readonly<{
  sector: OrganizationVerificationSector;
  countryCode: OrganizationVerificationCountryCode;
  marketplaceOrganizationRequired: true;
  applicationEvidence: 'immutable-pdf-sha256';
  contactProof: OrganizationVerificationContactProof;
  contactProofAlternatives: readonly (readonly OrganizationVerificationContactProof[])[];
  legalAddressProof: OrganizationVerificationLegalAddressProof;
  organizationActivationGate: OrganizationVerificationActivationGate;
  organizationMustRemainInactiveUntilGate: true;
  confirmationChannels: readonly OrganizationVerificationConfirmationChannel[];
  telephoneLegalActivationAllowed: boolean;
  professionalInvitationOtp: ProfessionalInvitationOtpPolicy;
  legalOrganizationRoute: 'Organization/_transaction';
  orderRule: 'only-when-new-host-offer';
  dcrActivationCodeIsSeparate: true;
}>;

const POLICIES = new Map<string, OrganizationVerificationPolicy>();
const PROFESSIONAL_INVITATION_OTP_POLICY = Object.freeze({
  requiredContacts: Object.freeze(['employee-email', 'employee-phone'] as const),
  deliveryChannel: 'employee-email',
  requiresActivatedOrganization: true,
  dcrActivationCodeIsSeparate: true,
} as const);

for (const countryCode of OrganizationVerificationCountryCodes) {
  POLICIES.set(key('animal-care', countryCode), Object.freeze({
    sector: 'animal-care',
    countryCode,
    marketplaceOrganizationRequired: true,
    applicationEvidence: 'immutable-pdf-sha256',
    contactProof: 'official-marketplace-phone-otp',
    contactProofAlternatives: Object.freeze([
      Object.freeze(['official-marketplace-phone-otp'] as const),
      Object.freeze(['technical-controller-phone-otp'] as const),
    ] as const),
    legalAddressProof: 'marketplace-primary-location',
    organizationActivationGate: 'verified-marketplace-or-technical-controller-phone',
    organizationMustRemainInactiveUntilGate: true,
    confirmationChannels: Object.freeze(['web', 'telephone'] as const),
    telephoneLegalActivationAllowed: true,
    professionalInvitationOtp: PROFESSIONAL_INVITATION_OTP_POLICY,
    legalOrganizationRoute: 'Organization/_transaction',
    orderRule: 'only-when-new-host-offer',
    dcrActivationCodeIsSeparate: true,
  }));
  POLICIES.set(key('health-care', countryCode), Object.freeze({
    sector: 'health-care',
    countryCode,
    marketplaceOrganizationRequired: true,
    applicationEvidence: 'immutable-pdf-sha256',
    contactProof: 'authenticated-representative-email',
    contactProofAlternatives: Object.freeze([
      Object.freeze(['authenticated-representative-email'] as const),
    ] as const),
    legalAddressProof: 'postal-numeric-code',
    organizationActivationGate: 'postal-code-bound-to-form-pdf-hash',
    organizationMustRemainInactiveUntilGate: true,
    confirmationChannels: Object.freeze(['web'] as const),
    telephoneLegalActivationAllowed: false,
    professionalInvitationOtp: PROFESSIONAL_INVITATION_OTP_POLICY,
    legalOrganizationRoute: 'Organization/_transaction',
    orderRule: 'only-when-new-host-offer',
    dcrActivationCodeIsSeparate: true,
  }));
}

/** Resolves explicit sector/country policy and fails closed for ungoverned combinations. */
export function resolveOrganizationVerificationPolicy(input: Readonly<{
  sector: string;
  countryCode: string;
}>): OrganizationVerificationPolicy {
  const policy = POLICIES.get(key(input.sector, input.countryCode));
  if (!policy) throw new Error('organization_verification_policy_not_configured');
  return policy;
}

function key(sector: string, countryCode: string): string {
  return `${String(sector || '').trim().toLowerCase()}|${String(countryCode || '').trim().toUpperCase()}`;
}
