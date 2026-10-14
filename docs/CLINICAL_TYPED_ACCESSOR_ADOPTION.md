# Clinical Typed Accessor Adoption

The neutral FHIR claims and converters already preserve the following clinical
details:

- `AllergyIntolerance.severity` for observed reaction severity;
- `MedicationStatement.effective-period-start/end` for treatment duration;
- `Immunization.route` and `Immunization.site`;
- `Observation.reference-range-text`.

The mutable Bundle getter/setter API is owned by `gdc-common-utils-ts` and is
exposed to Node/BFF applications by `gdc-sdk-node-ts`. It is not copied into
this package. A received Bundle is edited through a detached clone:

```ts
const editableBundle = new BundleReader(receivedBundle).toBundleEditor();
const entry = editableBundle.openEntryByArrayIndex(entryIndex).asAllergy();
const severity = entry.getReactionSeverity();
entry.setReactionSeverity(nextSeverity);
```

## Current adoption decision

Consumers do not need a coordinated release unless they call the new
reader-to-editor API or the four new clinical detail accessors. Existing flows
that do not call them remain compatible.

The shared multichannel schema already includes medication period start/end.
The following optional form fields are intentionally deferred until the next
portal/assistant clinical-editor feature is implemented and tested end to end:

| Operation | Field to add to the shared schema | Channel behavior required |
|---|---|---|
| AllergyIntolerance | `AllergyIntolerance.severity` | distinguish mild, moderate and severe reaction from `criticality` |
| Immunization | `Immunization.route` | select or dictate the coded administration route |
| Immunization | `Immunization.site` | select or dictate the coded administration site |
| Observation | `Observation.reference-range-text` | capture optional human-readable reference range |

These fields must be added once in `MULTICHANNEL_OPERATION_SCHEMAS`; portal,
telephone, WhatsApp and chat channels then render the same schema. Channel YAML
or UI code must not maintain a separate field list.

## Promotion unit

Adoption is one coordinated future release, not independent dependency churn:

1. add the optional fields and executable schema tests in
   `sos-data-utils-ts`;
2. consume exact published shared versions only when an
   orchestration/runtime surface needs them;
3. pin exact versions in each affected consumer and regenerate its lockfile;
4. update only applications that expose the new editor;
5. prove the affected local user journey through every changed boundary;
6. promote through local-network and test-network before staging.

Do not force package updates into unaffected applications. A portal or
assistant adopts this contract when it exposes the corresponding field, not
merely because a lower package published a newer version.

See the neutral owner contract in
`fhir-data-utils-ts/docs/CLINICAL_TYPED_ACCESSOR_BOUNDARY.md`
and the complete mutable accessor index in
[`gdc-common-utils-ts`](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/docs/101-CLINICAL-ENTRY-GETTERS-SETTERS.md).
