// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
import { Content } from 'gdc-common-utils-ts/utils/content'
import { canonicalizeFhirResource } from 'gdc-common-utils-ts/utils/fhir-cid'
import { deflateRaw } from 'pako'
import {
  canonicalClinicalSubjectReference,
  clinicalArtifactFhirR4FromEditorClaims,
  clinicalArtifactFhirR4ToFlat,
  clinicalArtifactSubjectClaims,
  type FhirIpsClinicalArtifactType,
} from 'fhir-data-utils-ts'

type JsonRecord = Record<string, unknown>

export const SoschainSmartHealthCardQrPrefix = 'shc:/' as const
export const SoschainSmartHealthCardMaxSingleQrLength = 1195
export const SoschainSmartHealthCardMaxQrChunkBodyLength = 1191

export type SoschainSmartHealthCardPayload = Readonly<{
  iss: string
  nbf: number
  vc: Readonly<{
    type: readonly string[]
    credentialSubject: Readonly<{
      fhirVersion: string
      fhirBundle: JsonRecord
    }>
  }>
}>

export type UnsignedSoschainClinicalDocumentHealthCard = Readonly<{
  compactJws: string
  payload: SoschainSmartHealthCardPayload
  qrValues: readonly string[]
  signature: Readonly<{ status: 'not-verified'; reason: 'demo-unsigned' }>
}>

export type UnsignedSoschainClinicalDocumentHealthCardOptions = Readonly<{
  issuer: string
  kid: string
  notBefore: number
}>

const CLINICAL_RESOURCE_TYPES = new Set([
  'AllergyIntolerance',
  'Condition',
  'Immunization',
  'MedicationStatement',
  'Observation',
  'Procedure',
])

/**
 * Creates the unsigned SHC used only by explicit Demo surfaces.
 * Test Network and production callers must sign the returned JWS input through
 * their authoritative issuer rather than presenting this value as verified.
 */
export function createUnsignedSoschainClinicalDocumentHealthCard(
  bundleInput: unknown,
  options: UnsignedSoschainClinicalDocumentHealthCardOptions,
): UnsignedSoschainClinicalDocumentHealthCard {
  const issuer = required(options.issuer, 'shc_issuer_required')
  if (!issuer.startsWith('https://') || issuer.endsWith('/')) throw new TypeError('shc_issuer_https_without_trailing_slash_required')
  const kid = required(options.kid, 'shc_kid_required')
  if (!Number.isInteger(options.notBefore) || options.notBefore < 0) throw new TypeError('shc_not_before_seconds_required')

  const { bundle, immunizationOnly } = healthCardBundle(bundleInput, options.notBefore)
  const payload = Object.freeze({
    iss: issuer,
    nbf: options.notBefore,
    vc: Object.freeze({
      type: Object.freeze([
        'https://smarthealth.cards#health-card',
        ...(immunizationOnly ? ['https://smarthealth.cards#immunization'] : []),
      ]),
      credentialSubject: Object.freeze({
        fhirVersion: '4.0.1',
        fhirBundle: minimizeFhirBundleForSmartHealthCard(bundle),
      }),
    }),
  }) satisfies SoschainSmartHealthCardPayload
  const protectedHeader = { alg: 'ES256', zip: 'DEF', kid }
  const encodedHeader = Content.objectToRawBase64UrlSafe(protectedHeader)
  const canonicalPayload = canonicalizeFhirResource(payload, { stripMetaVersionId: false })
  const encodedPayload = Content.bytesToRawBase64UrlSafe(deflateRaw(Content.stringToBytesUTF8(canonicalPayload)))
  const compactJws = `${encodedHeader}.${encodedPayload}.`
  return Object.freeze({
    compactJws,
    payload: JSON.parse(canonicalPayload) as SoschainSmartHealthCardPayload,
    qrValues: encodeSoschainSmartHealthCardQr(compactJws),
    signature: Object.freeze({ status: 'not-verified', reason: 'demo-unsigned' }),
  })
}

