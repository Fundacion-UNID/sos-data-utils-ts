// Flow contract: the multichannel roadmap accounts for every IPS CapabilityStatement resource without calling planned conversion or forms implemented.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  IPS_AND_MULTICHANNEL_RESOURCE_COVERAGE,
  IPS_CAPABILITY_RESOURCE_COVERAGE,
  IPS_REFERENCE_URLS,
  IpsAllSectionsExampleResourceType,
  IpsCapabilityResourceType,
  IpsImplementationStatus,
  MultichannelSupportResourceType,
  getIpsResourceCoverage,
} from '../dist/ips-resource-coverage.js';

test('tracks every unique IPS capability resource and its official source pages', () => {
  assert.equal(IPS_CAPABILITY_RESOURCE_COVERAGE.length, Object.keys(IpsCapabilityResourceType).length);
  assert.equal(new Set(IPS_CAPABILITY_RESOURCE_COVERAGE.map(entry => entry.resourceType)).size, Object.keys(IpsCapabilityResourceType).length);
  assert.match(IPS_REFERENCE_URLS.CapabilityStatement, /CapabilityStatement-ips-server/);
  assert.match(IPS_REFERENCE_URLS.AllSectionsExample, /bundle-ips-all-sections/);
  const exampleResources = IPS_CAPABILITY_RESOURCE_COVERAGE.filter(entry => entry.ipsAllSectionsExample);
  assert.equal(exampleResources.length, Object.keys(IpsAllSectionsExampleResourceType).length);
  assert.deepEqual(
    new Set(exampleResources.map(entry => entry.resourceType)),
    new Set(Object.values(IpsAllSectionsExampleResourceType)),
  );
});

test('distinguishes available channel forms from planned conversion and support work', () => {
  assert.equal(getIpsResourceCoverage(IpsCapabilityResourceType.Observation)?.multichannelJsonSchema, IpsImplementationStatus.Available);
  assert.equal(getIpsResourceCoverage(IpsCapabilityResourceType.Practitioner)?.fhirConversion, IpsImplementationStatus.Planned);
  assert.equal(getIpsResourceCoverage(IpsCapabilityResourceType.Organization)?.fhirConversion, IpsImplementationStatus.Available);
  assert.equal(getIpsResourceCoverage(IpsCapabilityResourceType.PractitionerRole)?.fhirConversion, IpsImplementationStatus.Available);
  assert.equal(getIpsResourceCoverage(MultichannelSupportResourceType.Location)?.fhirConversion, IpsImplementationStatus.Available);
});

test('tracks Schedule and Slot data readiness without claiming multichannel UI readiness', () => {
  assert.equal(getIpsResourceCoverage(MultichannelSupportResourceType.Task)?.multichannelJsonSchema, IpsImplementationStatus.Available);
  assert.equal(getIpsResourceCoverage(MultichannelSupportResourceType.Schedule)?.flatClaims, IpsImplementationStatus.Available);
  assert.equal(getIpsResourceCoverage(MultichannelSupportResourceType.Schedule)?.fhirConversion, IpsImplementationStatus.Available);
  assert.equal(getIpsResourceCoverage(MultichannelSupportResourceType.Schedule)?.multichannelJsonSchema, IpsImplementationStatus.Deferred);
  assert.equal(getIpsResourceCoverage(MultichannelSupportResourceType.Slot)?.flatClaims, IpsImplementationStatus.Available);
  assert.equal(getIpsResourceCoverage(MultichannelSupportResourceType.Slot)?.fhirConversion, IpsImplementationStatus.Available);
  assert.equal(getIpsResourceCoverage(MultichannelSupportResourceType.Slot)?.multichannelJsonSchema, IpsImplementationStatus.Deferred);
  assert.equal(IPS_AND_MULTICHANNEL_RESOURCE_COVERAGE.some(entry => entry.resourceType === MultichannelSupportResourceType.Task), true);
});

test('governs Account as the shared billing target used by multichannel permission sets', () => {
  const billingAccount = getIpsResourceCoverage(MultichannelSupportResourceType.Account);
  assert.equal(billingAccount?.purpose, 'billing');
  assert.equal(billingAccount?.flatClaims, IpsImplementationStatus.Available);
  assert.equal(billingAccount?.multichannelJsonSchema, IpsImplementationStatus.Available);
});
