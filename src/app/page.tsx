'use client';

import Link from 'next/link';
import { LEVELS, REWARDS } from '@/lib/questions';
import { setLang, type Lang } from '@/lib/prefs';
import { usePrefs } from '@/lib/usePrefs';
import Shell from '@/components/Shell';
import { Chip, Panel } from '@/components/PixelUI';
import { sfx } from '@/lib/sfx';

export default function Home() {
  const { lang, s } = usePrefs();

  /* ------------------------------------------------------ شاشة العنوان */
  return (
    <Shell>
      <section className="flex min-h-[86dvh] w-full flex-col items-center justify-center text-center">
        <div className="relative flex flex-col items-center">
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-x-16 -inset-y-10"
            style={{
              background:
                'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 75%)',
              filter: 'blur(6px)',
            }}
          />
          <p className="pixel ink-sm relative text-[10px] leading-6 text-[var(--fg-muted)] sm:text-xs" dir="ltr">
            DIGITAL AWARENESS
          </p>
          <h1 className="title-px relative mt-5 text-[12vw] font-black leading-[1.25] sm:text-7xl">
            {s.appTitle}
          </h1>
          <p className="relative mt-8 text-base font-black text-[var(--gold-dark)] sm:text-xl">
            {s.appSubtitle}
          </p>
          <p className="pixel relative mt-3 text-[10px] font-black text-[var(--fg-muted)]">2026</p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link href="/play" onClick={() => sfx.start()}>
            <span
              className="pxl-btn bob inline-block px-12 py-4 text-lg font-black"
              style={{
                background: 'linear-gradient(160deg, #ffcf3f, #f0a500)',
                color: '#4a3300',
              }}
            >
              <span className="pixel block text-sm">START</span>
              <span className="mt-1 block text-lg font-black">{s.play}</span>
            </span>
          </Link>
          <Link
            href="/live"
            className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black text-[var(--fg-muted)]"
            style={{ background: 'rgba(255,255,255,0.88)', boxShadow: 'var(--shadow-sm)' }}
          >
            <span className="pixel text-[9px]" dir="ltr">
              PRESENTER MODE
            </span>
            {lang === 'ar' && <span>{s.presenter}</span>}
          </Link>
          <div className="mt-3 flex items-center gap-2" role="group" aria-label="Language">
            {(['ar', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => {
                  sfx.select();
                  setLang(l);
                }}
                aria-pressed={lang === l}
                className="pxl px-4 py-2 text-xs font-black"
                style={{
                  background: lang === l ? '#2fa96a' : '#ffffff',
                  color: lang === l ? '#fff' : 'var(--fg-muted)',
                }}
              >
                {l === 'ar' ? 'العربية' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="veil pxl w-full space-y-6 p-5 sm:p-6">
        {/* ---------------------------------------------------- المستويات */}
        <section className="w-full">
          <h2 className="ink mb-3 text-lg font-black">{s.levels}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {LEVELS.map((l, i) => (
              <Panel key={l.id} className="flex items-center gap-3 px-4 py-3">
                <span className="pixel text-[10px] text-[var(--fg-dim)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: l.color }}
                />
                <span className="ink-sm text-sm font-black">{lang === 'ar' ? l.ar : l.en}</span>
                <span className="tnum ink-sm ms-auto text-xs text-[var(--fg-muted)]">
                  {l.from === l.to ? l.from : `${l.from}–${l.to}`}
                </span>
              </Panel>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------- نظام الجوائز */}
        <section className="w-full">
          <h2 className="ink mb-3 text-lg font-black">{s.prizes}</h2>
          <Panel className="divide-y-4 divide-[var(--ink)]">
            {REWARDS.map((r) => (
              <div key={r.at} className="flex items-center gap-3 px-4 py-3">
                <Chip color="#e0921a">
                  <span className="pixel text-[10px]">{String(r.at).padStart(2, '0')}</span>
                </Chip>
                <span className="ink-sm text-xs text-[var(--fg-muted)]">{s.correctAnswers}</span>
                <span className="ink-sm ms-auto text-sm font-black">
                  {lang === 'ar' ? r.ar : r.en}
                </span>
              </div>
            ))}
          </Panel>
        </section>

        {/* ------------------------------------------------ الرسالة الختامية */}
        <Panel tone="dark" className="w-full p-6 text-center">
          <p className="ink text-xl font-black text-[var(--gold)]">{s.slogan}</p>
          <ul className="mt-4 space-y-1.5 text-sm font-bold leading-7" style={{ color: '#c6d8ee' }}>
            {s.closing.map((l) => (
              <li key={l} className="ink-sm">
                {l}
              </li>
            ))}
          </ul>
          <p className="ink-sm mt-4 text-sm font-black text-[var(--green)]">{s.tagline}</p>
        </Panel>
      </div>

      <p className="pixel mt-8 self-center text-[8px] text-[var(--fg-dim)]">© 2026</p>
    </Shell>
  );
}
