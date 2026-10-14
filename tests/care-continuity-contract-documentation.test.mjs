// Flow contract: shared SOS data ownership keeps care journeys, emergency work and governed alerts reusable without assigning product policy or transport to this package.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const contract = readFileSync(new URL('../docs/CARE_CONTINUITY_EMERGENCY_AND_ALERT_CONTRACTS.md', import.meta.url), 'utf8').replace(/\s+/g, ' ')

test('documents the three shared flows and their non-owners', () => {
  assert.match(contract, /Care journey.*Appointment -> Encounter/)
  assert.match(contract, /Resilient emergency request.*ServiceRequest.*independent Task queue/)
  assert.match(contract, /Governed alert campaign.*definitional Group.*evaluated snapshot/)
  assert.match(contract, /legal Organization is the author.*professional attester/s)
  assert.match(contract, /controller\/member reply addresses that Group/s)
  assert.match(contract, /Subscription is an event wake-up mechanism\. It is not a population query/)
  assert.doesNotMatch(contract, /virtualservice-sessionkey/)
})
