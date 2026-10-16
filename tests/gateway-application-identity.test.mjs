// Flow contract: 1) a portal supplies its stable public URL; 2) the shared data utility derives the canonical reverse-DNS GW AppId and version headers; 3) an already-canonical identifier remains unchanged; 4) empty or insecure public URLs fail closed.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildGatewayApplicationHeaders,
  normalizeGatewayApplicationId,
} from '../dist/gateway-application-identity.js'

test('normalizes a public portal URL to the shared reverse-DNS gateway identity', () => {
  assert.equal(normalizeGatewayApplicationId('https://example.invalid/path'), 'invalid.example')
  assert.deepEqual(buildGatewayApplicationHeaders({
    appId: 'https://example.invalid',
    appVersion: 'v0.1.2',
  }), { AppId: 'invalid.example', AppVersion: 'v0.1.2' })
  assert.equal(normalizeGatewayApplicationId('org.example.sos.professional'), 'org.example.sos.professional')
})

test('rejects an empty identity and insecure remote application URL', () => {
  assert.throws(() => normalizeGatewayApplicationId(''), /gateway_application_id_invalid/)
  assert.throws(() => normalizeGatewayApplicationId('http://example.invalid'), /gateway_application_url_insecure/)
})
