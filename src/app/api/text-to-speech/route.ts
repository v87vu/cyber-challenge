export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Language = 'ar' | 'en' | 'ur';
type VoiceProfile = 'girl' | 'child' | 'adult-male' | 'default';

type GeminiSpeechResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data?: string;
          mimeType?: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

function cleanTranscript(value: string) {
  return value
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/gu, '')
    .replace(/[*_#`~=|<>{}\[\]\\]/g, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, 2500);
}

function voiceFor(profile: VoiceProfile) {
  if (profile === 'girl') return 'Leda';
  if (profile === 'child') return 'Puck';
  if (profile === 'adult-male') return 'Gacrux';
  return 'Sulafat';
}

function speechStyle(lang: Language, profile: VoiceProfile) {
  const language =
    lang === 'ar'
      ? 'Speak natural Modern Standard Arabic'
      : lang === 'ur'
        ? 'Speak natural Urdu'
        : 'Speak natural English';

  if (profile === 'girl') {
    return `${language}. Use a warm, youthful girl-like educational tone, friendly and clear, at a calm pace.`;
  }
  if (profile === 'child') {
    return `${language}. Use a cheerful young child-like educational tone, friendly and clear, at a calm pace.`;
  }
  if (profile === 'adult-male') {
    return `${language}. Use a mature adult male educational tone, calm, confident, friendly and clear.`;
  }
  return `${language}. Use a warm, clear and patient educational narration at a calm pace.`;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: 'Voice service is not configured.' }, { status: 503 });
  }

  let body: { text?: unknown; lang?: unknown; voiceProfile?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const lang: Language = body.lang === 'en' || body.lang === 'ur' ? body.lang : 'ar';
  const voiceProfile: VoiceProfile =
    body.voiceProfile === 'girl' ||
    body.voiceProfile === 'child' ||
    body.voiceProfile === 'adult-male'
      ? body.voiceProfile
      : 'default';

  const text = typeof body.text === 'string' ? cleanTranscript(body.text) : '';
  if (!text) {
    return Response.json({ error: 'Text is required.' }, { status: 400 });
  }

  const model = process.env.GEMINI_TTS_MODEL?.trim() || 'gemini-3.8-flash-lite-tts';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text,
                  speech_metadata: { style: speechStyle(lang, voiceProfile) },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { voice: voiceFor(voiceProfile) },
            },
          },
        }),
        cache: 'no-store',
        signal: controller.signal,
      },
    );

    const payload = (await geminiResponse.json()) as GeminiSpeechResponse;
    if (!geminiResponse.ok) {
      console.error(
        'Gemini TTS request failed:',
        geminiResponse.status,
        payload.error?.status,
        payload.error?.message,
      );
      return Response.json(
        { error: 'Voice generation failed.' },
        { status: geminiResponse.status === 429 ? 429 : 502 },
      );
    }

    const audioPart = payload.candidates?.[0]?.content?.parts?.find(
      (part) => typeof part.inlineData?.data === 'string',
    )?.inlineData;

    if (!audioPart?.data) {
      console.error('Gemini TTS returned no audio data.');
      return Response.json({ error: 'Voice generation returned no audio.' }, { status: 502 });
    }

    const audio = Uint8Array.from(Buffer.from(audioPart.data, 'base64'));
    const mimeType = audioPart.mimeType?.startsWith('audio/')
      ? audioPart.mimeType
      : 'audio/wav';

    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(audio.byteLength),
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    if (!timedOut) console.error('Gemini TTS unexpected error:', error);
    return Response.json(
      { error: timedOut ? 'Voice generation timed out.' : 'Voice service failed.' },
      { status: timedOut ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
