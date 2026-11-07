const identifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

export const DemoWorkspaceNetworks = Object.freeze({
  Demo: 'demo',
  TestNetwork: 'test-network',
} as const)

export type DemoWorkspaceNetwork =
  typeof DemoWorkspaceNetworks[keyof typeof DemoWorkspaceNetworks]

export type DemoWorkspaceScope = Readonly<{
  deployment: 'test' | 'staging'
  network: DemoWorkspaceNetwork
  portalFamily: string
  tenantId: string
  key: string
}>

/**
 * Builds the non-production storage boundary shared by Demo portal BFFs and
 * channel services. The scope is isolation metadata only; it never proves an
 * actor, role, subject relationship, Consent or professional capability.
 */
export function buildDemoWorkspaceScope(input: Readonly<{
  deployment: unknown
  network: unknown
  portalFamily: unknown
  tenantId: unknown
}>): DemoWorkspaceScope {
  const deployment = identifier(input.deployment, 'deployment')
  if (deployment === 'production') throw new Error('demo_workspace_production_forbidden')
  if (deployment !== 'test' && deployment !== 'staging') {
    throw new Error('demo_workspace_deployment_invalid')
  }
  const network = identifier(input.network, 'network')
  if (network !== DemoWorkspaceNetworks.Demo && network !== DemoWorkspaceNetworks.TestNetwork) {
    throw new Error('demo_workspace_network_invalid')
  }
  const portalFamily = identifier(input.portalFamily, 'portal_family')
  const tenantId = identifier(input.tenantId, 'tenant')
  if (tenantId !== `demo-${portalFamily}`) throw new Error('demo_workspace_tenant_mismatch')
  return Object.freeze({
    deployment,
    network,
    portalFamily,
    tenantId,
    key: `${deployment}/${network}/${portalFamily}/${tenantId}`,
  })
}

/** Firestore/Vault-safe namespace derived from one validated Demo scope. */
export function demoWorkspaceStorageNamespace(scope: DemoWorkspaceScope): string {
  const validated = buildDemoWorkspaceScope(scope)
  return `demo-v1__${validated.deployment}__${validated.network}__${validated.portalFamily}__${validated.tenantId}`
}

function identifier(value: unknown, field: string): string {
  const normalized = String(value || '').trim().toLowerCase()
  if (!identifierPattern.test(normalized) || normalized.length > 64) {
    throw new Error(`demo_workspace_${field}_invalid`)
  }
  return normalized
}
