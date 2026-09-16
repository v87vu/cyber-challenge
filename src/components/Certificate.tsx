'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { usePrefs } from '@/lib/usePrefs';
import { PixelButton } from '@/components/PixelUI';

/* الشهادة: خلفية بيضاء وخط Arial بطلب من الجهة — تبقى كذلك مهما تغيّر طابع اللعبة */

const W = 1760;
const H = 1240;

function formatDate(lang: 'ar' | 'en') {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', {
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
}: {
  score: number;
  total: number;
  title: string;
  onClose: () => void;
}) {
  const { gender, lang, s } = usePrefs();
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trimmed = name.trim();
  const female = gender === 'female';

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const F = 'Arial, Helvetica, sans-serif';
    const INK = '#1a2340';
    const NAVY = '#14245c';
    const GOLD = '#e0921a';
    const GREEN = '#1d7a41';
    const MUTED = '#5b6b8c';

    const rect = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };

    /* خلفية بيضاء */
    rect(0, 0, W, H, '#ffffff');

    /* شرائط علوية وسفلية بألوان اللعبة */
    const bands = ['#ffd23f', '#3f6bd8', '#56c454', '#e0921a'];
    const bw = W / bands.length;
    bands.forEach((c, i) => {
      rect(i * bw, 0, bw, 20, c);
      rect(i * bw, H - 20, bw, 20, bands[bands.length - 1 - i]);
    });

    /* إطار */
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 6;
    ctx.strokeRect(52, 52, W - 104, H - 104);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(72, 72, W - 144, H - 144);

    /* زوايا */
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

    ctx.direction = lang === 'ar' ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';

    ctx.font = `bold 30px ${F}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(
      lang === 'ar' ? 'مسابقة مواجهة الجرائم الإلكترونية' : 'CONFRONTING CYBERCRIME',
      W / 2,
      182,
    );

    ctx.font = `bold 86px ${F}`;
    ctx.fillStyle = NAVY;
    ctx.fillText(lang === 'ar' ? 'تحدي الوعي الرقمي' : 'Digital Awareness Challenge', W / 2, 288);

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

    /* لقب الشهادة داخل شريط */
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
    ctx.direction = lang === 'ar' ? 'rtl' : 'ltr';
    ctx.fillText(formatDate(lang), W - 104, 1168);
  }, [score, total, title, trimmed, lang, female, s]);

  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !trimmed) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lang === 'ar' ? 'شهادة' : 'certificate'}-${trimmed}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div
        className="pxl anim-in my-auto w-full max-w-2xl p-5 sm:p-6"
        style={{ background: 'var(--panel)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="ink text-lg font-black">{s.yourCertificate}</h2>
          <PixelButton size="sm" color="slate" onClick={onClose}>
            {s.close}
          </PixelButton>
        </div>

        <label
          className="ink-sm mt-5 block text-xs font-black text-[var(--fg-muted)]"
          htmlFor="cert-name"
        >
          {s.nameLabel}
        </label>
        <input
          id="cert-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={48}
          placeholder={s.namePlaceholder}
          className="pxl mt-2 w-full px-4 py-3 text-base font-bold outline-none"
          style={{ background: 'var(--night-0)', color: 'var(--fg)' }}
        />

        <div className="pxl mt-4" style={{ background: '#ffffff' }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="block h-auto w-full"
            aria-label={`${s.yourCertificate} — ${trimmed || '—'} — ${score}/${total}`}
          />
        </div>

        <PixelButton size="lg" className="mt-4 w-full" onClick={download} disabled={!trimmed}>
          {s.download}
        </PixelButton>
        <p className="ink-sm mt-3 text-center text-[11px] font-bold text-[var(--fg-muted)]">
          {s.certNote}
        </p>
      </div>
    </div>
  );
}
