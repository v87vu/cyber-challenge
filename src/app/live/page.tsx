'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LETTERS, QUESTIONS, TOTAL, levelOf } from '@/lib/questions';
import { HOST_SCRIPT, MILESTONES } from '@/lib/i18n';
import { usePrefs } from '@/lib/usePrefs';
import Background from '@/components/Background';
import { Chip, Panel, PixelButton } from '@/components/PixelUI';
import { sfx } from '@/lib/sfx';

type Stage = 'intro' | 'question' | 'outro';

export default function Live() {
  const { lang, dir, s } = usePrefs();
  const [stage, setStage] = useState<Stage>('intro');
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [notes, setNotes] = useState(true);

  const q = QUESTIONS[idx];
  const copy = lang === 'ar' ? q.ar : q.en;
  const level = levelOf(q.n);
  const letters = LETTERS[lang];

  const next = useCallback(() => {
    if (stage === 'intro') {
      sfx.start();
      setStage('question');
      return;
    }
    if (stage === 'outro') return;
    if (!revealed) {
      if (q.n === 20) sfx.win();
      else if (MILESTONES[q.n]) sfx.levelup();
      else sfx.correct();
      setRevealed(true);
      return;
    }
    if (idx === QUESTIONS.length - 1) {
      setStage('outro');
      return;
    }
    setIdx((i) => i + 1);
    setRevealed(false);
  }, [stage, revealed, idx, q.n]);

  const prev = useCallback(() => {
    if (stage === 'outro') {
      setStage('question');
      setRevealed(true);
      return;
    }
    if (stage !== 'question') return;
    if (revealed) {
      setRevealed(false);
      return;
    }
    if (idx === 0) {
      setStage('intro');
      return;
    }
    setIdx((i) => i - 1);
    setRevealed(true);
  }, [stage, revealed, idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const fwd = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === ' ' || e.key === 'Enter' || e.key === fwd) {
        e.preventDefault();
        next();
      } else if (e.key === back || e.key === 'Backspace') {
        e.preventDefault();
        prev();
      } else if (e.key.toLowerCase() === 'n') setNotes((v) => !v);
      else if (e.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, dir]);

  // نص المقدّم — يبقى كما ورد من الجهة المنظمة
  const cue =
    stage === 'intro'
      ? HOST_SCRIPT.intro
      : stage === 'outro'
        ? HOST_SCRIPT.win
        : revealed
          ? (MILESTONES[q.n]?.ar ?? HOST_SCRIPT.correct)
          : q.n === 20
            ? HOST_SCRIPT.beforeFinal
            : q.n === 16
              ? HOST_SCRIPT.expertLevel
              : 'اقرأ السؤال والخيارات، ثم استمع لإجابة المتسابق.';

  return (
    <div dir={dir} lang={lang} className="min-h-dvh overflow-x-clip">
      <Background dim={0.5} />
      <main className="flex min-h-dvh flex-col">
        {/* HUD */}
        <header className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full" style={{ background: level.color }} />
            <span className="ink text-lg font-black">
              {stage === 'question' ? (lang === 'ar' ? level.ar : level.en) : s.appTitle}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {stage === 'question' && (
              <span className="pixel ink-sm text-sm text-[var(--gold-dark)]">
                {String(q.n).padStart(2, '0')}/{TOTAL}
              </span>
            )}
            <Link
              href="/"
              className="ink-sm inline-flex items-center gap-2 text-xs font-black text-[var(--fg-muted)] hover:text-white"
            >
              <span className="pixel text-[9px]" dir="ltr">
                MENU
              </span>
              {lang === 'ar' && <span>{s.menu}</span>}
            </Link>
          </div>
        </header>

        {/* شريط التقدّم */}
        <div className="px-6">
          <div
            className="flex gap-1 rounded-full p-1"
            style={{ border: '1px solid var(--line)', background: '#ffffff', boxShadow: 'var(--shadow-sm)' }}
          >
            {QUESTIONS.map((item) => (
              <span
                key={item.n}
                className="h-3 flex-1 rounded-full"
                style={{
                  background:
                    stage === 'outro' || item.n < q.n
                      ? levelOf(item.n).color
                      : item.n === q.n && stage === 'question'
                        ? 'var(--ink)'
                        : 'var(--night-2)',
                }}
              />
            ))}
          </div>
        </div>

        {/* المسرح */}
        <section className="flex flex-1 items-center justify-center px-6 py-8">
          {stage === 'intro' && (
            <div className="anim-in max-w-4xl text-center">
              <p className="pixel ink-sm text-xs text-[var(--fg-muted)]" dir="ltr">
                PRESS SPACE TO START
              </p>
              <h1 className="title-px mt-6 text-6xl font-black leading-[1.3] sm:text-8xl">
                {s.appTitle}
              </h1>
              <p className="ink mt-8 text-xl font-black text-[var(--gold-dark)] sm:text-3xl">
                {s.appSubtitle}
              </p>
              <Panel tone="dark" className="mx-auto mt-10 max-w-3xl p-6">
                <p className="ink-sm text-lg font-black leading-relaxed sm:text-2xl">
                  {HOST_SCRIPT.intro}
                </p>
              </Panel>
            </div>
          )}

          {stage === 'question' && (
            <div key={q.n} className="anim-in w-full max-w-5xl">
              {q.n === 20 && (
                <div className="mb-5 text-center">
                  <p className="pixel ink-sm text-xs text-[var(--gold-dark)] sm:text-sm" dir="ltr">
                    ★ GOLDEN QUESTION ★
                  </p>
                  <p className="ink mt-2 text-2xl font-black text-[var(--gold-dark)] sm:text-4xl">
                    {s.goldenQuestion}
                  </p>
                </div>
              )}
              <Panel tone="dark" className="p-6 sm:p-8">
                <h1 className="ink-sm text-center text-2xl font-black leading-[1.8] sm:text-4xl sm:leading-[1.7]">
                  {copy.text}
                </h1>
              </Panel>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {copy.options.map((opt, i) => {
                  const isCorrect = revealed && i === q.correct;
                  const dimmed = revealed && i !== q.correct;
                  return (
                    <div
                      key={i}
                      className="pxl flex items-start gap-4 px-5 py-4 text-lg font-bold leading-9 sm:text-2xl sm:leading-10"
                      style={{
                        background: isCorrect ? '#dff4e8' : '#ffffff',
                        border: `2px solid ${isCorrect ? '#63c894' : 'var(--line)'}`,
                        opacity: dimmed ? 0.38 : 1,
                      }}
                    >
                      <span
                        className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black"
                        style={{
                          background: isCorrect ? 'var(--green)' : 'var(--night-2)',
                          color: isCorrect ? '#fff' : 'var(--fg-muted)',
                        }}
                      >
                        {letters[i]}
                      </span>
                      <span className="ink-sm">{opt}</span>
                    </div>
                  );
                })}
              </div>
              {revealed && MILESTONES[q.n] && (
                <div className="anim-in mt-7 text-center">
                  <p className="pixel ink-sm text-sm text-[var(--gold-dark)]" dir="ltr">
                    STAGE CLEAR
                  </p>
                  <p className="ink mt-2 text-xl font-black text-[var(--gold-dark)] sm:text-2xl">
                    {lang === 'ar' ? MILESTONES[q.n].ar : MILESTONES[q.n].en}
                  </p>
                </div>
              )}
            </div>
          )}

          {stage === 'outro' && (
            <div className="anim-in max-w-3xl text-center">
              <p className="pixel title-px text-3xl sm:text-5xl" dir="ltr">
                GAME CLEAR!
              </p>
              <div className="mt-6 text-7xl">🏆</div>
              <p className="ink mt-8 text-4xl font-black text-[var(--gold-dark)] sm:text-6xl">
                {s.slogan}
              </p>
              <ul className="mt-8 space-y-2 text-xl font-bold leading-relaxed text-[var(--fg-muted)] sm:text-2xl">
                {s.closing.map((l) => (
                  <li key={l} className="ink-sm">
                    {l}
                  </li>
                ))}
              </ul>
              <p className="ink mt-10 text-2xl font-black text-[var(--green)] sm:text-3xl">
                {s.tagline}
              </p>
            </div>
          )}
        </section>

        {/* شريط المقدّم */}
        {notes && (
          <footer className="px-6 pb-5">
            <Panel className="p-4">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3">
                <Chip color="#d9930b">
                  <span className="pixel text-[9px]">HOST</span>
                </Chip>
                <p className="ink-sm w-full text-sm font-bold leading-7 sm:w-auto sm:flex-1 sm:text-base sm:leading-8">
                  «{cue}»
                </p>
                <div className="flex items-center gap-2">
                  <PixelButton size="sm" color="slate" onClick={prev} sound="none">
                    {s.back}
                  </PixelButton>
                  <PixelButton size="sm" onClick={next} sound="none">
                    {stage === 'question' && !revealed
                      ? lang === 'ar'
                        ? 'اكشف الإجابة'
                        : 'Reveal answer'
                      : s.next}
                  </PixelButton>
                </div>
              </div>
              <p className="mx-auto mt-3 flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1">
                <Hint k="SPACE" label={s.next} />
                <Hint k="F" label={lang === 'ar' ? 'ملء الشاشة' : 'Fullscreen'} />
                <Hint k="N" label={lang === 'ar' ? 'إخفاء شريط المقدّم' : 'Hide host bar'} />
              </p>
            </Panel>
          </footer>
        )}
      </main>
    </div>
  );
}

function Hint({ k, label }: { k: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <kbd
        dir="ltr"
        className="pixel rounded-lg px-2 py-1 text-[8px]"
        style={{ background: '#ffffff', border: '1px solid var(--line)', color: 'var(--fg-muted)' }}
      >
        {k}
      </kbd>
      <span className="ink-sm text-[11px] font-bold text-[var(--fg-muted)]">{label}</span>
    </span>
  );
}
