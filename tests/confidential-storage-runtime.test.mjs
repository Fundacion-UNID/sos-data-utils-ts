// Flow contract: Demo, Test Network, production web and Expo execute the same use cases through the canonical Confidential Storage port; only the composition root selects its adapter.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  selectConfidentialStorageAdapter,
} from '../dist/confidential-storage-runtime.js'

test('selects the governed adapter without creating a Demo persistence model', () => {
  assert.equal(selectConfidentialStorageAdapter({ runtime: 'all-local' }), 'memory')
  assert.equal(selectConfidentialStorageAdapter({ runtime: 'expo' }), 'expo-sqlite')
  assert.equal(selectConfidentialStorageAdapter({ runtime: 'test-network', configured: 'firestore' }), 'firestore')
  assert.equal(selectConfidentialStorageAdapter({ runtime: 'network', configured: 'postgresql' }), 'postgresql')
})

test('rejects adapters that break environment parity or durable deployments', () => {
  assert.throws(
    () => selectConfidentialStorageAdapter({ runtime: 'network', configured: 'memory' }),
    /durable_confidential_storage_required/,
  )
  assert.throws(
    () => selectConfidentialStorageAdapter({ runtime: 'all-local', configured: 'firestore' }),
    /all_local_confidential_storage_must_be_memory/,
  )
  assert.throws(
    () => selectConfidentialStorageAdapter({ runtime: 'expo', configured: 'memory' }),
    /expo_confidential_storage_must_be_sqlite/,
  )
})
