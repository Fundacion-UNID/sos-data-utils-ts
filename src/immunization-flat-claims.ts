// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.

import {
  buildFlatClaimResourceEntry,
  linkFlatClaimResourceEntries,
  type FlatClaimResourceEntry,
} from 'fhir-data-utils-ts/flat-claim-resource-graph'
import {
  buildImmunizationReminderTasks,
  ImmunizationReminderChannels,
  type ImmunizationReminderChannel,
} from './immunization-reminder-plan.js'

export type ImmunizationCoding = Readonly<{
  system: string
  code: string
  display?: string
  text?: string
}>

export type ImmunizationFlatInput = Readonly<{
  entryId: string
  identifier?: string
  subjectReference: string
  administrationDate: string
  vaccineCode: ImmunizationCoding
  performerReference?: string
  targetDiseases?: readonly ImmunizationCoding[]
  nextDoseDate?: string
  /** FHIR dateTime when the recommendation was created; required with nextDoseDate. */
  recommendationDate?: string
  reminderChannels?: readonly ImmunizationReminderChannel[]
  medication?: Readonly<{
    entryId: string
    productName: string
    identifiers?: readonly Readonly<{ system: string, value: string }>[]
    manufacturer?: string
    lotNumber?: string
    expirationDate?: string
    barcode?: string
  }>
  attachments?: readonly FlatClaimResourceEntry[]
}>

/** Builds the shared claims-first human/animal immunization resource graph. */
export function buildImmunizationFlatGraph(input: ImmunizationFlatInput): readonly FlatClaimResourceEntry[] {
  const vaccineCode = codingToken(input.vaccineCode)
  const claims: Record<string, string> = {
    'Immunization.status': 'completed',
    'Immunization.patient': required(input.subjectReference, 'immunization_subject_required'),
    'Immunization.date': isoDate(input.administrationDate, 'immunization_date_invalid'),
    'Immunization.vaccine-code': vaccineCode,
  }
  if (input.identifier) claims['Immunization.identifier'] = required(input.identifier, 'immunization_identifier_invalid')
  if (input.vaccineCode.display?.trim()) claims['Immunization.vaccine-code-display'] = input.vaccineCode.display.trim()
  if (input.vaccineCode.text?.trim()) claims['Immunization.vaccine-code-text'] = input.vaccineCode.text.trim()
  if (input.performerReference) claims['Immunization.performer'] = required(input.performerReference, 'immunization_performer_invalid')
  if (input.targetDiseases?.length) {
    claims['Immunization.target-disease'] = input.targetDiseases.map(codingToken).join(',')
    claims['Immunization.target-disease-display'] = input.targetDiseases.map(value => value.display?.trim() ?? '').join(',')
    claims['Immunization.target-disease-text'] = input.targetDiseases.map(value => value.text?.trim() ?? '').join(',')
  }

  const immunization = buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: 'Immunization', claims })
  const children: FlatClaimResourceEntry[] = []
  if (input.medication) children.push(buildMedicationEntry(input.medication))
  if (input.nextDoseDate) {
    const recommendationId = `${input.entryId}-recommendation`
    const recommendation = buildFlatClaimResourceEntry({
      entryId: recommendationId,
      resourceType: 'ImmunizationRecommendation',
      claims: {
        'ImmunizationRecommendation.patient': input.subjectReference,
        'ImmunizationRecommendation.date': isoDate(
          required(input.recommendationDate, 'immunization_recommendation_date_required'),
          'immunization_recommendation_date_invalid',
        ),
        'ImmunizationRecommendation.vaccine-code': vaccineCode,
        'ImmunizationRecommendation.forecast-status': 'http://terminology.hl7.org/CodeSystem/immunization-recommendation-status|due',
        'ImmunizationRecommendation.date-criterion-code': 'http://loinc.org|30980-7',
        'ImmunizationRecommendation.date-criterion-value': isoDate(input.nextDoseDate, 'immunization_next_dose_date_invalid'),
        'ImmunizationRecommendation.supporting-immunization': `Immunization/${input.entryId}`,
      },
    })
    const tasks = buildImmunizationReminderTasks({
      entryIdPrefix: recommendationId,
      recommendationReference: recommendation.reference,
      subjectReference: input.subjectReference,
      coverageEndDate: input.nextDoseDate,
      channelCandidates: input.reminderChannels ?? ImmunizationReminderChannels,
    })
    children.push(recommendation, ...tasks)
  }
  for (const attachment of input.attachments ?? []) {
    if (attachment.resourceType !== 'DocumentReference') throw new TypeError('immunization_attachment_invalid')
    children.push(attachment)
  }
  const graph = [immunization, ...children]
  const linkedToImmunization = children.length
    ? linkFlatClaimResourceEntries(graph, {
        parentEntryId: input.entryId,
        childEntryIds: children.filter(entry => entry.resourceType !== 'Task').map(entry => entry.entryId),
      })
    : graph
  const recommendation = linkedToImmunization.find(entry => entry.resourceType === 'ImmunizationRecommendation')
  const tasks = linkedToImmunization.filter(entry => entry.resourceType === 'Task')
  return recommendation && tasks.length
    ? linkFlatClaimResourceEntries(linkedToImmunization, {
        parentEntryId: recommendation.entryId,
        childEntryIds: tasks.map(entry => entry.entryId),
      })
    : linkedToImmunization
}

function buildMedicationEntry(input: NonNullable<ImmunizationFlatInput['medication']>): FlatClaimResourceEntry {
  const claims: Record<string, string> = {
    'Medication.code': required(input.productName, 'medication_product_required'),
    'Medication.code-text': required(input.productName, 'medication_product_required'),
  }
  if (input.identifiers?.length) claims['Medication.identifier'] = input.identifiers
    .map(({ system, value }) => `${required(system, 'medication_identifier_invalid')}|${required(value, 'medication_identifier_invalid')}`)
    .join(',')
  if (input.manufacturer?.trim()) claims['Medication.manufacturer'] = input.manufacturer.trim()
  if (input.lotNumber?.trim()) claims['Medication.lot-number'] = input.lotNumber.trim()
  if (input.expirationDate) claims['Medication.expiration-date'] = isoDate(input.expirationDate, 'medication_expiration_date_invalid')
  if (input.barcode?.trim()) claims['Medication.serial-number'] = input.barcode.trim()
  return buildFlatClaimResourceEntry({ entryId: input.entryId, resourceType: 'Medication', claims })
}

function codingToken(value: ImmunizationCoding): string {
  return `${required(value.system, 'immunization_coding_system_required')}|${required(value.code, 'immunization_coding_code_required')}`
}

function isoDate(value: string, error: string): string {
  const normalized = required(value, error)
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(normalized) || Number.isNaN(Date.parse(normalized))) throw new TypeError(error)
  return normalized
}

function required(value: unknown, error: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(error)
  return value.trim()
}
