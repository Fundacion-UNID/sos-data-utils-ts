// Flow contract: a verified operational Organization keeps its own source sector; it may only request a governed target data channel, and neither the sector mapping nor a role grants subject access without product SMART and Consent policy.
// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CrossSectorOperationalSectors,
  CrossSectorTargetChannels,
  canOperationalSectorRequestChannel,
  operationalSectorTargetChannels,
} from '../dist/cross-sector-access-policy.js';

test('passenger transport, public health and legacy public safety may request governed animal and human health channels', () => {
  for (const sourceSector of [
    CrossSectorOperationalSectors.PassengerTransport,
    CrossSectorOperationalSectors.PublicHealth,
    CrossSectorOperationalSectors.PublicSafety,
  ]) {
    assert.deepEqual(operationalSectorTargetChannels(sourceSector), [
      CrossSectorTargetChannels.AnimalCare,
      CrossSectorTargetChannels.HealthCare,
    ]);
    assert.equal(
      canOperationalSectorRequestChannel(sourceSector, CrossSectorTargetChannels.AnimalCare),
      true,
    );
    assert.equal(
      canOperationalSectorRequestChannel(sourceSector, CrossSectorTargetChannels.HealthCare),
      true,
    );
  }
});

test('unknown source sectors and non-health target sectors fail closed', () => {
  assert.deepEqual(operationalSectorTargetChannels('unknown-sector'), []);
  assert.equal(canOperationalSectorRequestChannel('passenger-transport', 'animal-transport'), false);
  assert.equal(canOperationalSectorRequestChannel('animal-care', 'animal-care'), false);
});
