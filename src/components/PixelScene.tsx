'use client';

import { useEffect, useRef } from 'react';

/* مشهد ليلي بأسلوب 8‑بت — يُرسم على لوحة 256×144 ثم يُكبَّر بـ pixelated */
const W = 256;
const H = 144;
const HORIZON = 104;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paint(ctx: CanvasRenderingContext2D) {
  const r = rng(20260825);
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  };

  /* --- سماء النهار: أشرطة متدرّجة مع تنقيط بينها --- */
  const sky = ['#2f95e0', '#3ea2ea', '#54b2f2', '#6cc1f8', '#86cffc', '#a0dcff', '#bce8ff'];
  const band = HORIZON / sky.length;
  sky.forEach((c, i) => {
    px(0, i * band, W, band + 1, c);
    if (i < sky.length - 1) {
      for (let x = 0; x < W; x += 2) {
        px(x + ((i % 2) as number), (i + 1) * band - 2, 1, 1, sky[i + 1]);
        px(x + (((i + 1) % 2) as number), (i + 1) * band - 1, 1, 1, sky[i + 1]);
      }
    }
  });

  /* أساس تحت الأفق حتى لا تبقى فجوات شفافة بين الأشجار */
  px(0, HORIZON, W, H - HORIZON, '#bce8ff');
  px(0, HORIZON, W, 3, '#cdeeff');

  const disc = (cx: number, cy: number, rad: number, c: string) => {
    for (let y = -rad; y <= rad; y++) {
      const w = Math.floor(Math.sqrt(rad * rad - y * y));
      px(cx - w, cy + y, w * 2 + 1, 1, c);
    }
  };

  /* --- الشمس المبتسمة مع هالة وأشعة --- */
  const mx = 46;
  const my = 28;
  ctx.globalAlpha = 0.1;
  disc(mx, my, 22, '#fff3b0');
  ctx.globalAlpha = 0.18;
  disc(mx, my, 16, '#ffe680');
  ctx.globalAlpha = 1;
  disc(mx, my, 10, '#e0a010');
  disc(mx, my, 9, '#ffd23f');
  disc(mx - 2, my - 2, 6, '#ffe98a');
  // أشعة قصيرة
  px(mx - 1, my - 15, 2, 3, '#ffd23f');
  px(mx - 1, my + 12, 2, 3, '#ffd23f');
  px(mx - 15, my - 1, 3, 2, '#ffd23f');
  px(mx + 12, my - 1, 3, 2, '#ffd23f');
  px(mx - 11, my - 11, 2, 2, '#ffd23f');
  px(mx + 9, my - 11, 2, 2, '#ffd23f');
  px(mx - 11, my + 9, 2, 2, '#ffd23f');
  px(mx + 9, my + 9, 2, 2, '#ffd23f');
  // وجه مبتسم
  px(mx - 4, my - 2, 2, 3, '#8a5a06');
  px(mx + 3, my - 2, 2, 3, '#8a5a06');
  px(mx - 4, my + 3, 8, 1, '#8a5a06');
  px(mx - 5, my + 2, 1, 1, '#8a5a06');
  px(mx + 4, my + 2, 1, 1, '#8a5a06');

  /* --- غيوم بيضاء --- */
  const cloud = (cx: number, cy: number, sc: number) => {
    const blobs: [number, number, number][] = [
      [-10, 2, 5], [-3, -2, 7], [5, -1, 6], [11, 2, 4],
    ];
    blobs.forEach(([bx, by, br]) => disc(cx + bx * sc, cy + by * sc, Math.max(2, br * sc), '#ffffff'));
    px(cx - 13 * sc, cy + 3 * sc, 27 * sc, 2, '#dceefb');
  };
  cloud(96, 22, 1);
  cloud(150, 40, 0.8);
  cloud(212, 18, 1.15);
  cloud(24, 58, 0.7);
  cloud(180, 62, 0.9);

  /* --- طيور بعيدة --- */
  const bird = (x: number, y: number, c: string) => {
    px(x, y, 2, 1, c);
    px(x + 2, y - 1, 1, 1, c);
    px(x + 3, y, 2, 1, c);
  };
  bird(118, 34, '#1a4a6a');
  bird(130, 28, '#1a4a6a');
  bird(166, 24, '#235a7c');

  /* --- طبقات الصنوبر — أفتح كلما ابتعدت --- */
  const pine = (x: number, base: number, h: number, half: number, dark: string, light: string) => {
    const steps = Math.max(3, Math.floor(h / 3));
    for (let s = 0; s < steps; s++) {
      const w = Math.max(1, Math.round((half * 2 * (s + 1)) / steps));
      const y = base - h + (s * h) / steps;
      px(x - w / 2, y, w, h / steps + 1, dark);
      px(x - w / 2, y, Math.max(1, w / 3), h / steps + 1, light);
    }
    px(x - 1, base - 2, 2, 4, '#4a3018');
  };

  for (let x = -4; x < W + 8; x += 7 + Math.floor(r() * 5)) {
    pine(x, HORIZON + 6, 14 + r() * 10, 4 + r() * 2, '#55a8a0', '#68bcb2');
  }
  for (let x = -6; x < W + 10; x += 10 + Math.floor(r() * 7)) {
    pine(x, HORIZON + 14, 20 + r() * 14, 6 + r() * 3, '#3a9868', '#48ae78');
  }
  for (let x = -8; x < W + 12; x += 15 + Math.floor(r() * 10)) {
    pine(x, HORIZON + 22, 26 + r() * 16, 8 + r() * 4, '#2a9448', '#37ae58');
  }

  /* --- الأرض العشبية المشمسة --- */
  px(0, HORIZON + 20, W, 6, '#3fb452');
  px(0, HORIZON + 20, W, 2, '#72e084');
  px(0, HORIZON + 26, W, 8, '#2fa040');
  px(0, HORIZON + 34, W, H, '#238234');
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(r() * W);
    const y = HORIZON + 20 + Math.floor(r() * (H - HORIZON - 20));
    px(x, y, 1, 1, r() > 0.55 ? '#7ee890' : '#17602a');
  }
  for (let x = 0; x < W; x += 3 + Math.floor(r() * 4)) {
    px(x, HORIZON + 18, 1, 2, '#72e084');
  }

  /* --- الشجرة الأمامية اليمنى + إطار أوراق يسار --- */

  const trunk = (cx: number, top: number, groundY: number, halfW: number) => {
    for (let y = top; y < groundY; y++) {
      const t = (y - top) / (groundY - top);
      const w = Math.max(2, Math.round(halfW * (0.72 + t * 0.5)));
      px(cx - w, y, w * 2, 1, '#5c3a1e');
      px(cx - w, y, Math.max(1, Math.round(w * 0.6)), 1, '#7c5230');
      px(cx + w - 1, y, 1, 1, '#3a2210');
    }
    px(cx - halfW - 5, groundY - 4, 6, 4, '#5c3a1e');
    px(cx - halfW - 5, groundY - 4, 6, 1, '#7c5230');
    px(cx + halfW - 1, groundY - 4, 6, 4, '#5c3a1e');
    px(cx + halfW - 1, groundY - 4, 6, 1, '#6b4526');
    px(cx + 1, top + 22, 5, 8, '#2e1a0a');
    px(cx + 1, top + 22, 5, 1, '#1c0f05');
    for (let y = top + 8; y < groundY - 8; y += 8) {
      px(cx - 4, y, 1, 5, '#42280f');
      px(cx + 3, y + 4, 1, 4, '#42280f');
    }
    px(cx - halfW - 9, top + 12, 10, 3, '#5c3a1e');
    px(cx - halfW - 9, top + 12, 10, 1, '#7c5230');
    px(cx - halfW - 12, top + 8, 3, 5, '#5c3a1e');
  };

  const canopy = (cx: number, cy: number, scale: number) => {
    const blobs: [number, number, number][] = [
      [0, 0, 16], [-11, 5, 12], [11, 5, 12], [-6, -8, 11], [7, -7, 11], [0, 12, 13],
    ];
    blobs.forEach(([bx, by, br]) => disc(cx + bx * scale, cy + by * scale, br * scale, '#1c7a40'));
    blobs.forEach(([bx, by, br]) =>
      disc(cx + bx * scale - 2, cy + by * scale - 2, br * scale - 3, '#2f9e57'),
    );
    blobs.forEach(([bx, by, br]) =>
      disc(cx + bx * scale - 3, cy + by * scale - 5, Math.max(1, br * scale - 8), '#4cc272'),
    );
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2;
      const rad = r() * 14 * scale;
      px(cx + Math.cos(a) * rad - 3, cy + Math.sin(a) * rad - 4, 1, 1, '#83e69c');
    }
  };

  const TX = W - 22;
  trunk(TX, 46, HORIZON + 26, 6);
  canopy(TX + 4, 26, 1.7);
  canopy(-4, 20, 1.5);

  ctx.globalAlpha = 0.22;
  disc(TX, HORIZON + 25, 13, '#155c28');
  ctx.globalAlpha = 1;
}

