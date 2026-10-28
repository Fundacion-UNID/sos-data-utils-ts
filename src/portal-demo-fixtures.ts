import { FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY, type FhirDemoEmergencyEncounterJourney } from 'fhir-data-utils-ts/data'

import { ANIMAL_CARD_INTEROPERABILITY_EXAMPLES } from './animal-card-interoperability.js'
import { REPOSITORY_SAFE_EXAMPLES } from './repository-privacy.js'

export const SoschainPersonalDemoSubjectIds = Object.freeze({
  Self: 'self',
  Child: 'child',
  Animal: 'animal',
  Partner: 'partner',
} as const)

export type SoschainPersonalDemoSubjectId =
  typeof SoschainPersonalDemoSubjectIds[keyof typeof SoschainPersonalDemoSubjectIds]

export type SoschainDemoSubject = Readonly<{
  id: SoschainPersonalDemoSubjectId
  subjectKind: 'human' | 'animal'
  organizationId: string
  uhcId: string
  cardDid?: string
  cardNumber21: string
  nickname: string
  legalName: string
  birthDate?: string
  birthYear?: number
  gender: 'female' | 'male' | 'other' | 'unknown'
  ncbiTaxonomyId?: string
  speciesCode5?: string
  breedLabel?: string
  relationship: 'ONESELF' | 'RESPRSN' | 'DOMPART'
  access: 'active'
  canManage: boolean
}>

export type SoschainDemoContact = Readonly<{
  contactId: string
  subjectId: SoschainPersonalDemoSubjectId
  label: string
  alternateName: string
  relationshipLabel: string
  role: 'primary-emergency-contact' | 'alternate-emergency-contact'
  primary: boolean
  access: 'controller' | 'emergency-contact' | 'emergency-contact-and-delegated-read'
}>

export type SoschainDemoCommunication = Readonly<{
  id: string
  kind: 'message' | 'appointment'
  category: 'emergency' | 'care'
  title: string
  summary: string
  timestamp: string
  status: string
  direction: 'incoming' | 'system'
  senderLabel: string
}>

export type SoschainPersonalDemoStory = Readonly<{
  authorization: 'controller' | 'delegated-read'
  controllerSubjectIds: readonly SoschainPersonalDemoSubjectId[]
  contacts: readonly SoschainDemoContact[]
  encounter?: FhirDemoEmergencyEncounterJourney
  communications: readonly SoschainDemoCommunication[]
}>

const humanCard = (id: SoschainPersonalDemoSubjectId, input: Omit<SoschainDemoSubject, 'id' | 'subjectKind' | 'uhcId'>): SoschainDemoSubject => Object.freeze({
  id,
  subjectKind: 'human',
  uhcId: `did:web:${REPOSITORY_SAFE_EXAMPLES.domain}:card:uhc:personal:${input.cardNumber21}`,
  ...input,
})

const self = humanCard(SoschainPersonalDemoSubjectIds.Self, {
  organizationId: 'demo-person-alex', cardNumber21: '724000000123456789017', nickname: 'Alex', legalName: 'Alex Doe',
  birthDate: '1984-03-08', gender: 'other', relationship: 'ONESELF', access: 'active', canManage: true,
})
const child = humanCard(SoschainPersonalDemoSubjectIds.Child, {
  organizationId: 'demo-child-riley', cardNumber21: '724000000123456789025', nickname: 'Riley', legalName: 'Riley Doe',
  birthDate: '2015-06-14', gender: 'other', relationship: 'RESPRSN', access: 'active', canManage: true,
})
const animal: SoschainDemoSubject = Object.freeze({
  id: SoschainPersonalDemoSubjectIds.Animal, subjectKind: 'animal', organizationId: 'demo-animal-luna',
  uhcId: ANIMAL_CARD_INTEROPERABILITY_EXAMPLES.Dog.cardDid, cardDid: ANIMAL_CARD_INTEROPERABILITY_EXAMPLES.Dog.cardDid,
  cardNumber21: ANIMAL_CARD_INTEROPERABILITY_EXAMPLES.Dog.cardNumber21, nickname: 'Luna', legalName: 'Luna', birthYear: 2020,
  gender: 'female', ncbiTaxonomyId: ANIMAL_CARD_INTEROPERABILITY_EXAMPLES.Dog.ncbiTaxonomyId, speciesCode5: '00001', breedLabel: 'Mixed breed',
  relationship: 'RESPRSN', access: 'active', canManage: true,
})
const partner = humanCard(SoschainPersonalDemoSubjectIds.Partner, {
  organizationId: 'demo-partner-sam', cardNumber21: '724000000123456789030', nickname: 'Sam', legalName: 'Sam Doe',
  birthDate: '1986-11-22', gender: 'other', relationship: 'DOMPART', access: 'active', canManage: false,
})

export const SOSCHAIN_PERSONAL_DEMO_HOUSEHOLD: readonly SoschainDemoSubject[] = Object.freeze([self, child, animal, partner])

const contact = (
  subject: SoschainDemoSubject,
  relationshipLabel: string,
  role: SoschainDemoContact['role'],
  access: SoschainDemoContact['access'],
): SoschainDemoContact => Object.freeze({
  contactId: `demo-contact-${subject.id}`,
  subjectId: subject.id,
  label: subject.legalName,
  alternateName: subject.nickname,
  relationshipLabel,
  role,
  primary: role === 'primary-emergency-contact',
  access,
})

