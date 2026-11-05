// Flow contract: SOS consumers create an explicitly unsigned clinical-document SHC through sos-data-utils, preserve a standards-shaped FHIR payload, and round-trip every QR chunk without importing Vet-specific utilities.
import assert from 'node:assert/strict'
import test from 'node:test'
import { FHIR_IPS_ALL_SECTIONS_DEMO_DATA } from 'fhir-data-utils-ts'
import {
  createUnsignedSoschainClinicalDocumentHealthCard,
  decodeSoschainSmartHealthCardQr,
} from '../dist/clinical-document-shc.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

test('creates a scannable unsigned SOSChain clinical-document SHC', () => {
  const credential = createUnsignedSoschainClinicalDocumentHealthCard(
    FHIR_IPS_ALL_SECTIONS_DEMO_DATA.bundle,
    {
      issuer: REPOSITORY_SAFE_EXAMPLES.httpsBaseUrl,
      kid: `${REPOSITORY_SAFE_EXAMPLES.didWeb}#demo-shc`,
      notBefore: REPOSITORY_SAFE_EXAMPLES.organizationScopedResources.slotStartEpochSeconds,
    },
  )

  assert.deepEqual(credential.signature, { status: 'not-verified', reason: 'demo-unsigned' })
  assert.ok(credential.payload.vc.type.some(value => value.endsWith('#health-card')))
  assert.ok(credential.qrValues.every(value => value.startsWith('shc:/')))
  assert.equal(decodeSoschainSmartHealthCardQr(credential.qrValues), credential.compactJws)
  assert.ok(credential.compactJws.endsWith('.'))
})
