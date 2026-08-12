// Gemini-powered Arabic → English translation for the chalet owner's bilingual
// content (name, description, address, rules…). Called directly from the app.
//
// Configure via .env:
//   EXPO_PUBLIC_GEMINI_API_KEY=...        (required)
//   EXPO_PUBLIC_GEMINI_MODEL=gemini-2.5-flash  (optional override)
//
// SECURITY (known, tracked): EXPO_PUBLIC_* values are inlined into the JS bundle
// at build time, so the key ships inside every APK/IPA and can be recovered with
// `strings` in under a minute. The Generative Language API has no app-attestation
// restriction, so possession of the key is full use of the key.
//   • The key is sent as an `x-goog-api-key` HEADER (never `?key=` in the URL) so
//     it does not land in proxy / CDN / server access logs, which are commonly
//     retained far longer and shared far wider than request bodies.
//   • The real fix is a server-side proxy (POST /translate on the NestJS API)
//     holding the key; this module should then call that authenticated endpoint
//     and EXPO_PUBLIC_GEMINI_API_KEY should be dropped from the build entirely.
// Until that lands, restrict the key (quotas + API restriction to the Generative
// Language API only) in the Google AI Studio / Cloud console.

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Coded error so the UI can show the right message per failure.
export type TranslationErrorCode =
  | 'EMPTY'
  | 'NO_KEY'
  | 'NETWORK'
  | 'EMPTY_RESPONSE'
  | `HTTP_${number}`
  | 'UNKNOWN';

export class TranslationError extends Error {
  code: TranslationErrorCode;
  constructor(code: TranslationErrorCode, message?: string) {
    super(message || code);
    this.code = code;
    this.name = 'TranslationError';
  }
}

/** Whether a Gemini key is present in the build. */
export const isTranslationConfigured = (): boolean => !!GEMINI_API_KEY;

/**
 * Translate Arabic text to natural English via Gemini.
 * Returns the English string; throws a {@link TranslationError} on failure.
 */
export async function translateArToEn(text: string): Promise<string> {
  const source = (text || '').trim();
  if (!source) throw new TranslationError('EMPTY');
  if (!GEMINI_API_KEY) throw new TranslationError('NO_KEY');

  const prompt =
    'You are a professional translator for a chalet / holiday-home rental app.\n' +
    'Translate the following Arabic text into natural, fluent English.\n' +
    'Return ONLY the English translation — no quotes, no notes, no Arabic, no explanations.\n' +
    'Preserve line breaks and keep the tone appropriate for a listing.\n\n' +
    `Arabic text:\n${source}`;

  let res: Response;
  try {
    res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      // `x-goog-api-key` is the documented header form of `?key=` for the
      // Generative Language API — same auth, but the secret stays out of the
      // request line that proxies and access logs record.
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    });
  } catch {
    throw new TranslationError('NETWORK');
  }

  if (!res.ok) {
    throw new TranslationError(`HTTP_${res.status}` as TranslationErrorCode);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new TranslationError('EMPTY_RESPONSE');
  }

  const out: string = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => p?.text ?? '')
    .join('')
    .trim();

  if (!out) throw new TranslationError('EMPTY_RESPONSE');
  return out;
}
