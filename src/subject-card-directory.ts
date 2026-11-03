// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

import { parseAnimalCardDidWeb } from './animal-card-interoperability.js'

export type SubjectCardProvider = 'unid' | 'vetchain'
export type HumanSubjectRelationship = 'self' | 'controller' | 'caregiver' | 'professional'
export type AnimalSubjectRelationship = Exclude<HumanSubjectRelationship, 'self'>
export type CaregiverCompensation =
  | 'unpaid'
  | 'individual-paid'
  | 'family-paid'
  | 'organization-payroll'
  | 'third-party-paid'

export const SUBJECT_CARD_PROVIDER_OPERATIONS = Object.freeze({
  Directory: 'directory',
  Create: 'create',
  Import: 'import',
} as const)

export type SubjectCardProviderOperation =
  typeof SUBJECT_CARD_PROVIDER_OPERATIONS[keyof typeof SUBJECT_CARD_PROVIDER_OPERATIONS]

export type SubjectCardProviderDescriptor = Readonly<{
  /** Stable public identity used for selection; always the sector index DID. */
  providerId: string
  indexProviderDid: string
  displayName: string
  /** Complete public tenant route. It contains no credentials or browser authority. */
  directoryRoute: string
  subjectKinds: readonly ('human' | 'animal')[]
  operations: readonly SubjectCardProviderOperation[]
  /** Public issuer namespace required only when the provider supports creation. */
  providerCode9?: string
  /** Public did:web authority used for cards issued by this index. */
  cardDidHost?: string
}>

type SubjectCardDirectoryEntryBase = Readonly<{
  cardDid: string
  provider: SubjectCardProvider
  displayName: string
  issuerDid?: string
  /** Opaque evidence reference for audit. It is never display or authorization authority. */
  authorizationEvidenceId?: string
  active: boolean
  /** Commercial context only. It never grants access to the subject. */
  caregiverCompensation?: CaregiverCompensation
}>

export type HumanSubjectCardDirectoryEntry = SubjectCardDirectoryEntryBase & Readonly<{
  subjectKind: 'human'
  relationship: HumanSubjectRelationship
}>

export type AnimalSubjectCardDirectoryEntry = SubjectCardDirectoryEntryBase & Readonly<{
  subjectKind: 'animal'
  ncbiTaxonomyId: string
  relationship: AnimalSubjectRelationship
}>

export type SubjectCardDirectoryEntry =
  | HumanSubjectCardDirectoryEntry
  | AnimalSubjectCardDirectoryEntry

export type SubjectCardDirectoryEntryInput =
  | HumanSubjectCardDirectoryEntry
  | AnimalSubjectCardDirectoryEntry

const HUMAN_CARD_DID = /^did:web:[a-z0-9.-]+(?::[a-z0-9._~-]+)*:card:uhc:(personal|professional):[a-z0-9._~-]+(?:-[a-z0-9._~-]+)*$/i
const RELATIONSHIPS = new Set<HumanSubjectRelationship>(['self', 'controller', 'caregiver', 'professional'])
const PROVIDER_OPERATIONS = new Set<SubjectCardProviderOperation>(Object.values(SUBJECT_CARD_PROVIDER_OPERATIONS))

