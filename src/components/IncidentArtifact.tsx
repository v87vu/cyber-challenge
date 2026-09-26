'use client';

import type { CSSProperties } from 'react';
import type { Scenario, ScenarioCopy, Seg } from '@/lib/scenarios';

/* بطاقة «الموقف» — لقطة شاشة هاتف واقعية (رسالة/محادثة/مكالمة/إعلان/منشور/بريد).
   قبل الإجابة تبدو طبيعية تماماً بلا أي لون تحذير؛ بعدها تُضاء العلامات الحمراء
   برقم صغير على المقطع + قائمة مرقّمة أسفل البطاقة. الرابط/الزر غير قابل للنقر أبداً. */

type Lang = 'ar' | 'en';

type Ctx = {
  copy: ScenarioCopy;
  order: string[];
  revealed: boolean;
  compact: boolean;
  lang: Lang;
  fs: string; // حجم خط المتن
  bodyMax: number; // أقصى ارتفاع لجسم البطاقة (px)
};

/* ترتيب العلامات حسب أول ظهور في السطور ثم الزر — يطابق الأرقام على المقاطع */
function flagOrder(copy: ScenarioCopy): string[] {
  const out: string[] = [];
  const take = (s?: Seg) => {
    if (s?.flag && !out.includes(s.flag)) out.push(s.flag);
  };
  copy.lines.forEach(take);
  take(copy.cta);
  return out;
}

/* مقطع نص — بعد الكشف يأخذ تظليلاً أحمر ناعماً + علامة مرقّمة */
function SegText({ seg, ctx }: { seg: Seg; ctx: Ctx }) {
  const i = seg.flag ? ctx.order.indexOf(seg.flag) : -1;
  if (!ctx.revealed || i < 0) return <bdi>{seg.text}</bdi>;
  return (
    <span className="ia-hit">
      <bdi>{seg.text}</bdi>
      <span className="ia-num ia-pop" style={{ animationDelay: `${i * 80}ms` }}>
        {i + 1}
      </span>
    </span>
  );
}

function Avatar({ name, tint, size = 32 }: { name: string; tint: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 select-none place-items-center rounded-full font-black text-white"
      style={{ width: size, height: size, background: tint, fontSize: size * 0.42 }}
    >
      {name.trim().charAt(0) || '؟'}
    </span>
  );
}