const selfPrimaryContact = contact(self, 'Partner', 'primary-emergency-contact', 'emergency-contact-and-delegated-read')
const partnerPrimaryContact = contact(partner, 'Partner', 'primary-emergency-contact', 'emergency-contact-and-delegated-read')
const selfParentContact = contact(self, 'Parent', 'primary-emergency-contact', 'controller')
const partnerParentContact = contact(partner, 'Parent', 'alternate-emergency-contact', 'controller')
const selfAnimalContact = contact(self, 'Responsible person', 'primary-emergency-contact', 'controller')
const partnerAnimalContact = contact(partner, 'Responsible person', 'alternate-emergency-contact', 'controller')

const partnerCommunications: readonly SoschainDemoCommunication[] = Object.freeze([
  Object.freeze({ id: 'sam-arrival', kind: 'message', category: 'emergency', title: 'Emergency department arrival', summary: 'Sam has arrived and the encounter is now in progress.', timestamp: FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY.updates[0]!.occurredAt, status: 'Delivered', direction: 'system', senderLabel: 'Emergency department' }),
  Object.freeze({ id: 'sam-triage', kind: 'appointment', category: 'emergency', title: 'Triage status update', summary: 'Triage is complete. Imaging has been requested.', timestamp: FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY.updates[1]!.occurredAt, status: 'Completed', direction: 'system', senderLabel: 'Care team' }),
  Object.freeze({ id: 'sam-fracture', kind: 'message', category: 'care', title: 'Care team update', summary: FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY.updates[2]!.summary, timestamp: FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY.updates[2]!.occurredAt, status: 'Delivered', direction: 'incoming', senderLabel: 'Care team' }),
])

export const SOSCHAIN_PERSONAL_DEMO_STORIES: Readonly<Record<SoschainPersonalDemoSubjectId, SoschainPersonalDemoStory>> = Object.freeze({
  [SoschainPersonalDemoSubjectIds.Self]: Object.freeze({ authorization: 'controller', controllerSubjectIds: Object.freeze([self.id]), contacts: Object.freeze([partnerPrimaryContact]), communications: Object.freeze([]) }),
  [SoschainPersonalDemoSubjectIds.Child]: Object.freeze({ authorization: 'controller', controllerSubjectIds: Object.freeze([self.id, partner.id]), contacts: Object.freeze([selfParentContact, partnerParentContact]), communications: Object.freeze([]) }),
  [SoschainPersonalDemoSubjectIds.Animal]: Object.freeze({ authorization: 'controller', controllerSubjectIds: Object.freeze([self.id, partner.id]), contacts: Object.freeze([selfAnimalContact, partnerAnimalContact]), communications: Object.freeze([]) }),
  [SoschainPersonalDemoSubjectIds.Partner]: Object.freeze({ authorization: 'delegated-read', controllerSubjectIds: Object.freeze([partner.id]), contacts: Object.freeze([selfPrimaryContact]), encounter: FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY, communications: partnerCommunications }),
})

export type SoschainProfessionalDemoFixture = Readonly<{
  cards: readonly Readonly<{ identifier: string; subjectId: SoschainPersonalDemoSubjectId; displayName: string; subjectKind: 'person' | 'animal' }>[]
  humanEmergencySubject: Readonly<{ subjectId: string; subjectKind: 'person'; displayName: string; contacts: readonly SoschainDemoContact[]; encounter: FhirDemoEmergencyEncounterJourney; communications: readonly SoschainDemoCommunication[] }>
  animalEmergencySubject: Readonly<{ subjectId: string; subjectKind: 'animal'; displayName: string; contacts: readonly SoschainDemoContact[] }>
  triageTask: Readonly<{ taskReference: string; serviceRequestReference: string; subjectReference: string; requesterType: string; unassignedOwnerReference: string; assignedOwnerReference: string; authoredAt: string }>
  profileSessionToken: string
}>

export const SOSCHAIN_PROFESSIONAL_DEMO_FIXTURE: SoschainProfessionalDemoFixture = Object.freeze({
  cards: Object.freeze([
    Object.freeze({ identifier: partner.organizationId, subjectId: partner.id, displayName: partner.nickname, subjectKind: 'person' }),
    Object.freeze({ identifier: animal.organizationId, subjectId: animal.id, displayName: animal.nickname, subjectKind: 'animal' }),
  ]),
  humanEmergencySubject: Object.freeze({
    subjectId: FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY.encounter.subject.reference!,
    subjectKind: 'person', displayName: partner.nickname,
    contacts: SOSCHAIN_PERSONAL_DEMO_STORIES[partner.id].contacts,
    encounter: FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY,
    communications: partnerCommunications,
  }),
  animalEmergencySubject: Object.freeze({
    subjectId: `Patient/${animal.organizationId}`, subjectKind: 'animal', displayName: animal.nickname,
    contacts: SOSCHAIN_PERSONAL_DEMO_STORIES[animal.id].contacts,
  }),
  triageTask: Object.freeze({
    taskReference: 'Task/demo-emergency-response', serviceRequestReference: 'ServiceRequest/demo-emergency-response',
    subjectReference: FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY.encounter.subject.reference!, requesterType: 'Lifeguard',
    unassignedOwnerReference: 'Organization/demo-emergency-department', assignedOwnerReference: 'PractitionerRole/demo-responder',
    authoredAt: FHIR_DEMO_ARM_FRACTURE_ENCOUNTER_JOURNEY.updates[0]!.occurredAt,
  }),
  profileSessionToken: 'demo-synthetic-session',
})
