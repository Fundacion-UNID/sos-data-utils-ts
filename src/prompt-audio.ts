/** Cache policies shared by telephone, portal, chat, messaging and ICA calls. */
export const PromptAudioCachePolicies = Object.freeze({
  PublicStatic: 'public-static',
  SensitiveDynamic: 'sensitive-dynamic',
} as const);

export type PromptAudioCachePolicy = typeof PromptAudioCachePolicies[keyof typeof PromptAudioCachePolicies];

/**
 * Complete logical identity of one reviewed, reusable audio prompt.
 *
 * Changing wording, locale, voice, rate, engine, model, pronunciation or
 * codec creates a different immutable cache object. Personalized values must
 * use `sensitive-dynamic` and are rejected by the public-cache canonicalizer.
 */
export interface PublicPromptAudioDescriptor {
  promptId: string;
  locale: string;
  text: string;
  voiceProfile: string;
  speakingRate: number;
  synthesisEngine: string;
  engineModel: string;
  pronunciationVersion: string;
  audioCodec: string;
  cachePolicy: PromptAudioCachePolicy;
}

export interface NumericCodeAudioFragment {
  promptId: string;
  locale: string;
  text: string;
  cachePolicy: typeof PromptAudioCachePolicies.PublicStatic;
}

export interface NumericCodeAudioPlan {
  fragments: readonly NumericCodeAudioFragment[];
  pauseAfterDigitMs: number;
}

const DIGIT_WORDS_BY_LANGUAGE = Object.freeze({
  de: ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'],
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
  es: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'],
  fr: ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'],
  it: ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'],
  ja: ['ゼロ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'],
  ko: ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'],
  nl: ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen'],
  pt: ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'],
  zh: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
} as const);

function requiredText(value: unknown, errorCode: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(errorCode);
  return normalized;
}

/** Produces the stable preimage that a runtime hashes for content addressing. */
export function canonicalizePublicPromptAudioDescriptor(input: PublicPromptAudioDescriptor): string {
  if (input.cachePolicy !== PromptAudioCachePolicies.PublicStatic) {
    throw new Error('prompt_audio_public_static_required');
  }
  const speakingRate = Number(input.speakingRate);
  if (!Number.isFinite(speakingRate) || speakingRate < 0.5 || speakingRate > 2) {
    throw new Error('prompt_audio_speaking_rate_invalid');
  }
  const text = requiredText(input.text, 'prompt_audio_text_required').replace(/\s+/gu, ' ');
  return JSON.stringify({
    version: 1,
    promptId: requiredText(input.promptId, 'prompt_audio_prompt_id_required'),
    locale: requiredText(input.locale, 'prompt_audio_locale_required'),
    text,
    voiceProfile: requiredText(input.voiceProfile, 'prompt_audio_voice_profile_required'),
    speakingRate,
    synthesisEngine: requiredText(input.synthesisEngine, 'prompt_audio_synthesis_engine_required'),
    engineModel: requiredText(input.engineModel, 'prompt_audio_engine_model_required'),
    pronunciationVersion: requiredText(input.pronunciationVersion, 'prompt_audio_pronunciation_version_required'),
    audioCodec: requiredText(input.audioCodec, 'prompt_audio_codec_required'),
    cachePolicy: PromptAudioCachePolicies.PublicStatic,
  });
}

/**
 * Splits a live numeric code into independently cacheable public fragments.
 * The returned plan never contains one prompt whose text or identifier is the
 * complete code; the caller keeps verification, expiry and attempts outside
 * the audio layer.
 */
export function buildNumericCodeAudioPlan(input: Readonly<{
  code: string;
  locale: string;
  prefixPromptId: string;
  prefixText: string;
  pauseAfterDigitMs?: number;
}>): NumericCodeAudioPlan {
  const code = String(input.code ?? '').trim();
  if (!/^\d{4,12}$/.test(code)) throw new Error('numeric_code_invalid');
  const locale = requiredText(input.locale, 'numeric_code_locale_required');
  const language = locale.toLowerCase().split('-')[0] as keyof typeof DIGIT_WORDS_BY_LANGUAGE;
  const digitWords = DIGIT_WORDS_BY_LANGUAGE[language];
  if (!digitWords) throw new Error('numeric_code_locale_unsupported');
  const pauseAfterDigitMs = input.pauseAfterDigitMs ?? 500;
  if (!Number.isInteger(pauseAfterDigitMs) || pauseAfterDigitMs < 100 || pauseAfterDigitMs > 2_000) {
    throw new Error('numeric_code_pause_invalid');
  }
  const prefix: NumericCodeAudioFragment = Object.freeze({
    promptId: requiredText(input.prefixPromptId, 'numeric_code_prefix_id_required'),
    locale,
    text: requiredText(input.prefixText, 'numeric_code_prefix_text_required').replace(/\s+/gu, ' '),
    cachePolicy: PromptAudioCachePolicies.PublicStatic,
  });
  const digitFragments = [...code].map((digit) => Object.freeze({
    promptId: `numeric.digit.${digit}`,
    locale,
    text: digitWords[Number(digit)],
    cachePolicy: PromptAudioCachePolicies.PublicStatic,
  }));
  return Object.freeze({
    fragments: Object.freeze([prefix, ...digitFragments]),
    pauseAfterDigitMs,
  });
}
