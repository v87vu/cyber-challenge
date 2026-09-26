'use client';

import type { CSSProperties } from 'react';
import type { Level } from '@/lib/questions';

/* خريطة الإتقان — مسار متعرّج من 22 عقدة (10 للأطفال) من القلعة إلى القيادة.
   العقد المنجزة ممتلئة بلون مستواها مع علامة ✓، والقادمة فقط تنبض بنعومة.
   يعمل بعرض 320px دون تمرير أفقي، وينعكس بالكامل في العربية (RTL). */

type Lang = 'ar' | 'en';

const W = 320; // عرض نظام إحداثيات الرسم (يُقاس مع الحاوية)

const CSS = `
.mp-node {
  position: absolute; display: grid; place-items: center; border-radius: 9999px; font-weight: 800;
}
.mp-next {
  background: #fff; border: 2px solid var(--mpc, #f5b301); color: var(--mpc, #f5b301);
}
.mp-next::after {
  content: ''; position: absolute; inset: -4px; border-radius: 9999px;
  border: 3px solid var(--mpc, #f5b301); pointer-events: none;
  animation: mp-ring 1.7s ease-out infinite;
}
@keyframes mp-ring {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.7); opacity: 0; }
}
.mp-chip {
  position: absolute; transform: translateX(-50%); white-space: nowrap;
  border-radius: 9999px; border: 1px solid #dce7f1; background: #fff;
  padding: 2px 10px; font-size: 11px; font-weight: 800; color: #1c3550;
  box-shadow: 0 1px 2px rgba(18, 40, 63, 0.06), 0 2px 8px rgba(18, 40, 63, 0.07);
}
@media (prefers-reduced-motion: reduce) {
  .mp-next::after { animation: none !important; display: none; }
}
`;

export default function MasteryPath({
  done,
  total,
  levels,
  lang,
  kids,
}: {
  done: number[];
  total: number;
  levels: Level[];
  lang: Lang;
  kids: boolean;
}) {
  const rtl = lang === 'ar';
  // مسار أفعواني: صفوف أفقية تتناوب اتجاهها، يصعد من القلعة (أسفل) إلى القيادة (أعلى)
  const cols = kids ? 5 : 6;
  const rows = Math.ceil(total / cols);
  const rowH = 64;
  const topPad = 58;
  const botPad = 50;
  const padX = 40;
  const H = topPad + botPad + Math.max(0, rows - 1) * rowH;
  const dot = kids ? 38 : 34;

  const levelOf = (n: number) => levels.find((l) => n >= l.from && n <= l.to);
  const colorOf = (n: number) => levelOf(n)?.color ?? '#9db3c8';

  const pts = Array.from({ length: total }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = row % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    let x = padX + (col * (W - 2 * padX)) / (cols - 1);
    if (rtl) x = W - x;
    return { n: i + 1, x, y: H - botPad - row * rowH };
  });

  const doneSet = new Set(done);
  const doneCount = pts.filter((p) => doneSet.has(p.n)).length;
  const next = pts.find((p) => !doneSet.has(p.n))?.n;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const seg = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    `M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}`;

  const chipAt = (p: { x: number; y: number }, dy: number): CSSProperties => ({
    left: `${(p.x / W) * 100}%`,
    top: `calc(${(p.y / H) * 100}% + ${dy}px)`,
  });

  return (
    <section dir={rtl ? 'rtl' : 'ltr'} className="mx-auto w-full max-w-[360px]">
      <style>{CSS}</style>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-black text-[#13294b]">{rtl ? 'خريطة الإتقان' : 'Mastery map'}</h3>
        <span className="tnum text-[13px] font-bold text-[#46617c]">
          {doneCount}/{total}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e7eff7]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ffcf3f, #f0a500)' }}
        />
      </div>

      <div className="relative mt-2" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
          {pts.slice(1).map((p, i) => {
            const a = pts[i];
            const both = doneSet.has(a.n) && doneSet.has(p.n);
            return (
              <path
                key={p.n}
                d={seg(a, p)}
                stroke={both ? colorOf(p.n) : '#dbe6f0'}
                strokeWidth={8}
                strokeLinecap="round"
                opacity={both ? 0.9 : 1}
              />
            );
          })}
        </svg>

        {pts.map((p) => {
          const isDone = doneSet.has(p.n);
          const isNext = p.n === next;
          const c = colorOf(p.n);
          const lv = levelOf(p.n);
          const style: CSSProperties = {
            left: `${(p.x / W) * 100}%`,
            top: `${(p.y / H) * 100}%`,
            width: dot,
            height: dot,
            marginLeft: -dot / 2,
            marginTop: -dot / 2,
            ...(isDone ? { background: c, color: '#fff', boxShadow: `0 4px 10px -2px ${c}66` } : {}),
            ...(isNext && !isDone ? ({ '--mpc': c } as CSSProperties) : {}),
          };
          return (
            <div
              key={p.n}
              className={`mp-node ${isNext && !isDone ? 'mp-next' : ''} ${
                isDone ? '' : isNext ? '' : 'border border-[#d8e6f2] bg-[#eef4fa] text-[#7e94aa]'
              }`}
              style={style}
              title={lv ? (rtl ? lv.ar : lv.en) : undefined}
              role="img"
              aria-label={
                rtl
                  ? `السؤال ${p.n}: ${isDone ? 'مُتقَن' : isNext ? 'التالي' : 'لم يُفتح بعد'}`
                  : `Question ${p.n}: ${isDone ? 'mastered' : isNext ? 'next' : 'locked'}`
              }
            >
              {isDone ? (
                <svg width={dot * 0.42} height={dot * 0.42} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 13l4 4 10-10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="tnum text-[11px]">{p.n}</span>
              )}
            </div>
          );
        })}

        {pts.length > 0 && (
          <span className="mp-chip" style={chipAt(pts[0], dot / 2 + 8)}>
            🏰 {rtl ? 'القلعة' : 'Fort'}
          </span>
        )}
        {pts.length > 0 && (
          <span className="mp-chip" style={chipAt(pts[pts.length - 1], -(dot / 2) - 34)}>
            🛡️ {rtl ? 'القيادة' : 'HQ'}
          </span>
        )}
      </div>
    </section>
  );
}
