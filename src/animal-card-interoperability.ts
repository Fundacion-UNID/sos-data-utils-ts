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

/** Governed non-operational animal-card fixture shared by SOS, Vet and UHC tests. */
export const ANIMAL_CARD_INTEROPERABILITY_EXAMPLES = Object.freeze({
  Dog: Object.freeze({
    cardDid: 'did:web:example.invalid:card:vetchain:72409:0961510852611262',
    cardNumber21: '724090961510852611262',
    ncbiTaxonomyId: '9615',
  }),
})

/** Builds the canonical Schema.org `additionalType` URI for one NCBI TaxId. */
export function buildNcbiTaxonomyUri(ncbiTaxonomyId: string): string {
  return `${NCBI_TAXONOMY_OBO_URI_PREFIX}${normalizeAnimalTaxonomyId(ncbiTaxonomyId)}`
}

/** Reads only the governed OBO form used in subject flat claims. */
export function parseNcbiTaxonomyUri(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const match = value.trim().match(/^http:\/\/purl\.obolibrary\.org\/obo\/NCBITaxon_([1-9]\d{0,6})$/)
  if (!match) return undefined
  try {
    return normalizeAnimalTaxonomyId(match[1])
  } catch {
    return undefined
  }
}

/**
 * Parses the current VetChain DID only with explicit species context.
 *
 * Species is deliberately absent from the DID and printed number. The caller
 * must obtain the NCBI TaxId from the resolved subject's canonical flat claims;
 * this function never guesses it from identifier digits or a display label.
 */
export function parseAnimalCardDidWeb(
  cardDid: string,
  ncbiTaxonomyId?: string,
): AnimalCardIdentity | undefined {
  if (!ncbiTaxonomyId) return undefined
  const match = String(cardDid || '').trim().match(
    /^did:web:([A-Za-z0-9.-]+(?:%3A\d+)?):card:vetchain:(\d{5}):(\d{16})$/i,
  )
  if (!match) return undefined
  try {
    const normalizedTaxonomyId = normalizeAnimalTaxonomyId(ncbiTaxonomyId)
    const speciesId7 = normalizeSubjectSpeciesId7(normalizedTaxonomyId)
    const jurisdictionCode5 = match[2]
    const animalId16 = match[3]
    const animalNumericId15 = animalId16.slice(0, 15)
    const cardNumber21 = `${jurisdictionCode5}${animalId16}`
    const expectedCheckDigit = computeDammCheckDigit(`${speciesId7}${cardNumber21.slice(0, 20)}`)
    if (expectedCheckDigit !== cardNumber21.slice(20)) return undefined
    return Object.freeze({
      subjectKind: 'animal',
      cardDid: String(cardDid).trim(),
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
