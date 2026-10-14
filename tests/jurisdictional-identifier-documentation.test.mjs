// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  HL7_IDENTIFIER_REGISTRY_SOURCES,
  JurisdictionalIdentifierBaseCode,
} from '../dist/jurisdictional-identifier-types.js';

const documentation = readFileSync(new URL('../docs/JURISDICTIONAL_IDENTIFIER_TYPES.md', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const packageBoundary = readFileSync(new URL('../docs/SDK_LAYERING.md', import.meta.url), 'utf8');

test('documents the canonical jurisdictional identifier composition and official registries', () => {
  for (const baseCode of Object.values(JurisdictionalIdentifierBaseCode)) {
    assert.match(documentation, new RegExp(`\\b${baseCode}\\b`));
  }
  assert.match(documentation, /ISO 3166-1 alpha-2/);
  assert.match(documentation, /ISO 3166-2/);
  assert.match(documentation, new RegExp(HL7_IDENTIFIER_REGISTRY_SOURCES.externalCodeSystems.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(documentation, new RegExp(HL7_IDENTIFIER_REGISTRY_SOURCES.externalIdentifierSystems.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(documentation, /BN.*must not be coerced to.*TAX/is);
  assert.match(documentation, /legacy.*must not be\s+rewritten/is);
  assert.match(readme, /JURISDICTIONAL_IDENTIFIER_TYPES\.md/);
  assert.match(packageBoundary, /Cross-sector identifiers/);
});
