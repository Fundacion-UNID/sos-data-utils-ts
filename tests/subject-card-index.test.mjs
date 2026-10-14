// Flow contract: a public 21-digit subject card resolves through one species-bound opaque ledger key without exposing its preimage.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  HUMAN_NCBI_TAXONOMY_ID,
  HUMAN_SPECIES_ID7,
  buildSubjectCardIndexAssetId,
  buildSubjectCardIndexCanonicalNumericId27,
  normalizeSubjectSpeciesId7,
} from '../dist/subject-card-index.js';

const humanCardNumber21 = '724090000123456789016';
const animalCardNumber21 = '724090961510852611267';

test('uses Homo sapiens as the implicit seven-digit species context for human cards', async () => {
  assert.equal(HUMAN_NCBI_TAXONOMY_ID, '9606');
  assert.equal(HUMAN_SPECIES_ID7, '0009606');

  const canonicalNumericId27 = buildSubjectCardIndexCanonicalNumericId27({
    ncbiTaxonomyId: HUMAN_NCBI_TAXONOMY_ID,
    cardNumber21: humanCardNumber21,
  });

  assert.equal(canonicalNumericId27, `0009606${humanCardNumber21.slice(0, 20)}`);
  assert.equal(
    await buildSubjectCardIndexAssetId({
      ncbiTaxonomyId: HUMAN_NCBI_TAXONOMY_ID,
      cardNumber21: humanCardNumber21,
    }),
    createHash('sha3-256').update(canonicalNumericId27, 'ascii').digest('hex'),
  );
});

test('keeps animal species outside the printed card while binding it to the same ledger-key profile', () => {
  assert.equal(normalizeSubjectSpeciesId7('9615'), '0009615');
  assert.equal(normalizeSubjectSpeciesId7('100001'), '0100001');
  assert.equal(buildSubjectCardIndexCanonicalNumericId27({
    ncbiTaxonomyId: '9615',
    cardNumber21: animalCardNumber21,
  }), `0009615${animalCardNumber21.slice(0, 20)}`);
});

test('rejects an invalid card check digit and taxonomy identifiers outside seven digits', () => {
  assert.throws(() => buildSubjectCardIndexCanonicalNumericId27({
    ncbiTaxonomyId: HUMAN_NCBI_TAXONOMY_ID,
    cardNumber21: `${humanCardNumber21.slice(0, -1)}9`,
  }), /check digit/i);
  assert.throws(() => normalizeSubjectSpeciesId7('12345678'), /seven digits/i);
  assert.throws(() => normalizeSubjectSpeciesId7('0'), /positive/i);
});
