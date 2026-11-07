/**
 * Runtime composition profile for the canonical Confidential Storage port.
 * Demo is data seeding, never a persistence adapter or a second use-case path.
 */
export type ConfidentialStorageRuntime = 'all-local' | 'expo' | 'browser-offline' | 'test-network' | 'network'

export type ConfidentialStorageAdapter =
  | 'memory'
  | 'expo-sqlite'
  | 'indexeddb'
  | 'firestore'
  | 'postgresql'

export function selectConfidentialStorageAdapter(input: Readonly<{
  runtime: ConfidentialStorageRuntime
  configured?: ConfidentialStorageAdapter
}>): ConfidentialStorageAdapter {
  const configured = input.configured
  if (input.runtime === 'all-local') {
    if (configured && configured !== 'memory') throw new Error('all_local_confidential_storage_must_be_memory')
    return 'memory'
  }
  if (input.runtime === 'expo') {
    if (configured && configured !== 'expo-sqlite') throw new Error('expo_confidential_storage_must_be_sqlite')
    return 'expo-sqlite'
  }
  if (input.runtime === 'browser-offline') {
    if (configured && configured !== 'indexeddb') throw new Error('browser_offline_confidential_storage_must_be_indexeddb')
    return 'indexeddb'
  }
  if (!configured || !['firestore', 'postgresql'].includes(configured)) {
    throw new Error('durable_confidential_storage_required')
  }
  return configured
}
