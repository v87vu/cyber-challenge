import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

type Body = {
  question?: string;
  lang?: 'ar' | 'en' | 'ur';
};

function languageName(lang: Body['lang']) {
  if (lang === 'ur') return 'Urdu';
  if (lang === 'en') return 'English';
  return 'Arabic';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const question = body.question?.trim() ?? '';
    const lang = body.lang ?? 'ar';

    if (!question) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 503 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a friendly digital-safety tutor inside a cyber-awareness game.

The player got every quiz answer correct and may now ask ONE optional question about
digital safety, cybersecurity awareness, scams, phishing, passwords, privacy,
social media safety, online shopping safety, public Wi-Fi, or account protection.

Reply in ${languageName(lang)}.
Keep the answer clear, warm, practical, and short (about 2-5 sentences).
Do not use frightening language.
If the question is unrelated to digital safety, politely say you can only answer
digital-safety questions and invite the player to ask one.

Player question:
${question}
`.trim();

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const reply = result.text?.trim();

    if (!reply) {
      return NextResponse.json({ error: 'Empty AI reply.' }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Cyber question failed:', error);
    return NextResponse.json(
      { error: 'Unable to answer right now.' },
      { status: 500 },
    );
  }
}
