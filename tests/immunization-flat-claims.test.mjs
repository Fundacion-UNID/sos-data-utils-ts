// Flow contract: SOS, Vet and UHC create the same claims-first Immunization graph; a human influenza example uses WHO ATC, keeps product text separate and schedules the linked recommendation Tasks.
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildImmunizationFlatGraph } from '../dist/immunization-flat-claims.js';

test('builds a shared human influenza graph with recommendation and reminders', () => {
  const graph = buildImmunizationFlatGraph({
    entryId: 'flu-2026', subjectReference: 'Patient/person-1', administrationDate: '2026-09-20',
    performerReference: 'PractitionerRole/nurse-1',
    vaccineCode: { system: 'http://www.whocc.no/atc', code: 'J07BB02', display: 'influenza, inactivated, split virus or surface antigen' },
    nextDoseDate: '2027-09-20',
    recommendationDate: '2026-09-21T12:00:00.000Z',
    medication: { entryId: 'flu-product-2026', productName: 'free-text regional product' },
  });

  assert.deepEqual(graph.map(({ resourceType }) => resourceType), [
    'Immunization', 'Medication', 'ImmunizationRecommendation', 'Task', 'Task', 'Task',
  ]);
  assert.equal(graph[0].claims['Immunization.vaccine-code'], 'http://www.whocc.no/atc|J07BB02');
  assert.equal(graph[0].claims['Immunization.performer'], 'PractitionerRole/nurse-1');
  assert.equal(graph[1].claims['Medication.code-text'], 'free-text regional product');
  assert.equal(graph[2].claims['ImmunizationRecommendation.date-criterion-value'], '2027-09-20');
  assert.equal(graph[2].claims['ImmunizationRecommendation.date'], '2026-09-21T12:00:00.000Z');
  assert.equal(graph[3].claims['Task.focus'], `ImmunizationRecommendation/${graph[2].entryId}`);
});
