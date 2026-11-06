import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ReviewMistake = {
  questionNumber: number;
  question: string;
  selectedAnswers: string[];
  correctAnswer: string;
  explanation: string;
};

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

async function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), milliseconds);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const lang = body.lang === 'ar' || body.lang === 'ur' ? body.lang : 'en';

    const mistakes: ReviewMistake[] = Array.isArray(body.mistakes)
      ? body.mistakes.slice(0, 1).map((item: ReviewMistake) => ({
          questionNumber: Number(item.questionNumber) || 0,
          question: cleanText(item.question, 600),
          selectedAnswers: Array.isArray(item.selectedAnswers)
            ? item.selectedAnswers.slice(0, 6).map((answer) => cleanText(answer, 300))
            : [],
          correctAnswer: cleanText(item.correctAnswer, 300),
          explanation: cleanText(item.explanation, 800),
        }))
      : [];

    const messages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages.slice(-8).map((message: ChatMessage) => ({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: cleanText(message.content, 1500),
        }))
      : [];

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user')?.content;

    const ai = new GoogleGenAI({ apiKey });
    const language = lang === 'ar' ? 'Arabic' : lang === 'ur' ? 'Urdu' : 'English';

    // Perfect-score mode: normal cyber-safety conversation, not answer grading.
    if (mistakes.length === 0) {
      if (!latestUserMessage) {
        return NextResponse.json({
          reply:
            lang === 'ar'
              ? 'ممتاز! أجبت عن جميع الأسئلة بشكل صحيح. هل لديك أي سؤال يخص الأمن الرقمي؟'
              : lang === 'ur'
                ? 'بہترین! آپ نے تمام سوالات درست حل کیے۔ کیا آپ کے پاس ڈیجیٹل سیکیورٹی سے متعلق کوئی سوال ہے؟'
                : 'Excellent! You answered every question correctly. Do you have any question about digital safety?',
          understood: false,
          mode: 'chat',
        });
      }

      const response = await withTimeout(
        ai.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
          contents: messages
            .filter((message) => message.content)
            .map(
              (message) =>
                `${message.role === 'user' ? 'USER' : 'ASSISTANT'}: ${message.content}`,
            )
            .join('\n'),
          config: {
            systemInstruction:
              `You are a friendly cybersecurity learning coach. Reply only in ${language}. ` +
              'The learner completed the quiz perfectly and is now chatting with you. ' +
              'Reply naturally to greetings. Answer questions about cybersecurity, digital safety, privacy, scams, passwords, phishing, social media safety, devices, and safe online behavior. ' +
              'Never say their message is a correct or incorrect quiz answer. ' +
              'If the message is unrelated to digital safety, reply briefly and gently invite a digital-safety question. ' +
              'Use plain text only. Keep replies concise, friendly, and suitable for a child. ' +
              'Do not request personal data, passwords, API keys, or confidential information.',
            temperature: 0.35,
            maxOutputTokens: 260,
          },
        }),
        9000,
      );

      const reply = response.text?.trim();
      if (!reply) {
        return NextResponse.json({ error: 'Gemini returned an empty response.' }, { status: 502 });
      }

      return NextResponse.json({ reply, understood: false, mode: 'chat' });
    }

    // Mistake-review mode.
    if (!latestUserMessage) {
      return NextResponse.json({ error: 'A learner answer is required.' }, { status: 400 });
    }

    const mistake = mistakes[0];

    const response = await withTimeout(
      ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        contents:
          `QUESTION: ${mistake.question}\n` +
          `CORRECT SAFE ANSWER: ${mistake.correctAnswer}\n` +
          `APPROVED EXPLANATION: ${mistake.explanation}\n` +
          `LEARNER'S LATEST MESSAGE: ${latestUserMessage}`,
        config: {
          systemInstruction:
            `You are a friendly cybersecurity learning coach. Reply only in ${language}. ` +
            'First decide whether the learner\'s latest message is CHAT, CORRECT, or RETRY. ' +
            'CHAT means a greeting, casual conversation, asking for an explanation, asking why/how, or asking a genuine cybersecurity/digital-safety question instead of attempting the quiz answer. ' +
            'CORRECT means the learner is clearly attempting the quiz answer and expresses the supplied safe action. ' +
            'RETRY means the learner is attempting the quiz answer but it is unsafe, incorrect, too vague, or meaningless. ' +
            'If CHAT, your first line MUST be exactly MODE:CHAT. Reply naturally and helpfully. Never call a greeting or question correct or incorrect. ' +
            'If CORRECT, your first line MUST be exactly MODE:CORRECT. Confirm the quiz answer is correct and reinforce it briefly. ' +
            'If RETRY, your first line MUST be exactly MODE:RETRY. Explain the safe action simply and ask one short follow-up question. ' +
            'Accept colloquial wording, spelling mistakes, short safe answers, and paraphrases. Never require exact wording. ' +
            'Do not tell the learner to press any button. ' +
            'Use plain text only. No Markdown. Keep replies under 60 words. ' +
            'Do not request personal data, passwords, API keys, or confidential information. ' +
            'Keep replies concise, supportive, and suitable for a child.',
          temperature: 0.2,
          maxOutputTokens: 220,
        },
      }),
      9000,
    );

    const rawReply = response.text?.trim();
    if (!rawReply) {
      return NextResponse.json({ error: 'Gemini returned an empty response.' }, { status: 502 });
    }

    const isChat = /^MODE:CHAT(?:\s|$)/i.test(rawReply);
    const understood = /^MODE:CORRECT(?:\s|$)/i.test(rawReply);
    const reply = rawReply.replace(/^MODE:(?:CHAT|CORRECT|RETRY)\s*/i, '').trim();

    return NextResponse.json({
      reply,
      understood,
      mode: isChat ? 'chat' : 'answer',
    });
  } catch (error) {
    console.error('AI review error:', error);
    const timedOut = error instanceof Error && error.message === 'GEMINI_TIMEOUT';
    return NextResponse.json(
      { error: timedOut ? 'Gemini response timed out.' : 'Unable to generate the AI review.' },
      { status: timedOut ? 504 : 502 },
    );
  }
}
