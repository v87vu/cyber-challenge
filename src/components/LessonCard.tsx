'use client';

import type { Lesson } from '@/lib/lessons';

/* بطاقة الدرس: الحيلة ← التصرف الآمن ← تذكّر
   تظهر بعد الإجابة الصحيحة وفي أعلى شاشة الخسارة — الضابط سيف يرفع إصبعه عند القاعدة */

const T = {
  ar: { head: 'درس القضية', trick: 'الحيلة', move: 'التصرف الآمن', remember: 'تذكّر' },
  en: { head: 'Case lesson', trick: 'The trick', move: 'The safe move', remember: 'Remember' },
};

export default function LessonCard({
  lesson,
  lang,
  explanation,
  saif = true,
}: {
  lesson: Lesson;
  lang: 'ar' | 'en';
  explanation?: string;
  saif?: boolean;
}) {
  const t = T[lang];
  return (
    <div className="pxl overflow-hidden p-0 text-start" style={{ background: '#ffffff' }}>
      <div className="flex items-center gap-2 px-4 pt-4">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-black text-white"
          style={{ background: 'linear-gradient(160deg, #0f766e, #134e4a)' }}
        >
          🛡️ {t.head}
        </span>
      </div>

      <div className="space-y-2.5 px-4 pt-3">
        <Row delay={0} icon="🎣" label={t.trick} tint="#fff4e5" ink="#8a4b00">
          {lesson.trick}
        </Row>
        <Row delay={90} icon="✅" label={t.move} tint="#e8f7ef" ink="#155e3b">
          {lesson.move}
        </Row>
      </div>

      {/* القاعدة الذهبية — أكبر عنصر في البطاقة لأنها ما يجب أن يبقى في الذاكرة */}
      <div
        className="lesson-row relative mt-3 flex items-end gap-3 px-4 pb-0 pt-3"
        style={{ animationDelay: '180ms', background: 'linear-gradient(180deg, #ffffff 0%, #eef6ff 100%)' }}
      >
        <div className="min-w-0 flex-1 pb-4">
          <p className="text-[10px] font-black tracking-wide text-[var(--fg-dim)]">💡 {t.remember}</p>
          <p className="mt-1 text-lg font-black leading-8 text-[var(--ink)]">«{lesson.remember}»</p>
        </div>
        {saif && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/art/saif-4.png"
            alt=""
            aria-hidden
            className="slide-in-side h-28 w-auto shrink-0 select-none"
            style={{ ['--side' as string]: lang === 'ar' ? '-1' : '1', animationDelay: '260ms' }}
            draggable={false}
          />
        )}
      </div>

      {explanation && (
        <details className="group border-t px-4 py-3" style={{ borderColor: 'var(--line)' }}>
          <summary className="cursor-pointer list-none text-[11px] font-black text-[var(--fg-muted)]">
            {lang === 'ar' ? 'الشرح الكامل' : 'Full explanation'}{' '}
            <span className="inline-block transition-transform group-open:rotate-180">▾</span>
          </summary>
          <p className="mt-2 text-xs font-bold leading-7 text-[var(--fg-muted)]">{explanation}</p>
        </details>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  tint,
  ink,
  delay,
  children,
}: {
  icon: string;
  label: string;
  tint: string;
  ink: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div className="lesson-row flex gap-3 rounded-2xl px-3 py-2.5" style={{ background: tint, animationDelay: `${delay}ms` }}>
      <span aria-hidden className="text-base leading-7">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black" style={{ color: ink, opacity: 0.75 }}>
          {label}
        </p>
        <p className="text-[13px] font-bold leading-7" style={{ color: ink }}>
          {children}
        </p>
      </div>
    </div>
  );
}
