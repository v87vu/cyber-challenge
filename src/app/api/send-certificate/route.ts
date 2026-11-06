import { NextResponse } from 'next/server';
import { supabaseConfigured, supabaseRest } from '@/lib/supabaseAdmin';
import { createIpLimiter, InvalidPayload, isText, readJsonBody } from '@/lib/apiProtection';

type Language = 'ar' | 'en' | 'ur';
const limitRequests = createIpLimiter(3, 60 * 60_000);
const sendingGames = new Set<string>();

function safeText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function safeEmail(value: unknown) {
  const email = safeText(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export async function POST(request: Request) {
  const limited = limitRequests(request);
  if (limited) return limited;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CERTIFICATE_FROM_EMAIL?.trim();

  if (!apiKey || !from || !supabaseConfigured()) {
    return NextResponse.json(
      { error: 'Certificate email service is not configured.' },
      { status: 503 },
    );
  }

  let sendingGame = '';
  try {
    const body = await readJsonBody(request, 10_008_192);
    const cookieGame = request.headers.get('cookie')?.split(';')
      .map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith('cyber-certificate-game='))
      ?.slice('cyber-certificate-game='.length);
    const gameId = body.gameId ?? cookieGame;
    const name = safeText(body.name, 120);
    const email = safeEmail(body.email);
    const lang: Language = body.lang === 'en' || body.lang === 'ur' ? body.lang : 'ar';
    const fileBase64 = typeof body.fileBase64 === 'string' ? body.fileBase64 : '';

    if (!name || !email || !fileBase64 || !isText(body.name, 120) ||
      !isText(body.email, 180) || (body.lang !== 'ar' && body.lang !== 'en' && body.lang !== 'ur') ||
      typeof gameId !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(gameId)) {
      return NextResponse.json({ error: 'Invalid certificate request.' }, { status: 400 });
    }

    // Keep the payload comfortably below common provider limits.
    if (fileBase64.length > 10_000_000) {
      return NextResponse.json({ error: 'Certificate file is too large.' }, { status: 413 });
    }
    if (fileBase64.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(fileBase64) ||
      !/^[^=]*={0,2}$/.test(fileBase64) ||
      Buffer.from(fileBase64.slice(0, 12), 'base64').toString('ascii').slice(0, 5) !== '%PDF-') {
      return NextResponse.json({ error: 'Invalid certificate file.' }, { status: 400 });
    }
    if (sendingGames.has(gameId)) {
      return NextResponse.json({ error: 'Certificate send is already in progress.' }, {
        status: 429, headers: { 'Retry-After': '5' },
      });
    }
    sendingGames.add(gameId);
    sendingGame = gameId;

    type CertificateSession = {
      completed: boolean; certificate_sent: boolean; player_name: string; player_email: string;
    };
    let session: CertificateSession | undefined;
    const readDeadline = Date.now() + 2_000;
    // The UI can request mail before its fire-and-forget completion/identity save settles.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (Date.now() >= readDeadline) break;
      const sessions = await supabaseRest<CertificateSession[]>(
        `game_sessions?select=completed,certificate_sent,player_name,player_email&game_id=eq.${encodeURIComponent(gameId)}&limit=1`,
        { signal: AbortSignal.timeout(Math.max(1, readDeadline - Date.now())) },
      );
      session = sessions[0];
      if (session?.completed && safeEmail(session.player_email) === email &&
        safeText(session.player_name, 120) === name) break;
      const remaining = readDeadline - Date.now();
      if (attempt < 3 && remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(500, remaining)));
      }
    }
    if (!session || !session.completed || safeEmail(session.player_email) !== email ||
      safeText(session.player_name, 120) !== name) {
      return NextResponse.json({ error: 'No matching completed game.' }, { status: 400 });
    }
    if (session.certificate_sent) {
      return NextResponse.json({ sent: true, alreadySent: true });
    }

    const subject =
      lang === 'ar'
        ? 'شهادتك من لعبة الوعي الرقمي'
        : lang === 'ur'
          ? 'ڈیجیٹل آگاہی کھیل کا سرٹیفکیٹ'
          : 'Your Digital Awareness Game Certificate';

    const text =
      lang === 'ar'
        ? `مرحباً ${name}،\n\nمرفق شهادتك بعد إكمال اللعبة. شكراً لمشاركتك.`
        : lang === 'ur'
          ? `السلام علیکم ${name}،\n\nگیم مکمل کرنے کے بعد آپ کا سرٹیفکیٹ منسلک ہے۔ شرکت کا شکریہ۔`
          : `Hello ${name},\n\nYour certificate is attached after completing the game. Thank you for participating.`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `certificate/${gameId}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        text,
        attachments: [
          {
            filename: `certificate-${name.replace(/[^\p{L}\p{N}._-]+/gu, '-')}.pdf`,
            content: fileBase64,
          },
        ],
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Certificate email failed:', response.status, payload);
      return NextResponse.json({ error: 'Unable to send certificate email.' }, { status: 502 });
    }

    await supabaseRest(`game_sessions?game_id=eq.${encodeURIComponent(gameId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ certificate_sent: true }),
    });
    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof InvalidPayload) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Certificate email error:', error);
    return NextResponse.json({ error: 'Unable to send certificate email.' }, { status: 502 });
  } finally {
    if (sendingGame) sendingGames.delete(sendingGame);
  }
}