/** Encodes one compact SHC JWS into one or more standard numeric QR payloads. */
export function encodeSoschainSmartHealthCardQr(compactJws: string): readonly string[] {
  const jws = required(compactJws, 'shc_compact_jws_required')
  if (jws.length <= SoschainSmartHealthCardMaxSingleQrLength) {
    return Object.freeze([`${SoschainSmartHealthCardQrPrefix}${encodeNumericBody(jws)}`])
  }
  const chunkCount = Math.ceil(jws.length / SoschainSmartHealthCardMaxQrChunkBodyLength)
  const chunkLength = Math.ceil(jws.length / chunkCount)
  return Object.freeze(Array.from({ length: chunkCount }, (_, index) => {
    const chunk = jws.slice(index * chunkLength, (index + 1) * chunkLength)
    return `${SoschainSmartHealthCardQrPrefix}${index + 1}/${chunkCount}/${encodeNumericBody(chunk)}`
  }))
}

/** Reassembles standard SHC QR payloads regardless of scan order. */
export function decodeSoschainSmartHealthCardQr(qrValues: readonly string[]): string {
  if (!Array.isArray(qrValues) || qrValues.length === 0) throw new TypeError('shc_qr_required')
  if (qrValues.length === 1 && /^shc:\/\d+$/.test(qrValues[0])) {
    return decodeNumericBody(qrValues[0].slice(SoschainSmartHealthCardQrPrefix.length))
  }
  const chunks = qrValues.map(value => {
    const match = /^shc:\/(\d+)\/(\d+)\/(\d+)$/.exec(value)
    if (!match) throw new TypeError('shc_qr_chunk_invalid')
    return { index: Number(match[1]), count: Number(match[2]), value: decodeNumericBody(match[3]) }
  })
  const expectedCount = chunks[0].count
  if (expectedCount !== chunks.length
    || chunks.some(chunk => chunk.count !== expectedCount || chunk.index < 1 || chunk.index > expectedCount)
    || new Set(chunks.map(chunk => chunk.index)).size !== expectedCount) {
    throw new TypeError('shc_qr_chunk_set_invalid')
  }
  return [...chunks].sort((left, right) => left.index - right.index).map(chunk => chunk.value).join('')
}

function healthCardBundle(input: unknown, notBefore: number): Readonly<{ bundle: JsonRecord; immunizationOnly: boolean }> {
  const source = record(input)
  if (source?.resourceType !== 'Bundle' || !Array.isArray(source.entry)) throw new TypeError('shc_clinical_document_bundle_required')
  const sourceComposition = source.entry.map(entry => record(record(entry)?.resource))
    .find(resource => resource?.resourceType === 'Composition')
  const subjectReference = required(record(sourceComposition?.subject)?.reference, 'shc_clinical_document_subject_required')
  const authorReference = required(record(Array.isArray(sourceComposition?.author) ? sourceComposition.author[0] : undefined)?.reference, 'shc_clinical_document_author_required')
  const governedSubjectIdentifier = canonicalClinicalSubjectReference(subjectReference)
  const clinicalEntries = source.entry.flatMap((rawEntry, index) => {
    const resource = record(record(rawEntry)?.resource)
    const resourceType = String(resource?.resourceType || '')
    if (!resource || !CLINICAL_RESOURCE_TYPES.has(resourceType)) return []
    const claims = record(record(resource.meta)?.claims) ?? clinicalArtifactFhirR4ToFlat(resource as never)
    const id = typeof resource.id === 'string' && resource.id.trim() ? resource.id.trim() : `clinical-${index + 1}`
    const editorClaims = { ...claims }
    delete editorClaims[`${resourceType}.subject`]
    delete editorClaims[`${resourceType}.patient`]
    const native = clinicalArtifactFhirR4FromEditorClaims(
      resourceType as FhirIpsClinicalArtifactType,
      editorClaims,
      clinicalArtifactSubjectClaims(resourceType as FhirIpsClinicalArtifactType, governedSubjectIdentifier),
    )
    const linked = { ...native, id } as JsonRecord
    if ('subject' in linked) linked.subject = { reference: subjectReference }
    if ('patient' in linked) linked.patient = { reference: subjectReference }
    return [{ fullUrl: `${resourceType}/${id}`, resource: linked }]
  })
  if (!clinicalEntries.length) throw new TypeError('shc_clinical_resource_required')

  const patientId = subjectReference.split('/').at(-1) || governedSubjectIdentifier
  const bundle: JsonRecord = {
    resourceType: 'Bundle',
    type: 'document',
    entry: [
      {
        fullUrl: 'Composition/clinical-document-health-card',
        resource: {
          resourceType: 'Composition',
          id: 'clinical-document-health-card',
          status: 'final',
          type: { coding: [{ system: 'http://loinc.org', code: '60591-5' }] },
          subject: { reference: subjectReference },
          date: new Date(notBefore * 1_000).toISOString(),
          author: [{ reference: authorReference }],
          title: 'Clinical document health card',
          section: [{
            title: 'Clinical records',
            entry: clinicalEntries.map(entry => ({ reference: entry.fullUrl })),
          }],
        },
      },
      { fullUrl: subjectReference, resource: { resourceType: 'Patient', id: patientId } },
      ...clinicalEntries,
    ],
  }
  return { bundle, immunizationOnly: clinicalEntries.every(entry => entry.resource.resourceType === 'Immunization') }
}

