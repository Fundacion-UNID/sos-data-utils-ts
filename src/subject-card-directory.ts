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
  provider: 'vetchain'
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
    if (input.provider !== 'vetchain') throw new TypeError('Animal cards must be provided by VetChain.')
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
