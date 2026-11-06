import { NextResponse } from 'next/server';

type Language = 'ar' | 'en' | 'ur';

function safeText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function safeEmail(value: unknown) {
  const email = safeText(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CERTIFICATE_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return NextResponse.json(
      { error: 'Certificate email service is not configured.' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const name = safeText(body.name, 120);
    const email = safeEmail(body.email);
    const lang: Language = body.lang === 'en' || body.lang === 'ur' ? body.lang : 'ar';
    const fileBase64 = typeof body.fileBase64 === 'string' ? body.fileBase64 : '';

    if (!name || !email || !fileBase64) {
      return NextResponse.json({ error: 'Invalid certificate request.' }, { status: 400 });
    }

    // Keep the payload comfortably below common provider limits.
    if (fileBase64.length > 10_000_000) {
      return NextResponse.json({ error: 'Certificate file is too large.' }, { status: 413 });
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

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Certificate email error:', error);
    return NextResponse.json({ error: 'Unable to send certificate email.' }, { status: 502 });
  }
}
