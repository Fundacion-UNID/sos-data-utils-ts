import { computeDammCheckDigit } from 'gdc-common-utils-ts/utils/unified-health-id'

import { SchemaOrgOrganizationClaim } from './schema-org-claims.js'
import { HUMAN_NCBI_TAXONOMY_ID, normalizeSubjectSpeciesId7 } from './subject-card-index.js'

export const NCBI_TAXONOMY_SYSTEM = 'https://www.ncbi.nlm.nih.gov/taxonomy' as const
export const NCBI_TAXONOMY_OBO_URI_PREFIX = 'http://purl.obolibrary.org/obo/NCBITaxon_' as const

export type AnimalCardIdentity = Readonly<{
  subjectKind: 'animal'
  cardDid: string
  cardNumber21: string
  jurisdictionCode5: string
  animalNumericId15: string
  animalId16: string
  ncbiTaxonomyId: string
  speciesId7: string
  species: Readonly<{ system: typeof NCBI_TAXONOMY_SYSTEM; code: string }>
  displayName?: string
}>

export type AnimalCardNumberIdentity = Readonly<{
  cardNumber21: string
  jurisdictionCode5: string
  animalNumericId15: string
  animalId16: string
  ncbiTaxonomyId: string
  speciesId7: string
}>

export type HistoricalAnimalCardMigration = AnimalCardNumberIdentity & Readonly<{
  sourceCardDid: string
  cardDid: string
}>

/** Governed non-operational animal-card fixture shared by SOS, Vet and UHC tests. */
export const ANIMAL_CARD_INTEROPERABILITY_EXAMPLES = Object.freeze({
  Dog: Object.freeze({
    cardDid: 'did:web:example.invalid:card:vetchain:0009615:724090961510852611262',
    cardNumber21: '724090961510852611262',
    ncbiTaxonomyId: '9615',
  }),
})

/** Builds the canonical Schema.org `additionalType` URI for one NCBI TaxId. */
export function buildNcbiTaxonomyUri(ncbiTaxonomyId: string): string {
  return `${NCBI_TAXONOMY_OBO_URI_PREFIX}${normalizeAnimalTaxonomyId(ncbiTaxonomyId)}`
}

/** Reads the governed OBO form, including historical HTTPS/single-value projections. */
export function parseNcbiTaxonomyUri(value: unknown): string | undefined {
  const scalar = Array.isArray(value) && value.length === 1 ? value[0] : value
  if (typeof scalar !== 'string') return undefined
  const match = scalar.trim().match(/^https?:\/\/purl\.obolibrary\.org\/obo\/NCBITaxon_([1-9]\d{0,6})$/i)
  if (!match) return undefined
  try {
    return normalizeAnimalTaxonomyId(match[1])
  } catch {
    return undefined
  }
}

/**
 * Parses the speciesId7 + cardNumber21 DID. The optional external taxonomy
 * claim is cross-checked when present. Split 5+16 paths are invalid.
 */
export function parseAnimalCardDidWeb(
  cardDid: string,
  ncbiTaxonomyId?: string,
): AnimalCardIdentity | undefined {
  const source = String(cardDid || '').trim()
  const current = source.match(
    /^did:web:([A-Za-z0-9.-]+(?:%3A\d+)?):card:vetchain:(\d{7}):(\d{21})$/i,
  )
  if (!current) return undefined
  try {
    const embeddedTaxonomyId = String(Number(current[2]))
    const normalizedTaxonomyId = normalizeAnimalTaxonomyId(ncbiTaxonomyId || embeddedTaxonomyId)
    const speciesId7 = normalizeSubjectSpeciesId7(normalizedTaxonomyId)
    if (current && current[2] !== speciesId7) return undefined
    const cardNumber21 = current[3]
    const jurisdictionCode5 = cardNumber21.slice(0, 5)
    const animalId16 = cardNumber21.slice(5)
    const animalNumericId15 = animalId16.slice(0, 15)
    const expectedCheckDigit = computeDammCheckDigit(`${speciesId7}${cardNumber21.slice(0, 20)}`)
    if (expectedCheckDigit !== cardNumber21.slice(20)) return undefined
    const host = current[1]
    return Object.freeze({
      subjectKind: 'animal',
      cardDid: `did:web:${host}:card:vetchain:${speciesId7}:${cardNumber21}`,
      cardNumber21,
      jurisdictionCode5,
      animalNumericId15,
      animalId16,
      ncbiTaxonomyId: normalizedTaxonomyId,
      speciesId7,
      species: Object.freeze({ system: NCBI_TAXONOMY_SYSTEM, code: normalizedTaxonomyId }),
    })
  } catch {
    return undefined
  }
}

/**
 * Converts the retired jurisdiction5 + animalId16 DID for read compatibility.
 *
 * This is deliberately separate from the canonical parser so historical
 * identifiers cannot be accepted for new writes. The legacy checksum and the
 * explicit animal taxonomy claim must both validate before a species-bound
 * canonical DID is derived.
 */
