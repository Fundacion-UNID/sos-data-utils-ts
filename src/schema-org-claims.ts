// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.

/**
 * Product-neutral Schema.org flat claims migrated from the frozen GDC v1
 * catalog. New SOS, Vet and UHC code imports this surface instead of adding
 * claims to, or copying literals from, `gdc-*` packages.
 */
export const SchemaOrgOrganizationClaim = Object.freeze({
  AdditionalType: 'org.schema.Organization.additionalType',
  SameAs: 'org.schema.Organization.sameAs',
  AddressCountry: 'org.schema.Organization.address.addressCountry',
  AddressRegion: 'org.schema.Organization.address.addressRegion',
  AddressLocality: 'org.schema.Organization.address.addressLocality',
  PostalCode: 'org.schema.Organization.address.postalCode',
  StreetAddress: 'org.schema.Organization.address.streetAddress',
  IdentifierType: 'org.schema.Organization.identifier.additionalType',
  IdentifierValue: 'org.schema.Organization.identifier.value',
  LegalName: 'org.schema.Organization.legalName',
  Name: 'org.schema.Organization.name',
  AlternateName: 'org.schema.Organization.alternateName',
  TaxId: 'org.schema.Organization.taxID',
  Email: 'org.schema.Organization.email',
  Telephone: 'org.schema.Organization.telephone',
  OwnerAlternateName: 'org.schema.Organization.owner.alternateName',
  OwnerEmail: 'org.schema.Organization.owner.email',
  OwnerTelephone: 'org.schema.Organization.owner.telephone',
  OwnerIdentifierValue: 'org.schema.Organization.owner.identifier.value',
  MemberAlternateName: 'org.schema.Organization.member.alternateName',
  MemberName: 'org.schema.Organization.member.name',
  MemberAdditionalType: 'org.schema.Organization.member.additionalType',
  MemberGivenName: 'org.schema.Organization.member.givenName',
  MemberFamilyName: 'org.schema.Organization.member.familyName',
  MemberBirthDate: 'org.schema.Organization.member.birthDate',
  MemberGender: 'org.schema.Organization.member.gender',
  MemberEmail: 'org.schema.Organization.member.email',
  MemberTelephone: 'org.schema.Organization.member.telephone',
  MemberIdentifierType: 'org.schema.Organization.member.identifier.additionalType',
  MemberIdentifierValue: 'org.schema.Organization.member.identifier.value',
  MemberRole: 'org.schema.Organization.member.role',
  NumberOfEmployees: 'org.schema.Organization.numberOfEmployees.value',
} as const);

export type SchemaOrgOrganizationClaimKey =
  typeof SchemaOrgOrganizationClaim[keyof typeof SchemaOrgOrganizationClaim];

/** Schema.org person/controller claims needed by shared onboarding forms. */
export const SchemaOrgPersonClaim = Object.freeze({
  AdditionalType: 'org.schema.Person.additionalType',
  AlternateName: 'org.schema.Person.alternateName',
  BirthDate: 'org.schema.Person.birthDate',
  Email: 'org.schema.Person.email',
  FamilyName: 'org.schema.Person.familyName',
  Gender: 'org.schema.Person.gender',
  GivenName: 'org.schema.Person.givenName',
  Identifier: 'org.schema.Person.identifier',
  IdentifierType: 'org.schema.Person.identifier.additionalType',
  IdentifierValue: 'org.schema.Person.identifier.value',
  SameAs: 'org.schema.Person.sameAs',
  Name: 'org.schema.Person.name',
  Telephone: 'org.schema.Person.telephone',
} as const);

export type SchemaOrgPersonClaimKey = typeof SchemaOrgPersonClaim[keyof typeof SchemaOrgPersonClaim];

/** Schema.org Action claims used to retain who initiated an onboarding write and when. */
export const SchemaOrgActionClaim = Object.freeze({
  AgentIdentifier: 'org.schema.Action.agent.identifier',
  ParticipantIdentifier: 'org.schema.Action.participant.identifier',
  ProviderIdentifier: 'org.schema.Action.provider.identifier',
  StartTime: 'org.schema.Action.startTime',
} as const);

export type SchemaOrgActionClaimKey = typeof SchemaOrgActionClaim[keyof typeof SchemaOrgActionClaim];

/** Schema.org Service claims used by neutral organization service catalogs. */
export const SchemaOrgServiceClaim = Object.freeze({
  Identifier: 'org.schema.Service.identifier',
  Name: 'org.schema.Service.name',
  Description: 'org.schema.Service.description',
  ServiceType: 'org.schema.Service.serviceType',
  Provider: 'org.schema.Service.provider.identifier',
  Department: 'org.schema.Service.department.identifier',
  AvailableAtOrFrom: 'org.schema.Service.availableAtOrFrom.identifier',
} as const);

export type SchemaOrgServiceClaimKey = typeof SchemaOrgServiceClaim[keyof typeof SchemaOrgServiceClaim];
