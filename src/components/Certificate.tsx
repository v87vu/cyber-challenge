'use client';

import { jsPDF } from 'jspdf';
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePrefs } from '@/lib/usePrefs';
import { PixelButton } from '@/components/PixelUI';

/* الشهادة: خلفية بيضاء وخط Arial بطلب من الجهة — تبقى كذلك مهما تغيّر طابع اللعبة */

const W = 1760;
const H = 1240;

function formatDate(lang: 'ar' | 'en' | 'ur') {
  const locale = lang === 'ar' ? 'ar-AE' : lang === 'ur' ? 'ur-PK' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function serial(name: string, score: number) {
  let h = 5381;
  const str = `${name}|${score}`;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return `DAC-${score.toString().padStart(2, '0')}-${h.toString(36).toUpperCase().slice(0, 6)}`;
}

export default function Certificate({
  score,
  total,
  title,
  onClose,
  onEmailSent,
}: {
  score: number;
  total: number;
  title: string;
  onClose: () => void;
  onEmailSent?: () => void;
}) {
  const { gender, lang, age, name, email, s } = usePrefs();
  const [ready, setReady] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const [deliveryState, setDeliveryState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const deliveredRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const trimmed = name.trim();
  const female = gender === 'female';
  const winnerImage =
    gender === 'female'
      ? '/avatar-female-win.png'
      : age === '12-17'
        ? '/avatar-boy-win.png'
        : '/avatar-man-win.png';

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const F = getComputedStyle(document.body).fontFamily || 'Arial, Helvetica, sans-serif';
    const INK = '#1a2340';
    const NAVY = '#14245c';
    const GOLD = '#e0921a';
    const GREEN = '#1d7a41';
    const MUTED = '#5b6b8c';

    const rect = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };

    const drawLogo = () => {
      const logo = logoRef.current;
      if (!logo) return;

      const maxW = 300;
      const maxH = 175;
      const scale = Math.min(maxW / logo.width, maxH / logo.height);
      const w = logo.width * scale;
      const h = logo.height * scale;
      const x = W - 110 - w;
      const y = 95;

      ctx.drawImage(logo, x, y, w, h);
    };

    rect(0, 0, W, H, '#ffffff');

    const bands = ['#ffd23f', '#3f6bd8', '#56c454', '#e0921a'];
    const bw = W / bands.length;
    bands.forEach((c, i) => {
      rect(i * bw, 0, bw, 20, c);
      rect(i * bw, H - 20, bw, 20, bands[bands.length - 1 - i]);
    });

    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 6;
    ctx.strokeRect(52, 52, W - 104, H - 104);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(72, 72, W - 144, H - 144);

    const corner = (x: number, y: number) => {
      rect(x, y, 52, 10, GOLD);
      rect(x, y, 10, 52, GOLD);
    };
    corner(52, 52);
    ctx.save();
    ctx.translate(W - 52, 52);
    ctx.scale(-1, 1);
    corner(0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(52, H - 52);
    ctx.scale(1, -1);
    corner(0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(W - 52, H - 52);
    ctx.scale(-1, -1);
    corner(0, 0);
    ctx.restore();

    drawLogo();

    ctx.direction = lang === 'en' ? 'ltr' : 'rtl';
    ctx.textAlign = 'center';

    ctx.font = `bold 30px ${F}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(
      lang === 'ar'
        ? 'مسابقة مواجهة الجرائم الإلكترونية'
        : lang === 'ur'
          ? 'سائبر جرائم کا مقابلہ'
          : 'CONFRONTING CYBERCRIME',
      W / 2,
      182,
    );

    ctx.font = `bold 86px ${F}`;
    ctx.fillStyle = NAVY;
    ctx.fillText(
      lang === 'ar'
        ? 'تحدي الوعي الرقمي'
        : lang === 'ur'
          ? 'ڈیجیٹل آگاہی چیلنج'
          : 'Digital Awareness Challenge',
      W / 2,
      288,
    );

    rect(W / 2 - 170, 326, 340, 8, GOLD);

    ctx.font = `bold 34px ${F}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(s.certAwarded, W / 2, 428);

    ctx.font = `bold 76px ${F}`;
    ctx.fillStyle = GOLD;
    ctx.fillText(trimmed || '—', W / 2, 540);

    ctx.font = `bold 32px ${F}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(female ? s.certBodyF : s.certBody, W / 2, 630);

    ctx.font = `bold 116px ${F}`;
    ctx.fillStyle = GREEN;
    ctx.fillText(`${score} / ${total}`, W / 2, 766);

    ctx.font = `bold 32px ${F}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(female ? s.certTailF : s.certTail, W / 2, 840);

    const boxW = 760;
    rect(W / 2 - boxW / 2, 878, boxW, 96, '#fdf6e4');
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 4;
    ctx.strokeRect(W / 2 - boxW / 2, 878, boxW, 96);
    ctx.font = `bold 56px ${F}`;
    ctx.fillStyle = INK;
    ctx.fillText(title, W / 2, 944);

    ctx.font = `bold 44px ${F}`;
    ctx.fillStyle = GOLD;
    ctx.fillText(s.slogan, W / 2, 1058);

    ctx.font = `bold 28px ${F}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(s.tagline, W / 2, 1106);

    ctx.font = `bold 22px ${F}`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.direction = 'ltr';
    ctx.fillText(serial(trimmed, score), 104, 1168);
    ctx.textAlign = 'right';
    ctx.direction = lang === 'en' ? 'ltr' : 'rtl';
    ctx.fillText(formatDate(lang), W - 104, 1168);
  }, [score, total, title, trimmed, lang, female, s, logoReady]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      logoRef.current = img;
      setLogoReady(true);
    };
    img.onerror = () => {
      logoRef.current = null;
      setLogoReady(false);
    };
    img.src = '/uaq-police-logo.png';
  }, []);

  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) draw();
  }, [ready, logoReady, draw]);

  const createPdf = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trimmed) return null;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    return pdf;
  }, [trimmed]);

  const download = useCallback(() => {
    const pdf = createPdf();
    if (!pdf) return;

    const fileLabel = lang === 'ar' ? 'شهادة' : lang === 'ur' ? 'سرٹیفکیٹ' : 'certificate';
    pdf.save(`${fileLabel}-${trimmed}.pdf`);
  }, [createPdf, lang, trimmed]);

  const emailCertificate = useCallback(async () => {
    const pdf = createPdf();
    if (!pdf || !trimmed || !email) return;

    setDeliveryState('sending');
    try {
      const pdfDataUri = pdf.output('datauristring');
      const base64 = pdfDataUri.split(',')[1] ?? '';
      if (!base64) throw new Error('PDF generation failed');

      const response = await fetch('/api/send-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          email,
          lang,
          fileBase64: base64,
          score,
          total,
          title,
        }),
      });

      if (!response.ok) throw new Error('Certificate email failed');
      setDeliveryState('sent');
      onEmailSent?.();
    } catch {
      setDeliveryState('failed');
    }
  }, [createPdf, email, lang, onEmailSent, score, title, total, trimmed]);

  useEffect(() => {
    if (!ready || !trimmed || deliveredRef.current) return;
    deliveredRef.current = true;

    // The certificate appears immediately and is downloaded once.
    // Email delivery only runs when the player provided an email address.
    const timer = window.setTimeout(() => {
      download();
      if (email.trim()) void emailCertificate();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [download, email, emailCertificate, ready, trimmed]);


  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div
        className="pxl anim-in my-auto w-full max-w-5xl p-5 sm:p-6"
        style={{ background: 'var(--panel)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="ink text-lg font-black">{s.yourCertificate}</h2>
          <PixelButton size="sm" color="slate" onClick={onClose}>
            {s.close}
          </PixelButton>
        </div>

        <div className="mt-4 grid items-end gap-4 lg:grid-cols-[220px_1fr]">
          <div className="pxl flex flex-col items-center justify-end bg-white p-4 text-center">
            <img
              src={winnerImage}
              alt=""
              aria-hidden
              className="max-h-[330px] w-auto max-w-full object-contain"
            />
            <p className="ink mt-2 text-lg font-black text-[var(--gold-dark)]">
              {lang === 'ar'
                ? 'مبروك! 🎉'
                : lang === 'ur'
                  ? 'مبارک ہو! 🎉'
                  : 'Congratulations! 🎉'}
            </p>
          </div>

          <div className="pxl" style={{ background: '#ffffff' }}>
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="block h-auto w-full"
              aria-label={`${s.yourCertificate} — ${trimmed || '—'} — ${score}/${total}`}
            />
          </div>
        </div>

        <PixelButton size="lg" className="mt-4 w-full" onClick={download} disabled={!trimmed}>
          {lang === 'ar' ? 'تنزيل الشهادة مرة أخرى PDF' : lang === 'ur' ? 'PDF سرٹیفکیٹ دوبارہ ڈاؤن لوڈ کریں' : 'Download certificate PDF again'}
        </PixelButton>

        <p className="ink-sm mt-3 text-center text-[12px] font-black leading-7 text-[var(--fg-muted)]">
          {!email.trim()
            ? lang === 'ar'
              ? 'تم إنشاء الشهادة وتنزيلها. لم يتم إدخال بريد إلكتروني، لذلك لن يتم إرسالها بالإيميل.'
              : lang === 'ur'
                ? 'سرٹیفکیٹ تیار اور ڈاؤن لوڈ ہو گیا ہے۔ ای میل درج نہیں کیا گیا، اس لیے اسے ای میل نہیں کیا جائے گا۔'
                : 'Your certificate is ready and downloaded. No email was provided, so it will not be emailed.'
            : deliveryState === 'sending'
            ? lang === 'ar'
              ? `جارٍ إرسال الشهادة إلى ${email}...`
              : lang === 'ur'
                ? `سرٹیفکیٹ ${email} پر بھیجا جا رہا ہے...`
                : `Sending the certificate to ${email}...`
            : deliveryState === 'sent'
              ? lang === 'ar'
                ? `تم إنشاء شهادتك وستصلك على بريدك الإلكتروني ${email} خلال ثوانٍ.`
                : lang === 'ur'
                  ? `آپ کا سرٹیفکیٹ تیار ہو گیا ہے اور چند سیکنڈ میں ${email} پر پہنچ جائے گا۔`
                  : `Your certificate is ready and will arrive at ${email} within seconds.`
              : deliveryState === 'failed'
                ? lang === 'ar'
                  ? `ظهرت الشهادة وتم تنزيلها، لكن تعذر إرسالها إلى ${email}. يمكنك تنزيلها مرة أخرى من الزر أعلاه.`
                  : lang === 'ur'
                    ? `سرٹیفکیٹ دکھایا اور ڈاؤن لوڈ کیا گیا، لیکن ${email} پر ای میل نہیں ہو سکا۔`
                    : `The certificate was shown and downloaded, but it could not be emailed to ${email}.`
                : lang === 'ar'
                  ? `تم إنشاء الشهادة، وسيتم إرسالها إلى ${email}.`
                  : lang === 'ur'
                    ? `سرٹیفکیٹ تیار ہو گیا ہے اور ${email} پر بھیجا جائے گا۔`
                    : `The certificate is ready and will be sent to ${email}.`}
        </p>
      </div>
    </div>
  );
}
