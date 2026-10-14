# Multisector jurisdictional identifier types

`sos-data-utils-ts/jurisdictional-identifier-types` defines a compact,
product-neutral identifier-type convention.
It is a data-space profile: it reuses HL7 v2-0203 base meanings without
claiming that each composed value is itself a literal HL7 code.
The product-neutral HL7 catalog and CodeSystem URI are owned by
`fhir-data-utils-ts/hl7-v2-0203-identifier-types`; this package imports them and
adds only the jurisdictional composition and governed data-space extensions.

## Canonical composition

The wire type is:

```text
<base code><ISO jurisdiction>
```

The jurisdiction is an ISO 3166-1 alpha-2 country or an ISO 3166-2
subdivision. Writers uppercase it and insert no separator between the base
code and country. The ISO subdivision retains its hyphen.

```text
NN<CC>         national-person identifier at country scope
NN<CC-SUB>     national-person identifier at subdivision scope
DL<CC>         driving licence at country scope
DL<CC-SUB>     driving licence at subdivision scope
CZ<CC>         citizenship card
JHN<CC-SUB>    jurisdictional health number
HC<CC-SUB>     health card
MB<CC>         insurance member number
SN<CC>         insurance subscriber number
DR<CC>         donor record identifier
PI<CC>         patient identifier
PPN<CC>        passport identifier
PRC<CC>        permanent-resident card
WP<CC>         work permit
SP<CC>         study permit
VS<CC>         visa
VP<CC>         visitor permit
TPR<CC>        temporary permanent-resident document
BN<CC>         Business Number at country/federal scope
BN<CC-SUB>     Business Number at subdivision scope
```

`CC` and `CC-SUB` are placeholders, not an allowlist. The same algorithm
applies to every syntactically valid ISO country or subdivision. Product and
issuer policy may impose additional rules, but the shared compositor does not.

The validator proves the ISO wire grammar. Authoritative country and
subdivision catalogs determine whether a particular code is currently
assigned; syntax alone must not be presented as registry validation.

## HL7 base codes and deliberate normalization

| Data-space base | HL7 v2-0203 source | Meaning |
| --- | --- | --- |
| `NN` | `NNxxx` pattern | National Person Identifier; the data space deliberately replaces the HL7 ISO alpha-3 suffix with ISO alpha-2 or ISO 3166-2. |
| `DL` | `DL` | Driver's license number. |
| `CZ` | `CZ` | Citizenship card. |
| `JHN` | `JHN` | Jurisdictional health number. |
| `HC` | `HC` | Health card number. |
| `MB` | `MB` | Member number. |
| `SN` | `SN` | Subscriber number. |
| `DR` | `DR` | Donor registration number. |
| `PI` | `PI` | Patient internal identifier. |
| `PPN` | `PPN` | Passport number. |
| `PRC` | `PRC` | Permanent Resident Card Number. |
| `WP` | `WP` | Work Permit. |
| `SP` | `SP` | Study Permit. |
| `VS` | `VS` | Visa. `VS` is the sole accepted and emitted base code. |
| `VP` | `VP` | Visitor Permit. |
| `TPR` | `TPR` | Temporary Permanent Resident. The current HL7 display mentions Canada; the generic compositor does not impose a country policy. |
| `BN` | Data-space extension | Business Number scoped by its ISO country or subdivision; it is not presented as an HL7 v2-0203 code. |

Use the official [FHIR Identifier Type ValueSet](https://hl7.org/fhir/valueset-identifier-type.html)
and [HL7 v2-0203 CodeSystem](https://terminology.hl7.org/CodeSystem-v2-0203.html)
to identify standard base meanings. The ValueSet is a selection and is not the
complete v2-0203 CodeSystem.

## External terminology and identifier registries

The HL7 Terminology registries are interoperability inputs, not the canonical
internal naming algorithm:

- https://terminology.hl7.org/en/external_code_systems.html provides metadata
  and endorsed URIs/OIDs for external coded terminologies.
- https://terminology.hl7.org/en/identifiers.html provides NamingSystem
  namespaces used by FHIR `Identifier.system`.

An import adapter may recognize country-specific PPN/passport or DLN/driving-
licence NamingSystems and normalize them to the compact data-space type. An
export adapter may emit that external NamingSystem again. This package does
not need to enumerate those country-by-country mappings: its general rule is
the HL7 base meaning plus the ISO jurisdiction. The optional conversion table
belongs at the FHIR adapter boundary and may evolve independently. The
internal identifier must not change merely because HL7 publishes a new
country-specific NamingSystem alias.

FHIR projection belongs in `fhir-data-utils-ts`. It keeps these dimensions
separate:

```text
Identifier.type    base semantic meaning such as DL, PPN, PRC or JHN
Identifier.system  issuing identifier namespace
Identifier.value   identifier value
```

FHIR token search uses `system|value`; it must not treat the composed type as
the identifier system or join `type|value` as stored business state.

## Multiple identifiers and Schema.org

A person may simultaneously hold identifiers from several jurisdictions. Each
identifier remains one Schema.org `PropertyValue` so its type cannot become
detached from its value:

```ts
const permanentResidentCard = buildJurisdictionalIdentifierPropertyValue({
  baseCode: JurisdictionalIdentifierBaseCode.PermanentResidentCard,
  jurisdiction: countryCode,
  value: identifierValue,
})

const provincialHealthNumber = buildJurisdictionalIdentifierPropertyValue({
  baseCode: JurisdictionalIdentifierBaseCode.JurisdictionalHealthNumber,
  jurisdiction: regionalJurisdictionCode,
  value: healthNumberValue,
})
```

Do not serialize several types and values as unrelated parallel arrays.

## Data-space extensions and compatibility

`BN`, `UUID` and `OID` are governed data-space identifier types; they are not
HL7 v2-0203 codes. `BN` means Business Number, participates in the same
jurisdiction composition (`BN<CC>`, `BN<CC-SUB>`) and must not be coerced to `TAX`.
HL7 `EN` and `TAX` remain distinct organization identifier types. One legal
organization may therefore hold federal and subdivision Business Numbers plus
separate TAX/GST and employer-number identifiers without merging their values.
`UUID` and `OID` remain non-jurisdictional technical types.

Unknown base codes fail closed. A new extension requires a defined meaning,
owner, compatibility mapping and tests; a spelling observed in one source is
not sufficient to create a global code.

Existing identifiers, CIDs, hashes and ledger lookup keys are immutable. A
legacy reverse-DNS or earlier jurisdiction representation must not be
rewritten under the new contract. Consumers adopt this format for new writes
and implement explicit dual-read aliases before migrating historical data.
