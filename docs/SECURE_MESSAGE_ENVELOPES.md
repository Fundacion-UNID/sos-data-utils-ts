# Secure message envelopes

## Contract

Secure written and audio messages use one versioned binary envelope:

```text
plaintext bytes + protected content type
                 |
                 v
       one AES-256-GCM ciphertext
                 |
                 +-- CEK wrapped for web-device ML-KEM key
                 +-- CEK wrapped for telephone-channel ML-KEM key
                 +-- CEK wrapped for any other current device key
```

`sos-data-utils-ts/secure-message-envelope` defines and validates the persisted
shape. It does not generate keys, encrypt content, authorize a recipient change
or impose a channel workflow.

The envelope uses General JWE-compatible top-level fields (`protected`,
`recipients`, `iv`, `ciphertext`, and `tag`) with the explicit
`multi-recipient-ml-kem-v1` profile. Every recipient has a stable `kid`, the
governed ML-KEM key-management algorithm, and its own protected CEK entry.

## Ownership boundaries

- `sos-sdk-core-ts` derives the shared CEK, encrypts content once, encapsulates
  independently for each ML-KEM public key, opens messages and rewraps the CEK
  when the authorized recipient set changes.
- Node, Expo and browser packages inject only cryptographically secure random
  bytes appropriate to their runtime.
- The calling product owns identity, Consent, retention, media-size and audio-
  duration policy, delivery and authorization to add or remove a recipient.
- Storage persists opaque envelope bytes. It does not need a plaintext service
  key after the final device recipients have been installed.

Text and audio do not have separate cryptographic formats. The protected
content type tells the authorized client how to interpret the decrypted bytes.
An audio duration limit such as 30 or 40 seconds is a product/upload rule, not
part of this cryptographic envelope.

## Recipient lifecycle

A sender may initially address a trusted service recipient when the final
device keys are not yet available. An authorized service can unwrap the CEK,
wrap that same CEK for the user's current device/channel keys, and remove its
own recipient entry. The ciphertext, IV and authentication tag remain exactly
unchanged. A current recipient can use the same operation later to add a new
device without exposing the plaintext to storage.

Removing or adding recipients is not by itself authorization. The caller must
first prove the applicable subject, device, channel and Consent policy.