/* ============ SMS — فقاعات رمادية بأسلوب iOS ============ */
function Sms({ ctx }: { ctx: Ctx }) {
  const { copy, fs } = ctx;
  const bubble = `max-w-[85%] self-start rounded-2xl rounded-ss-md bg-[#e9e9eb] px-3 py-2 ${fs} leading-relaxed text-[#1b1b1f]`;
  return (
    <div className="bg-white">
      <div className="flex items-center gap-2 border-b border-[#ececf0] bg-[#f7f7f9] px-3 py-2">
        <Avatar name={copy.sender} tint="#8e8e93" size={ctx.compact ? 26 : 30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-[#1b1b1f]"><bdi>{copy.sender}</bdi></p>
          {copy.meta && <p className="text-[10px] text-[#8e8e93]">{copy.meta}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto p-3" style={{ maxHeight: ctx.bodyMax }}>
        {copy.lines.map((s, i) => (
          <div key={i} className={bubble}>
            <SegText seg={s} ctx={ctx} />
          </div>
        ))}
        {copy.cta && (
          <div className={bubble}>
            <span className="pointer-events-none select-none break-all text-[#0a84ff] underline">
              <SegText seg={copy.cta} ctx={ctx} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ دردشة — محادثة بخلفية خضراء فاتحة بأسلوب واتساب ============ */
function Chat({ ctx }: { ctx: Ctx }) {
  const { copy, fs } = ctx;
  const bubble = `max-w-[85%] self-start rounded-xl rounded-ss-sm bg-white px-3 py-2 ${fs} leading-relaxed text-[#1b1b1f] shadow-[0_1px_1px_rgba(18,40,63,0.12)]`;
  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2 text-white" style={{ background: '#128c7e' }}>
        <Avatar name={copy.sender} tint="rgba(255,255,255,0.28)" size={ctx.compact ? 26 : 30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold"><bdi>{copy.sender}</bdi></p>
          {copy.meta && <p className="text-[10px] opacity-85">{copy.meta}</p>}
        </div>
      </div>
      <div
        className="flex flex-col gap-1.5 overflow-y-auto p-3"
        style={{ maxHeight: ctx.bodyMax, background: 'linear-gradient(165deg, #e9f6ee, #ddefe3)' }}
      >
        {copy.lines.map((s, i) => (
          <div key={i} className={bubble}>
            <SegText seg={s} ctx={ctx} />
          </div>
        ))}
        {copy.cta && (
          <div className={bubble}>
            <span className="pointer-events-none select-none break-all font-bold text-[#0b7a6f] underline">
              <SegText seg={copy.cta} ctx={ctx} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ مكالمة — شاشة مكالمة واردة كحلية + فقاعات ترجمة ============ */
function Call({ ctx }: { ctx: Ctx }) {
  const { copy, fs } = ctx;
  return (
    <div
      className="px-4 pb-3.5 pt-3 text-center text-white"
      style={{ background: 'linear-gradient(170deg, #1a3d66, #0f2947)' }}
    >
      {copy.meta && <p className="text-[11px] text-white/70">{copy.meta}</p>}
      <div className="mt-2 flex justify-center">
        <Avatar name={copy.sender} tint="rgba(255,255,255,0.16)" size={ctx.compact ? 40 : 48} />
      </div>
      <p className="mt-1.5 text-[15px] font-bold"><bdi>{copy.sender}</bdi></p>
      <div
        className="mt-2.5 flex flex-col items-center gap-1.5 overflow-y-auto"
        style={{ maxHeight: ctx.bodyMax }}
      >
        {copy.lines.map((s, i) => (
          <p key={i} className={`max-w-full rounded-full bg-white/10 px-3 py-1 ${fs} leading-relaxed`}>
            <SegText seg={s} ctx={ctx} />
          </p>
        ))}
        {copy.cta && (
          <p className={`max-w-full rounded-full bg-white/10 px-3 py-1 ${fs} leading-relaxed`}>
            <span className="pointer-events-none select-none underline">
              <SegText seg={copy.cta} ctx={ctx} />
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

/* ============ إعلان — بطاقة «إعلان مموّل» + صورة مرسومة بتدرّج CSS ============ */
function Ad({ ctx }: { ctx: Ctx }) {
  const { copy, fs } = ctx;
  return (
    <div className="bg-white">
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <Avatar name={copy.sender} tint="linear-gradient(135deg, #ffcf3f, #e07a00)" size={ctx.compact ? 26 : 30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-[#1b1b1f]"><bdi>{copy.sender}</bdi></p>
          {copy.meta && <p className="text-[10px] text-[#7e94aa]">{copy.meta}</p>}
        </div>
        <span aria-hidden className="select-none text-sm leading-none text-[#9db3c8]">···</span>
      </div>
      <div className={`space-y-1 overflow-y-auto px-3 py-2 ${fs} leading-relaxed text-[#1c3550]`} style={{ maxHeight: ctx.bodyMax }}>
        {copy.lines.map((s, i) => (
          <p key={i}>
            <SegText seg={s} ctx={ctx} />
          </p>
        ))}
      </div>
      <div className="relative mx-3 h-[74px] overflow-hidden rounded-xl" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #ffe08a 0%, #f5b301 38%, #4ba3f5 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 28% 18%, rgba(255,255,255,0.6), transparent 58%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'linear-gradient(180deg, transparent, rgba(15,41,71,0.25))' }} />
      </div>
      {copy.cta && (
        <div className="p-3 pt-2">
          <span className="pointer-events-none block select-none rounded-lg border border-[#dbe3ec] bg-[#f0f4f9] px-3 py-2 text-center text-[13px] font-bold text-[#1f6fd0]">
            <SegText seg={copy.cta} ctx={ctx} />
          </span>
        </div>
      )}
      {!copy.cta && <div className="h-3" />}
    </div>
  );
}

/* ============ منشور — بطاقة منشور/ملف اجتماعي ============ */
function Social({ ctx }: { ctx: Ctx }) {
  const { copy, fs } = ctx;
  const icon = 'h-4 w-4';
  return (
    <div className="bg-white">
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <Avatar name={copy.sender} tint="linear-gradient(135deg, #4ba3f5, #1f6fd0)" size={ctx.compact ? 26 : 30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-[#1b1b1f]"><bdi>{copy.sender}</bdi></p>
          {copy.meta && <p className="text-[10px] text-[#7e94aa]">{copy.meta}</p>}
        </div>
      </div>
      <div className={`space-y-1 overflow-y-auto px-3 py-2 ${fs} leading-relaxed text-[#1c3550]`} style={{ maxHeight: ctx.bodyMax }}>
        {copy.lines.map((s, i) => (
          <p key={i}>
            <SegText seg={s} ctx={ctx} />
          </p>
        ))}
        {copy.cta && (
          <p>
            <span className="pointer-events-none select-none break-all font-bold text-[#1f6fd0] underline">
              <SegText seg={copy.cta} ctx={ctx} />
            </span>
          </p>
        )}
      </div>
      <div aria-hidden className="flex select-none items-center gap-5 border-t border-[#eef3f8] px-4 py-2 text-[#9db3c8]">
        <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20.5C6 16 3 12.6 3 9.1 3 6.4 5.1 4.5 7.6 4.5c1.7 0 3.3 1 4.4 2.7 1.1-1.7 2.7-2.7 4.4-2.7 2.5 0 4.6 1.9 4.6 4.6 0 3.5-3 6.9-9 11.4z" />
        </svg>
        <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-8 8c-1.3 0-2.6-.3-3.7-.9L3 20l1-5.6A8 8 0 1 1 21 12z" />
        </svg>
        <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
        </svg>
      </div>
    </div>
  );
}

/* ============ بريد — ترويسة بريد (موضوع + مرسِل) ثم المتن ============ */
function Email({ ctx }: { ctx: Ctx }) {
  const { copy, fs } = ctx;
  return (
    <div className="bg-white">
      <div className="border-b border-[#e8eef4] px-3 py-2.5">
        {copy.meta && <p className="text-[13px] font-black text-[#13294b]">{copy.meta}</p>}
        <div className="mt-1.5 flex items-center gap-2">
          <Avatar name={copy.sender} tint="linear-gradient(135deg, #1ba8c9, #0f766e)" size={ctx.compact ? 24 : 28} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-[#1b1b1f]"><bdi>{copy.sender}</bdi></p>
            <p className="text-[10px] text-[#7e94aa]">{ctx.lang === 'ar' ? 'إليّ' : 'to me'}</p>
          </div>
        </div>
      </div>
      <div className={`space-y-1.5 overflow-y-auto px-3 py-2.5 ${fs} leading-relaxed text-[#1c3550]`} style={{ maxHeight: ctx.bodyMax }}>
        {copy.lines.map((s, i) => (
          <p key={i}>
            <SegText seg={s} ctx={ctx} />
          </p>
        ))}
        {copy.cta && (
          <p className="pt-0.5">
            <span
              className="pointer-events-none inline-block select-none rounded-lg px-3 py-1.5 text-[12px] font-bold text-white"
              style={{ background: 'linear-gradient(160deg, #4ba3f5, #1f6fd0)' }}
            >
              <SegText seg={copy.cta} ctx={ctx} />
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

const BODIES = { sms: Sms, chat: Chat, call: Call, ad: Ad, social: Social, email: Email } as const;

const CSS = `
.ia-num {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 15px; height: 15px; border-radius: 9999px;
  background: #e5484d; color: #fff; font-size: 9px; font-weight: 800; line-height: 1;
  position: relative; top: -1px; margin-inline-start: 4px;
}
.ia-hit {
  background: rgba(229, 72, 77, 0.1); border-radius: 6px; padding: 0 3px; margin: 0 -3px;
  box-shadow: 0 0 0 1px rgba(229, 72, 77, 0.22);
  -webkit-box-decoration-break: clone; box-decoration-break: clone;
}
@keyframes ia-pop {
  from { opacity: 0; transform: scale(0.4); }
  to { opacity: 1; transform: none; }
}
.ia-pop { animation: ia-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes ia-rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.ia-rise { animation: ia-rise 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .ia-pop, .ia-rise { animation: none !important; }
}
`;

export default function IncidentArtifact({
  scenario,
  lang,
  revealed,
  compact = false,
}: {
  scenario: Scenario;
  lang: Lang;
  revealed: boolean;
  compact?: boolean;
}) {
  const copy = scenario[lang];
  const ctx: Ctx = {
    copy,
    order: flagOrder(copy),
    revealed,
    compact,
    lang,
    fs: compact ? 'text-[12px]' : 'text-[13px]',
    bodyMax: compact ? 150 : 216, // مع الترويسة يبقى الكل ≲ 300px (أصغر في compact)
  };
  const Body = BODIES[scenario.kind];

  return (
    <section dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-full">
      <style>{CSS}</style>
      <p className="mb-1.5 text-[12px] font-bold text-[#46617c]">
        📱 {lang === 'ar' ? 'الموقف' : 'The situation'}
      </p>
      <div className="overflow-hidden rounded-2xl border border-[#dce7f1] bg-white shadow-[0_1px_2px_rgba(18,40,63,0.06),0_2px_8px_rgba(18,40,63,0.07)]">
        <Body ctx={ctx} />
      </div>
      {revealed && ctx.order.length > 0 && (
        <ol className="mt-2 space-y-1" aria-live="polite">
          {ctx.order.map((k, i) => (
            <li
              key={k}
              className="ia-rise flex items-center gap-1.5 text-[12px] font-bold leading-snug text-[#8f2320]"
              style={{ animationDelay: `${160 + i * 80}ms` }}
            >
              <span className="ia-num" style={{ marginInlineStart: 0, top: 0 } as CSSProperties}>
                {i + 1}
              </span>
              <span>{copy.flags[k]}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
