// Flow contract: shared prompt-audio descriptors are deterministic and live numeric codes are composed only from independently cacheable localized fragments.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PromptAudioCachePolicies,
  buildNumericCodeAudioPlan,
  canonicalizePublicPromptAudioDescriptor,
} from '../dist/prompt-audio.js';

const PUBLIC_PROMPT = Object.freeze({
  promptId: 'verification.instructions',
  locale: 'en-CA',
  text: '  Press   one to continue. ',
  voiceProfile: 'accessible-neutral',
  speakingRate: 0.9,
  synthesisEngine: 'reviewed-provider',
  engineModel: 'multilingual-v2',
  pronunciationVersion: '1',
  audioCodec: 'audio/mpeg;rate=44100',
  cachePolicy: PromptAudioCachePolicies.PublicStatic,
});

test('canonicalizes every cache-changing field and normalizes only prompt whitespace', () => {
  const canonical = canonicalizePublicPromptAudioDescriptor(PUBLIC_PROMPT);

  assert.equal(canonical, canonicalizePublicPromptAudioDescriptor({ ...PUBLIC_PROMPT }));
  assert.match(canonical, /Press one to continue\./);
  assert.doesNotMatch(canonical, /Press   one/);
  assert.notEqual(
    canonical,
    canonicalizePublicPromptAudioDescriptor({ ...PUBLIC_PROMPT, pronunciationVersion: '2' }),
  );
});

test('rejects sensitive, empty or incomplete descriptors before they reach shared storage', () => {
  assert.throws(
    () => canonicalizePublicPromptAudioDescriptor({
      ...PUBLIC_PROMPT,
      cachePolicy: PromptAudioCachePolicies.SensitiveDynamic,
    }),
    /prompt_audio_public_static_required/,
  );
  assert.throws(
    () => canonicalizePublicPromptAudioDescriptor({ ...PUBLIC_PROMPT, text: ' ' }),
    /prompt_audio_text_required/,
  );
});

test('splits an OTP into localized digit fragments without creating a cacheable complete code', () => {
  const code = '481927';
  const plan = buildNumericCodeAudioPlan({
    code,
    locale: 'es-ES',
    prefixPromptId: 'activation.code.prefix',
    prefixText: 'Su código de activación es.',
    pauseAfterDigitMs: 450,
  });

  assert.equal(plan.fragments[0].promptId, 'activation.code.prefix');
  assert.deepEqual(
    plan.fragments.slice(1).map((fragment) => fragment.text),
    ['cuatro', 'ocho', 'uno', 'nueve', 'dos', 'siete'],
  );
  assert.ok(plan.fragments.every((fragment) => fragment.cachePolicy === PromptAudioCachePolicies.PublicStatic));
  assert.ok(plan.fragments.every((fragment) => fragment.text !== code));
  assert.ok(plan.fragments.every((fragment) => !fragment.promptId.includes(code)));
  assert.equal(plan.pauseAfterDigitMs, 450);
});

test('rejects unsupported locales and malformed numeric codes', () => {
  assert.throws(
    () => buildNumericCodeAudioPlan({
      code: '12A4',
      locale: 'en-CA',
      prefixPromptId: 'verification.code.prefix',
      prefixText: 'Your verification code is.',
    }),
    /numeric_code_invalid/,
  );
  assert.throws(
    () => buildNumericCodeAudioPlan({
      code: '1234',
      locale: 'und',
      prefixPromptId: 'verification.code.prefix',
      prefixText: 'Verification code.',
    }),
    /numeric_code_locale_unsupported/,
  );
});