function minimizeFhirBundleForSmartHealthCard(input: JsonRecord): JsonRecord {
  const references = collectBundleReferences(input)
  const minimized = minimizeValue(input, references, true) as JsonRecord
  const entries = Array.isArray(minimized.entry) ? minimized.entry : []
  minimized.entry = entries.map((entry, index) => record(entry) ? { ...record(entry), fullUrl: `resource:${index}` } : entry)
  return JSON.parse(canonicalizeFhirResource(minimized, {
    stripMetaVersionId: true,
    stripNarrativeText: true,
    stripNestedElementIds: true,
  })) as JsonRecord
}

function collectBundleReferences(bundle: JsonRecord): ReadonlyMap<string, string> {
  const references = new Map<string, string>()
  const entries = Array.isArray(bundle.entry) ? bundle.entry : []
  entries.forEach((entry, index) => {
    const resource = record(record(entry)?.resource)
    if (!resource) return
    const shortReference = `resource:${index}`
    const fullUrl = record(entry)?.fullUrl
    if (typeof fullUrl === 'string') references.set(fullUrl, shortReference)
    if (typeof resource.resourceType === 'string' && typeof resource.id === 'string') {
      references.set(`${resource.resourceType}/${resource.id}`, shortReference)
    }
  })
  return references
}

function minimizeValue(value: unknown, references: ReadonlyMap<string, string>, resourceRoot = false): unknown {
  if (Array.isArray(value)) return value.map(item => minimizeValue(item, references))
  const source = record(value)
  if (!source) return value
  const output: JsonRecord = {}
  const isResource = resourceRoot || typeof source.resourceType === 'string'
  const isCoding = typeof source.system === 'string' && typeof source.code === 'string'
  const isCodeableConcept = Array.isArray(source.coding)
  for (const [key, child] of Object.entries(source)) {
    if (isResource && (key === 'id' || key === 'text')) continue
    if (isResource && key === 'meta') {
      const meta = record(child)
      if (meta && Array.isArray(meta.security)) output.meta = { security: minimizeValue(meta.security, references) }
      continue
    }
    if (isCoding && key === 'display') continue
    if (isCodeableConcept && key === 'text') continue
    if (key === 'reference' && typeof child === 'string' && references.has(child)) {
      output.reference = references.get(child)
      continue
    }
    output[key] = minimizeValue(child, references)
  }
  return output
}

function encodeNumericBody(value: string): string {
  return [...value].map(character => {
    const encoded = character.charCodeAt(0) - 45
    if (encoded < 0 || encoded > 99) throw new TypeError('shc_jws_character_invalid')
    return encoded.toString().padStart(2, '0')
  }).join('')
}

function decodeNumericBody(value: string): string {
  if (!value || value.length % 2 !== 0 || !/^\d+$/.test(value)) throw new TypeError('shc_qr_numeric_body_invalid')
  let decoded = ''
  for (let index = 0; index < value.length; index += 2) {
    const pair = Number(value.slice(index, index + 2))
    if (pair > 77) throw new TypeError('shc_qr_numeric_pair_invalid')
    decoded += String.fromCharCode(pair + 45)
  }
  return decoded
}

function required(value: unknown, errorCode: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(errorCode)
  return value.trim()
}

function record(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : undefined
}