export function migrateHistoricalAnimalCardDidWeb(
  sourceCardDid: string,
  ncbiTaxonomyId: string,
): HistoricalAnimalCardMigration | undefined {
  const source = String(sourceCardDid || '').trim()
  const historical = source.match(
    /^did:web:([A-Za-z0-9.-]+(?:%3A\d+)?):card:vetchain:(\d{5}):(\d{16})$/i,
  )
  if (!historical) return undefined
  try {
    const normalizedTaxonomyId = normalizeAnimalTaxonomyId(ncbiTaxonomyId)
    const speciesId7 = normalizeSubjectSpeciesId7(normalizedTaxonomyId)
    const jurisdictionCode5 = historical[2]
    const historicalAnimalId16 = historical[3]
    const animalNumericId15 = historicalAnimalId16.slice(0, 15)
    const historicalCheckDigit = historicalAnimalId16.slice(15)
    if (computeDammCheckDigit(`${jurisdictionCode5}${animalNumericId15}`) !== historicalCheckDigit) {
      return undefined
    }
    const cardNumber20 = `${jurisdictionCode5}${animalNumericId15}`
    const currentCheckDigit = computeDammCheckDigit(`${speciesId7}${cardNumber20}`)
    const cardNumber21 = `${cardNumber20}${currentCheckDigit}`
    const animalId16 = `${animalNumericId15}${currentCheckDigit}`
    const cardDid = `did:web:${historical[1]}:card:vetchain:${speciesId7}:${cardNumber21}`
    if (!parseAnimalCardDidWeb(cardDid, normalizedTaxonomyId)) return undefined
    return Object.freeze({
      sourceCardDid: source,
      cardDid,
      cardNumber21,
      jurisdictionCode5,
      animalNumericId15,
      animalId16,
      ncbiTaxonomyId: normalizedTaxonomyId,
      speciesId7,
    })
  } catch {
    return undefined
  }
}

/**
 * Parses the visible 21-digit animal card only with explicit NCBI Taxonomy
 * context. Species is not encoded in the visible number and is never guessed.
 */
export function parseAnimalCardNumber(
  value: string,
  ncbiTaxonomyId: string,
): AnimalCardNumberIdentity | undefined {
  const cardNumber21 = String(value || '').trim().replace(/[ -]/g, '')
  if (!/^\d{21}$/.test(cardNumber21)) return undefined
  try {
    const normalizedTaxonomyId = normalizeAnimalTaxonomyId(ncbiTaxonomyId)
    const speciesId7 = normalizeSubjectSpeciesId7(normalizedTaxonomyId)
    const expectedCheckDigit = computeDammCheckDigit(`${speciesId7}${cardNumber21.slice(0, 20)}`)
    if (expectedCheckDigit !== cardNumber21.slice(20)) return undefined
    const jurisdictionCode5 = cardNumber21.slice(0, 5)
    const animalId16 = cardNumber21.slice(5)
    return Object.freeze({
      cardNumber21,
      jurisdictionCode5,
      animalNumericId15: animalId16.slice(0, 15),
      animalId16,
      ncbiTaxonomyId: normalizedTaxonomyId,
      speciesId7,
    })
  } catch {
    return undefined
  }
}

/**
 * Resolves one SOS-visible animal card from canonical Schema.org flat claims.
 * The returned coding is usable offline; a terminology service may enrich its
 * label later without changing the signed/stored code identity.
 */
export function readAnimalCardFromFlatClaims(
  claims: Readonly<Record<string, unknown>>,
): AnimalCardIdentity | undefined {
  if (claims[SchemaOrgOrganizationClaim.AdditionalType] !== 'animal') return undefined
  const cardDid = scalarString(claims[SchemaOrgOrganizationClaim.SameAs])
  const ncbiTaxonomyId = parseNcbiTaxonomyUri(
    claims[SchemaOrgOrganizationClaim.MemberAdditionalType],
  )
  if (!cardDid || !ncbiTaxonomyId) return undefined
  const parsed = parseAnimalCardDidWeb(cardDid, ncbiTaxonomyId)
  if (!parsed) return undefined
  const displayName = scalarString(
    claims[SchemaOrgOrganizationClaim.AlternateName]
      ?? claims[SchemaOrgOrganizationClaim.LegalName],
  )
  return Object.freeze({ ...parsed, ...(displayName ? { displayName } : {}) })
}

function normalizeAnimalTaxonomyId(value: string): string {
  const source = String(value || '').trim()
  const speciesId7 = normalizeSubjectSpeciesId7(source)
  if (speciesId7 === normalizeSubjectSpeciesId7(HUMAN_NCBI_TAXONOMY_ID)) {
    throw new TypeError('human_taxonomy_is_not_an_animal_card')
  }
  return String(Number(source))
}

function scalarString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized || undefined
}