/** Validates one data-space provider advertisement without granting write authority. */
export function createSubjectCardProviderDescriptor(input: Readonly<{
  indexProviderDid: string
  displayName: string
  directoryRoute: string
  subjectKinds: readonly ('human' | 'animal')[]
  operations: readonly SubjectCardProviderOperation[]
  providerCode9?: string
  cardDidHost?: string
}>): SubjectCardProviderDescriptor {
  const indexProviderDid = required(input.indexProviderDid, 'indexProviderDid')
  if (!/^did:[a-z0-9]+:[A-Za-z0-9._:%-]+(?:[:/][A-Za-z0-9._:%/?#=-]+)*$/u.test(indexProviderDid)) {
    throw new TypeError('indexProviderDid must be one public DID.')
  }
  const displayName = required(input.displayName, 'displayName')
  const route = new URL(required(input.directoryRoute, 'directoryRoute'))
  const local = route.hostname === 'localhost' || route.hostname === '127.0.0.1'
  if (route.protocol !== 'https:' && !(route.protocol === 'http:' && local)) {
    throw new TypeError('directoryRoute must use HTTPS outside local development.')
  }
  if (route.username || route.password || route.search || route.hash) {
    throw new TypeError('directoryRoute cannot contain credentials, query parameters or fragments.')
  }
  const segments = route.pathname.split('/').filter(Boolean)
  if (segments.length !== 4 || !segments[1]?.startsWith('cds-') || segments[2] !== 'v1') {
    throw new TypeError('directoryRoute must be one complete canonical tenant route.')
  }
  const subjectKinds = [...new Set(input.subjectKinds)]
  if (subjectKinds.length === 0 || subjectKinds.some(kind => kind !== 'human' && kind !== 'animal')) {
    throw new TypeError('subjectKinds must contain human or animal.')
  }
  const operations = [...new Set(input.operations)]
  if (operations.length === 0 || operations.some(operation => !PROVIDER_OPERATIONS.has(operation))) {
    throw new TypeError('operations must contain a supported provider operation.')
  }
  const providerCode9 = optional(input.providerCode9)
  if (operations.includes(SUBJECT_CARD_PROVIDER_OPERATIONS.Create) && !/^\d{9}$/u.test(providerCode9 || '')) {
    throw new TypeError('providerCode9 must contain exactly nine digits for creation.')
  }
  const cardDidHost = optional(input.cardDidHost)?.toLowerCase()
  if (operations.includes(SUBJECT_CARD_PROVIDER_OPERATIONS.Create) && !cardDidHost) {
    throw new TypeError('cardDidHost is required for creation.')
  }
  if (cardDidHost) {
    const host = new URL(`http://${cardDidHost}`)
    if (host.host !== cardDidHost || host.pathname !== '/' || host.username || host.password || host.search || host.hash) {
      throw new TypeError('cardDidHost must contain one public did:web host.')
    }
  }
  return Object.freeze({
    providerId: indexProviderDid,
    indexProviderDid,
    displayName,
    directoryRoute: route.toString().replace(/\/$/u, ''),
    subjectKinds: Object.freeze(subjectKinds),
    operations: Object.freeze(operations),
    ...(providerCode9 ? { providerCode9 } : {}),
    ...(cardDidHost ? { cardDidHost } : {}),
  })
}

/**
 * Validates one provider-owned directory entry without converting discovery
 * into authorization. Consent, policy and the provider-issued access token
 * remain authoritative for every protected operation.
 */
export function createSubjectCardDirectoryEntry(
  input: SubjectCardDirectoryEntryInput,
): SubjectCardDirectoryEntry {
  const cardDid = required(input.cardDid, 'cardDid')
  const displayName = required(input.displayName, 'displayName')
  const issuerDid = optional(input.issuerDid)
  const authorizationEvidenceId = optional(input.authorizationEvidenceId)
  const relationship = String(input.relationship || '').trim() as HumanSubjectRelationship
  if (!RELATIONSHIPS.has(relationship)) {
    throw new TypeError('relationship must use the final subject relationship vocabulary.')
  }
  if (input.caregiverCompensation && relationship !== 'caregiver') {
    throw new TypeError('caregiverCompensation is valid only for a caregiver relationship.')
  }
  if (input.subjectKind === 'animal') {
    if (relationship === 'self') {
      throw new TypeError('An animal can never have a self relationship with an application user.')
    }
    const animalCard = parseAnimalCardDidWeb(cardDid, input.ncbiTaxonomyId)
    if (!animalCard) throw new TypeError('Animal card DID taxonomy must match ncbiTaxonomyId.')
    return Object.freeze({
      ...input,
      relationship,
      cardDid,
      displayName,
      issuerDid,
      authorizationEvidenceId,
      ncbiTaxonomyId: animalCard.ncbiTaxonomyId,
    })
  }
  if (input.provider !== 'unid' || !HUMAN_CARD_DID.test(cardDid)) {
    throw new TypeError('Human entries require one public UHC card DID provided by UNID.')
  }
  return Object.freeze({ ...input, relationship, cardDid, displayName, issuerDid, authorizationEvidenceId })
}

function required(value: unknown, field: string): string {
  const normalized = String(value ?? '').trim()
  if (!normalized) throw new TypeError(`${field} is required.`)
  return normalized
}

function optional(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim()
  return normalized || undefined
}