export default function PixelScene({ dim = 0 }: { dim?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    paint(ctx);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: '#86cffc' }}
    >
      <canvas
        ref={ref}
        width={W}
        height={H}
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: 'cover',
          objectPosition: 'center bottom',
          imageRendering: 'pixelated',
        }}
      />
      {/* يراعات تتلألأ */}
      {FIREFLIES.map((f, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: 4,
            height: 4,
            background: f.c,
            animation: `twinkle ${f.d}s steps(2) ${f.t}s infinite`,
          }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: `rgba(12,48,92,${dim})` }} />
    </div>
  );
}

const FIREFLIES = [
  { x: 12, y: 80, c: '#ffd23f', d: 2.4, t: 0 },
  { x: 26, y: 88, c: '#fff6c0', d: 3.1, t: 0.6 },
  { x: 44, y: 78, c: '#ffd23f', d: 2.8, t: 1.2 },
  { x: 63, y: 86, c: '#fff6c0', d: 3.4, t: 0.3 },
  { x: 78, y: 80, c: '#ffd23f', d: 2.2, t: 1.6 },
  { x: 88, y: 90, c: '#fff6c0', d: 3.0, t: 0.9 },
  { x: 16, y: 40, c: '#ffffff', d: 2.6, t: 1.4 },
  { x: 72, y: 34, c: '#ffffff', d: 3.2, t: 0.2 },
];
