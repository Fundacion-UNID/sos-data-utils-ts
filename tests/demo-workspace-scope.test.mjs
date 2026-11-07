// Flow contract: 1) derive a server-owned Demo workspace scope from deployment, network, portal and tenant; 2) keep Demo and Test Network records disjoint; 3) reject production and browser-invented tenant scopes. Authorization invariant: a scope isolates storage but never grants card, subject or professional authority. Persistence invariant: the same governed inputs always produce the same namespace.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DemoWorkspaceNetworks,
  buildDemoWorkspaceScope,
  demoWorkspaceStorageNamespace,
} from '../dist/demo-workspace-scope.js'

test('builds stable and disjoint Demo workspace namespaces', () => {
  const demo = buildDemoWorkspaceScope({
    deployment: 'staging',
    network: DemoWorkspaceNetworks.Demo,
    portalFamily: 'soschain',
    tenantId: 'demo-soschain',
  })
  const testNetwork = buildDemoWorkspaceScope({
    deployment: 'staging',
    network: DemoWorkspaceNetworks.TestNetwork,
    portalFamily: 'soschain',
    tenantId: 'demo-soschain',
  })

  assert.equal(demo.key, 'staging/demo/soschain/demo-soschain')
  assert.equal(demoWorkspaceStorageNamespace(demo), 'demo-v1__staging__demo__soschain__demo-soschain')
  assert.notEqual(demoWorkspaceStorageNamespace(demo), demoWorkspaceStorageNamespace(testNetwork))
  assert.deepEqual(buildDemoWorkspaceScope(demo), demo)
})

test('rejects production, mismatched tenants and ungoverned identifiers', () => {
  assert.throws(() => buildDemoWorkspaceScope({
    deployment: 'production', network: 'demo', portalFamily: 'soschain', tenantId: 'demo-soschain',
  }), /demo_workspace_production_forbidden/u)
  assert.throws(() => buildDemoWorkspaceScope({
    deployment: 'staging', network: 'demo', portalFamily: 'soschain', tenantId: 'demo-vetchain',
  }), /demo_workspace_tenant_mismatch/u)
  assert.throws(() => buildDemoWorkspaceScope({
    deployment: 'staging', network: 'demo', portalFamily: '../soschain', tenantId: 'demo-..',
  }), /demo_workspace_portal_family_invalid/u)
})
