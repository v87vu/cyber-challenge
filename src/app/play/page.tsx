'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { LETTERS, getQuiz, quizCertificateTitle, quizLevelOf, quizRewardFor } from '@/lib/questions';
import { KIDS_MILESTONES, MILESTONES } from '@/lib/i18n';
import { usePrefs } from '@/lib/usePrefs';
import Shell from '@/components/Shell';
import Mascot, { type Mood } from '@/components/Mascot';
import Burst from '@/components/Burst';
import Certificate from '@/components/Certificate';
import { Chip, Hearts, Panel, PixelButton } from '@/components/PixelUI';
import { mutedServerSnapshot, mutedSnapshot, sfx, subscribeMuted, toggleMuted } from '@/lib/sfx';
import { AGE_GROUPS, setAge, setGender, type AgeGroup, type Gender } from '@/lib/prefs';
import { bestServerSnapshot, bestSnapshot, recordScore, subscribeBest } from '@/lib/best';

type Phase = 'gender' | 'age' | 'intro' | 'countdown' | 'question' | 'correct' | 'milestone' | 'golden' | 'lost' | 'won' | 'review';

const TIME = 45;
const COUNT_FROM = 3;
const QUIZ_KIDS = getQuiz(true);
const QUIZ_ADULT = getQuiz(false);

/* خلط فيشر–ييتس — يُستدعى عند بدء كل جولة فقط (لا أثناء الرسم) */
function shuffled(): number[] {
  const a = [0, 1, 2, 3];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Play() {
  const { gender, lang, age, s } = usePrefs();
  const quiz = age === '12-17' ? QUIZ_KIDS : QUIZ_ADULT;
  const MS = age === '12-17' ? KIDS_MILESTONES : MILESTONES;
  const [phase, setPhase] = useState<Phase>('age');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timerOn, setTimerOn] = useState(true);
  const [left, setLeft] = useState(TIME);
  const [count, setCount] = useState(COUNT_FROM);
  const [cert, setCert] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [copied, setCopied] = useState(false);
  // ترتيب عرض الخيارات لكل سؤال — يتجدد عشوائياً في كل جولة
  const [order, setOrder] = useState<number[][]>([]);
  const [agePick, setAgePick] = useState<AgeGroup | null>(null);

  const mute = useSyncExternalStore(subscribeMuted, mutedSnapshot, mutedServerSnapshot);
  const revealRef = useRef<HTMLDivElement>(null);
  const bestPair = useSyncExternalStore(subscribeBest, bestSnapshot, bestServerSnapshot);
  const best = quiz.kids ? bestPair.kids : bestPair.adult;

  const q = quiz.questions[idx];
  const copy = lang === 'ar' ? q.ar : q.en;
  const ord = order[idx] ?? [0, 1, 2, 3];
  const correctDisplay = ord.indexOf(q.correct);
  const level = quizLevelOf(quiz, q.n);
  const letters = LETTERS[lang];
  const isGolden = q.n === quiz.golden;
  const isExpertFinal = level.id === 6;
  const score = phase === 'won' ? quiz.total : idx;
  const streak = idx;

  const mood: Mood =
    phase === 'lost' ? 'ko'
    : phase === 'won' ? 'win'
    : phase === 'correct' || phase === 'milestone' ? 'happy'
    : phase === 'question' ? 'think'
    : 'idle';

  const lose = useCallback(() => {
    sfx.wrong();
    setNewBest(recordScore(idx, quiz.kids));
    setPhase('lost');
  }, [idx, quiz.kids]);

  const advance = useCallback(() => {
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    setSelected(null);
    setLeft(TIME);
    setPhase(quiz.questions[nextIdx]?.n === quiz.golden ? 'golden' : 'question');
  }, [idx, quiz]);

  const confirm = useCallback(() => {
    if (selected === null) return;
    if (selected === correctDisplay) {
      sfx.correct();
      setPhase('correct');
    } else lose();
  }, [selected, correctDisplay, lose]);

  const next = useCallback(() => {
    if (q.n === quiz.total) {
      sfx.win();
      setNewBest(recordScore(quiz.total, quiz.kids));
      setPhase('won');
    } else if (MS[q.n]) {
      sfx.levelup();
      setPhase('milestone');
    } else advance();
  }, [q.n, advance, MS, quiz.total, quiz.kids]);

  const share = useCallback(async () => {
    const text = s.shareTextWin;
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: s.appTitle, text, url });
        return;
      }
    } catch {
      return; // المستخدم ألغى المشاركة
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [s]);

  const begin = useCallback(() => {
    setOrder(quiz.questions.map(() => shuffled()));
    setIdx(0);
    setSelected(null);
    setLeft(TIME);
    setCount(COUNT_FROM);
    setNewBest(false);
    setPhase('countdown');
  }, [quiz]);

  // العدّ التنازلي قبل السؤال الأول
  useEffect(() => {
    if (phase !== 'countdown') return;
    const t = setTimeout(() => {
      if (count <= 1) {
        sfx.start();
        setPhase('question');
      } else {
        sfx.tick();
        setCount(count - 1);
      }
    }, 620);
    return () => clearTimeout(t);
  }, [phase, count]);

  // مؤقّت السؤال — انتهاء الوقت يُحتسب خسارة
  useEffect(() => {
    if (phase !== 'question' || !timerOn || left <= 0) return;
    const t = setTimeout(() => {
      if (left <= 1) {
        setSelected(null);
        lose();
      } else {
        const tickAt = level.id >= 4 ? 10 : level.id === 3 ? 8 : 6;
        if (left <= tickAt) sfx.tick();
        setLeft(left - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, timerOn, left, lose, level.id]);

  // الاحتفال الذهبي: دحرجة طبول ثم يبدأ السؤال تلقائياً
  useEffect(() => {
    if (phase !== 'golden') return;
    sfx.drumroll();
    const t = setTimeout(() => setPhase('question'), 2600);
    return () => clearTimeout(t);
  }, [phase]);

  // تمرير تلقائي: السؤال الجديد من أعلى الصفحة، والنتيجة إلى مجال الرؤية
  useEffect(() => {
    if (phase === 'question') window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (phase === 'correct') {
      const t = setTimeout(
        () => revealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
        60,
      );
      return () => clearTimeout(t);
    }
  }, [phase, idx]);

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'question') {
        const n = Number(e.key);
        if (n >= 1 && n <= 4) {
          sfx.select();
          setSelected(n - 1);
        }
        if (e.key === 'Enter') confirm();
      } else if (phase === 'correct' && e.key === 'Enter') next();
      else if (phase === 'milestone' && e.key === 'Enter') advance();
      else if (phase === 'golden' && (e.key === 'Enter' || e.key === ' ')) setPhase('question');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, confirm, next, advance]);

  const MenuBtn = (
    <Link
      href="/"
      aria-label={s.menu}
      className="pxl px-2 py-1.5"
      style={{ background: 'var(--panel)' }}
    >
      <span className="pixel text-[10px]">MENU</span>
    </Link>
  );

  const MuteBtn = (
    <button
      onClick={() => {
        toggleMuted();
        if (mute) sfx.select();
      }}
      aria-label={s.sound}
      className="pxl px-2 py-1.5"
      style={{ background: 'var(--panel)' }}
    >
      <span className="pixel text-[10px]">{mute ? 'OFF' : 'ON'}</span>
    </button>
  );

  const MenuLink = (
    <Link
      href="/"
      className="ink-sm inline-flex items-center gap-2 text-xs font-black text-[var(--fg-muted)] hover:text-white"
    >
      <span className="pixel text-[9px]" dir="ltr">
        MENU
      </span>
      {lang === 'ar' && <span>{s.menu}</span>}
    </Link>
  );

  /* ------------------------------------------------- اختيار النوع أولاً */
  if (phase === 'gender') {
    return (
      <Shell dim={0.35}>
        <div className="anim-in flex min-h-[86dvh] flex-col items-center justify-center text-center">
          <div className="flex w-full max-w-md items-center gap-3 self-center">
            <button
              onClick={() => {
                sfx.select();
                setPhase('age');
              }}
              aria-label={s.back}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-black"
              style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', color: 'var(--fg-muted)' }}
            >
              {dirArrow(lang)}
            </button>
            <OnbProgress step={2} className="flex-1" />
          </div>
          <p className="pixel ink-sm mt-6 text-[10px] text-[var(--fg-muted)]" dir="ltr">
            PLAYER SELECT
          </p>
          <h1 className="ink mt-4 text-3xl font-black text-[var(--gold-dark)] sm:text-4xl">
            {s.onbGenderTitle}
          </h1>
          <p className="ink-sm mt-4 text-xs font-bold text-[var(--fg-muted)]">
            {s.onbGenderHint}
          </p>
          <p className="ink-sm blink mt-3 text-sm font-black text-[var(--gold-dark)]">
            ▼ {s.pickCharacter} ▼
          </p>

          <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-4">
            {(['male', 'female'] as Gender[]).map((g) => {
              const accent = g === 'male' ? '#4b8dff' : '#ff6ea3';
              return (
                <button
                  key={g}
                  onClick={() => {
                    setGender(g);
                    setPhase('intro');
                    sfx.confirm();
                  }}
                  className="pxl flex flex-col items-center gap-3 px-3 pb-4 pt-6 transition-transform active:scale-[0.98]"
                  style={{ background: gender === g ? '#eefaf3' : '#ffffff' }}
                >
                  <Mascot gender={g} kid={quiz.kids} mood="happy" size={170} />
                  <span
                    className="w-full rounded-2xl py-1.5 text-base font-black"
                    style={{ background: accent, color: '#fff', boxShadow: 'var(--shadow-sm)' }}
                  >
                    {g === 'male' ? s.male : s.female}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8">{MenuLink}</div>
        </div>
      </Shell>
    );
  }

  /* --------------------------------------------- الفئة العمرية (أسلوب Duo) */
  if (phase === 'age') {
    return (
      <Shell dim={0.35}>
        <div className="anim-in flex min-h-[92dvh] flex-col">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label={s.menu}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-black"
              style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', color: 'var(--fg-muted)' }}
            >
              {dirArrow(lang)}
            </Link>
            <OnbProgress step={1} className="flex-1" />
          </div>

          {/* الشخصية تسأل عبر فقاعة حوار */}
          <div className="mt-6 flex items-end gap-3">
            <Mascot gender={gender} kid={agePick === '12-17'} mood="think" size={120} />
            <div className="relative mb-8 flex-1">
              <div
                className="rounded-3xl px-4 py-3"
                style={{ background: '#fff', border: '2px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}
              >
                <p className="text-lg font-black">{lang === 'ar' ? 'كم عمرك؟' : s.onbAgeTitle}</p>
                <p className="mt-0.5 text-[11px] font-bold" style={{ color: 'var(--muted, #7e94aa)' }}>
                  {s.onbAgeHint}
                </p>
              </div>
              <span
                className="absolute -bottom-[9px] start-6 h-4 w-4 rotate-45"
                style={{ background: '#fff', borderInlineStart: '2px solid var(--line)', borderBottom: '2px solid var(--line)' }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {AGE_GROUPS.map((val, i) => {
              const active = agePick === val;
              return (
                <button
                  key={val}
                  onClick={() => {
                    sfx.select();
                    setAgePick(val);
                  }}
                  aria-pressed={active}
                  className="rounded-2xl px-3 py-3.5 text-start text-sm font-black transition-transform active:scale-[0.98]"
                  style={{
                    background: active ? '#ddf4ff' : '#ffffff',
                    border: `2px solid ${active ? '#1cb0f6' : 'var(--line)'}`,
                    borderBottomWidth: 4,
                    color: active ? '#1899d6' : 'var(--fg)',
                  }}
                >
                  {s.ageGroups[i]}
                </button>
              );
            })}
          </div>

          <div
            className="sticky bottom-0 mt-auto pt-6"
            style={{ background: 'linear-gradient(180deg, rgba(240,248,255,0) 0%, rgba(240,248,255,0.92) 40%)', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <button
              disabled={agePick === null}
              onClick={() => {
                if (agePick === null) return;
                setAge(agePick);
                sfx.confirm();
                setPhase('gender');
              }}
              className="w-full rounded-2xl px-6 py-4 text-lg font-black uppercase tracking-wide transition-transform active:translate-y-[3px] disabled:cursor-not-allowed"
              style={{
                background: agePick === null ? '#e5e9ef' : '#58cc02',
                color: agePick === null ? '#a9b4c0' : '#ffffff',
                boxShadow: agePick === null ? 'none' : '0 4px 0 0 #46a302',
              }}
            >
              {s.continue}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ---------------------------------------------------------- شاشة البداية */
  if (phase === 'intro') {
    return (
      <Shell dim={0.45}>
        <div className="anim-in flex min-h-[80dvh] flex-col justify-center text-center">
          <div className="flex justify-center">
            <Mascot gender={gender} kid={quiz.kids} mood="idle" size={150} />
          </div>
          <p className="pixel ink-sm mt-4 text-[10px] text-[var(--fg-muted)]">READY?</p>
          <h1 className="ink mt-3 text-4xl font-black text-[var(--gold-dark)] sm:text-5xl">
            {s.ready}
          </h1>
          {best > 0 && (
            <p className="ink-sm mt-4 text-xs font-black text-[var(--gold-dark)]">
              🏆 {s.bestScore}: {best} / {quiz.total}
            </p>
          )}

          <div className="mx-auto mt-7 w-full max-w-md space-y-2 text-start">
            <Rule badge="1UP">{s.rule1}</Rule>
            <Rule badge="∞">{s.rule2}</Rule>
            <Rule badge="?!">{s.rule3}</Rule>
          </div>

          <Panel className="mx-auto mt-4 flex w-full max-w-md items-center justify-between px-4 py-3 text-start">
            <span>
              <span className="ink-sm block text-sm font-black">{s.timer}</span>
              <span className="tnum ink-sm block text-xs text-[var(--fg-muted)]">
                {s.timerSub}
              </span>
            </span>
            <button
              role="switch"
              aria-checked={timerOn}
              aria-label={s.timer}
              onClick={() => {
                sfx.select();
                setTimerOn((v) => !v);
              }}
              className="pxl px-3 py-2"
              style={{
                background: timerOn ? '#2fa96a' : 'var(--night-2)',
                color: timerOn ? '#fff' : 'var(--fg-muted)',
              }}
            >
              <span className="pixel text-[10px]">{timerOn ? 'ON' : 'OFF'}</span>
            </button>
          </Panel>

          <div className="mx-auto mt-6 w-full max-w-md">
            <PixelButton
              size="lg"
              className="w-full"
              sound="none"
              onClick={() => {
                sfx.confirm();
                begin();
              }}
            >
              <span className="pixel">START</span>
              <span className="ms-3">{s.start}</span>
            </PixelButton>
          </div>

          <div className="mt-6 flex justify-center">{MenuLink}</div>
        </div>
      </Shell>
    );
  }

  /* ------------------------------------------------------- العدّ التنازلي */
  if (phase === 'countdown') {
    return (
      <Shell dim={0.45}>
        <div className="flex min-h-[80dvh] flex-col items-center justify-center text-center">
          <Mascot gender={gender} kid={quiz.kids} mood="idle" size={170} />
          <p key={count} className="title-px count-pop mt-8 text-8xl font-black sm:text-9xl">
            {count}
          </p>
          <p className="ink-sm mt-6 text-sm font-black text-[var(--fg-muted)]">{s.getReady}</p>
        </div>
      </Shell>
    );
  }

  /* ---------------------------------------------------------- شاشة المراجعة */
  if (phase === 'review') {
    return (
      <Shell dim={0.6}>
        <div className="anim-in">
          <div className="flex items-center justify-between gap-3">
            <h1 className="ink text-xl font-black">{s.reviewMode}</h1>
            <div className="flex items-center gap-2">
              <PixelButton size="sm" color="slate" onClick={() => setPhase('intro')}>
                {s.finish}
              </PixelButton>
              {MenuBtn}
            </div>
          </div>
          <p className="ink-sm mt-3 text-xs font-bold leading-7 text-[var(--fg-muted)]">
            {s.reviewHint}
          </p>
          <ol className="mt-5 space-y-3">
            {quiz.questions.map((item) => {
              const c = lang === 'ar' ? item.ar : item.en;
              const lv = quizLevelOf(quiz, item.n);
              return (
                <Panel key={item.n} className="p-4" tone="panel">
                  <div className="flex items-center gap-2">
                    <Chip color={lv.color}>
                      <span className="pixel text-[9px]">
                        {String(item.n).padStart(2, '0')}
                      </span>
                    </Chip>
                    <span className="ink-sm text-[11px] font-black text-[var(--fg-muted)]">
                      {s.question} {item.n} · {lang === 'ar' ? lv.ar : lv.en}
                    </span>
                  </div>
                  <p className="ink-sm mt-3 text-sm font-black leading-8">{c.text}</p>
                  <div
                    className="ink-sm mt-3 rounded-2xl px-3 py-2 text-xs font-black leading-7"
                    style={{ background: '#e6f7ee', color: '#135f3c', border: '1px solid #bfe8d2' }}
                  >
                    {letters[item.correct]}) {c.options[item.correct]}
                  </div>
                  <p className="ink-sm mt-2 text-xs font-bold leading-7 text-[var(--fg-muted)]">
                    {c.explanation}
                  </p>
                </Panel>
              );
            })}
          </ol>
          <PixelButton size="lg" className="mt-6 w-full" onClick={begin}>
            {s.retry}
          </PixelButton>
        </div>
      </Shell>
    );
  }

  /* ---------------------------------------------------------- شاشة الانتقال */
  if (phase === 'milestone') {
    return (
      <Shell dim={0.45}>
        <div className="anim-in flex min-h-[80dvh] flex-col items-center justify-center text-center">
          <Mascot gender={gender} kid={quiz.kids} mood="happy" size={150} />
          <p className="pixel ink mt-6 text-lg text-[var(--gold-dark)] sm:text-2xl" dir="ltr">
            STAGE CLEAR
          </p>
          <Panel tone="dark" className="mt-6 w-full max-w-md p-6">
            <p className="ink text-xl font-black leading-relaxed">
              {lang === 'ar' ? MS[q.n].ar : MS[q.n].en}
            </p>
            <p className="tnum ink-sm mt-3 text-sm font-bold" style={{ color: '#c6d8ee' }}>
              {q.n} / {quiz.total}
            </p>
            {q.n === 15 && (
              <p className="ink-sm mt-4 text-sm font-black leading-7 text-[var(--red)]">
                {s.expertStage}
              </p>
            )}
          </Panel>
          <PixelButton size="lg" className="mt-7 w-full max-w-md" onClick={advance}>
            {s.continue}
          </PixelButton>
          <div className="mt-5">{MenuLink}</div>
        </div>
      </Shell>
    );
  }

  /* --------------------------------------------------- الاحتفال الذهبي */
  if (phase === 'golden') {
    return (
      <Shell dim={0.75}>
        <button
          onClick={() => setPhase('question')}
          className="flex min-h-[86dvh] w-full flex-col items-center justify-center text-center"
          aria-label={s.goldenQuestion}
        >
          <span
            aria-hidden
            className="pointer-events-none fixed inset-0"
            style={{
              zIndex: -5,
              background:
                'radial-gradient(circle at 50% 40%, rgba(255,207,63,0.30) 0%, rgba(12,26,50,0.66) 36%, rgba(7,16,34,0.94) 100%)',
            }}
          />
          <p className="count-in text-7xl" style={{ color: '#ffcf3f', filter: 'drop-shadow(0 6px 22px rgba(255,207,63,0.55))' }}>
            ★
          </p>
          <p className="pixel ink-sm mt-6 text-xs text-[#ffb020]" dir="ltr">
            ★ GOLDEN QUESTION ★
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl" style={{ color: '#ffcf3f' }}>
            {s.goldenQuestion}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-xs font-bold leading-7" style={{ color: '#dbe7fa' }}>
            {quiz.kids ? s.goldenHintKids : s.goldenHint}
          </p>
          <p className="blink mt-8 text-sm font-black" style={{ color: '#bcd2f0' }}>
            {s.getReady}
          </p>
        </button>
      </Shell>
    );
  }

  /* ---------------------------------------------------------- شاشة الخسارة */
  if (phase === 'lost') {
    const reward = quizRewardFor(quiz, score);
    const timedOut = selected === null;
    return (
      <Shell dim={0.6}>
        <div className="anim-in">
          <div
            aria-hidden
            className="flash-red pointer-events-none fixed inset-0 z-40"
            style={{ background: 'var(--red)' }}
          />
          <Panel tone="red" className="shake p-6 text-center">
            <div className="flex justify-center">
              <Mascot gender={gender} kid={quiz.kids} mood="ko" size={140} />
            </div>
            <p className="pixel ink mt-3 text-xl text-[var(--red-dark)] sm:text-3xl" dir="ltr">
              GAME OVER
            </p>
            <h1 className="ink mt-4 text-xl font-black">{timedOut ? s.timeUp : s.wrongAnswer}</h1>
            <p className="ink-sm mx-auto mt-3 max-w-md text-xs font-bold leading-7">
              {s.keepLearning}
            </p>
          </Panel>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label={s.yourScore} value={`${score} / ${quiz.total}`} />
            <Stat
              label={s.reached}
              value={lang === 'ar' ? quizLevelOf(quiz, Math.max(1, score || 1)).ar : quizLevelOf(quiz, Math.max(1, score || 1)).en}
            />
          </div>

          {newBest && (
            <Panel tone="gold" className="mt-3 px-4 py-3 text-center">
              <span className="pixel ink-sm text-[10px]" dir="ltr">
                NEW RECORD!
              </span>
              <span className="ink-sm ms-3 text-sm font-black">{s.newRecord}</span>
            </Panel>
          )}
          {reward && (
            <Panel tone="gold" className="mt-3 px-4 py-3 text-center">
              <span className="ink-sm text-sm font-black">
                🏅 {s.earned}: {lang === 'ar' ? reward.ar : reward.en}
              </span>
            </Panel>
          )}
          {best > 0 && (
            <p className="ink-sm mt-3 text-center text-xs font-black text-[var(--fg-muted)]">
              {s.bestScore}: {best} / {quiz.total}
            </p>
          )}

          <Panel className="mt-5 p-5">
            <Chip color={level.color}>
              <span className="pixel text-[9px]">{String(q.n).padStart(2, '0')}</span>
            </Chip>
            <p className="ink-sm mt-3 text-sm font-black leading-8">{copy.text}</p>
            <div className="mt-4 space-y-2">
              {ord.map((oi, di) => {
                const opt = copy.options[oi];
                const isCorrect = oi === q.correct;
                const isPicked = di === selected;
                if (!isCorrect && !isPicked) return null;
                return (
                  <div
                    key={oi}
                    className="ink-sm flex items-start gap-3 rounded-2xl px-3 py-2.5 text-xs font-black leading-7"
                    style={{
                      background: isCorrect ? '#e6f7ee' : '#fdecec',
                      color: isCorrect ? '#135f3c' : '#8f2320',
                      border: `1px solid ${isCorrect ? '#bfe8d2' : '#f5c9c7'}`,
                    }}
                  >
                    <span>{letters[di]})</span>
                    <span>{opt}</span>
                    <span className="pixel ms-auto shrink-0 text-[8px] opacity-80" dir="ltr">
                      {isCorrect ? 'CORRECT' : 'YOU'}
                    </span>
                  </div>
                );
              })}
            </div>
            <p
              className="ink-sm mt-4 border-t pt-4 text-xs font-bold leading-8 text-[var(--fg-muted)]"
              style={{ borderColor: 'var(--line)' }}
            >
              {copy.explanation}
            </p>
          </Panel>

          <div className="mt-5 space-y-2">
            <PixelButton size="lg" className="w-full" onClick={begin}>
              <span className="pixel text-xs">RETRY</span>
              <span className="ms-3">{s.retry}</span>
            </PixelButton>
            <PixelButton size="md" color="slate" className="w-full" onClick={() => setPhase('review')}>
              {s.reviewMode}
            </PixelButton>
            {score >= quiz.certMin && (
              <PixelButton size="md" color="green" className="w-full" onClick={() => setCert(true)}>
                {s.getCertificate}
              </PixelButton>
            )}
            <div className="flex justify-center py-2">{MenuLink}</div>
          </div>
        </div>
        {cert && <Certificate score={score} total={quiz.total} title={quizCertificateTitle(quiz, score)[lang]} onClose={() => setCert(false)} />}
      </Shell>
    );
  }

  /* ------------------------------------------------------------ شاشة الفوز */
  if (phase === 'won') {
    return (
      <Shell dim={0.5}>
        <div className="anim-in text-center">
          <p className="pixel title-px text-2xl sm:text-4xl" dir="ltr">
            YOU WIN!
          </p>
          <div className="mt-5 flex items-center justify-center">
            <Mascot gender={gender} kid={quiz.kids} mood="win" size={190} />
          </div>
          <h1 className="ink mt-4 text-3xl font-black text-[var(--gold-dark)]">{s.champion}</h1>
          <p className="ink-sm mx-auto mt-4 max-w-md text-xs font-bold leading-8 text-[var(--fg-muted)]">
            {s.winLine}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-start">
            <Stat label={s.yourScore} value={`${quiz.total} / ${quiz.total}`} />
            <Stat label={s.rank} value={quizCertificateTitle(quiz, quiz.total)[lang]} />
          </div>

          <Panel tone="dark" className="mt-5 p-6">
            <p className="ink text-lg font-black text-[var(--gold)]">{s.slogan}</p>
            <ul className="mt-3 space-y-1 text-xs font-bold leading-7" style={{ color: '#c6d8ee' }}>
              {s.closing.map((l) => (
                <li key={l} className="ink-sm">
                  {l}
                </li>
              ))}
            </ul>
            <p className="ink-sm mt-4 text-sm font-black text-[var(--green)]">{s.tagline}</p>
          </Panel>

          <div className="mt-5 space-y-2">
            <PixelButton size="lg" className="w-full" onClick={() => setCert(true)}>
              {s.getCertificate}
            </PixelButton>
            <PixelButton size="md" color="blue" className="w-full" onClick={share} sound="select">
              {copied ? s.copied : `📣 ${s.shareResult}`}
            </PixelButton>
            <PixelButton size="md" color="slate" className="w-full" onClick={() => setPhase('review')}>
              {s.reviewAll}
            </PixelButton>
            <div className="flex justify-center py-2">{MenuLink}</div>
          </div>
        </div>
        {cert && <Certificate score={quiz.total} total={quiz.total} title={quizCertificateTitle(quiz, quiz.total)[lang]} onClose={() => setCert(false)} />}
      </Shell>
    );
  }

  /* -------------------------------------------------- شاشة السؤال / الكشف */
  const revealed = phase === 'correct';

  const vignette =
    level.id === 6
      ? 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 44%, rgba(6,44,40,0.58) 100%)'
      : level.id === 5
      ? 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 46%, rgba(70,45,0,0.55) 100%)'
      : level.id === 4
        ? 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 50%, rgba(90,10,10,0.5) 100%)'
        : level.id === 3
          ? 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 55%, rgba(6,16,50,0.42) 100%)'
          : null;

  return (
    <Shell dim={0.68}>
      {vignette && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: -5, background: vignette }}
        />
      )}
      <div className="flex flex-1 flex-col">
        {/* HUD */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Hearts alive label={s.oneLife} />
            <Chip color={level.color}>{lang === 'ar' ? level.ar : level.en}</Chip>
          </div>
          <div className="flex items-center gap-2">
            <span className="pixel ink-sm text-[10px] text-[var(--fg-muted)]">
              {String(q.n).padStart(2, '0')}/{quiz.total}
            </span>
            {MuteBtn}
            {MenuBtn}
          </div>
        </div>

        {/* شريط الوقت */}
        {timerOn && !revealed && <TimeBar left={left} total={TIME} />}

        {/* شريط التقدّم */}
        <div
          className="mt-2 flex gap-1 rounded-full p-1"
          style={{ border: '1px solid var(--line)', background: '#ffffff', boxShadow: 'var(--shadow-sm)' }}
        >
          {quiz.questions.map((item) => (
            <span
              key={item.n}
              className="h-2.5 flex-1 rounded-full"
              style={{
                background:
                  item.n < q.n ? quizLevelOf(quiz, item.n).color : item.n === q.n ? 'var(--ink)' : 'var(--night-2)',
              }}
            />
          ))}
        </div>

        {/* الشخصية + السلسلة */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <Mascot gender={gender} kid={quiz.kids} mood={mood} size={96} sweat={level.id >= 3} />
          {streak >= 3 && (
            <span
              className="rounded-full px-3.5 py-1.5 text-xs font-black text-white"
              style={{ background: 'linear-gradient(160deg, #ff9540, #f2600c)', boxShadow: 'var(--shadow-sm)' }}
            >
              🔥 {s.streak} {streak}
            </span>
          )}
        </div>

        {!quiz.kids && q.n === 16 && (
          <Panel tone="red" className="anim-in mt-4 px-4 py-3 text-center">
            <span className="ink-sm text-xs font-black leading-7">{s.expertStage}</span>
          </Panel>
        )}
        {isExpertFinal && q.n === 21 && (
          <div
            className="anim-in mt-4 rounded-3xl px-4 py-3 text-center"
            style={{ background: 'linear-gradient(160deg, #134e4a, #0f766e)', boxShadow: 'var(--shadow)' }}
          >
            <span className="pixel block text-[10px] text-[#7dd3c8]" dir="ltr">
              ⚡ FINAL STAGE ⚡
            </span>
            <span className="mt-1 block text-base font-black text-white">
              {lang === 'ar' ? 'مستوى الخبير الرقمي' : 'Digital Expert Level'}
            </span>
            <span className="mt-1 block text-xs font-bold" style={{ color: '#b9e8e2' }}>
              {lang === 'ar' ? 'سؤالان يفصلانك عن اللقب!' : 'Two questions between you and the title!'}
            </span>
          </div>
        )}
        {isGolden && (
          <Panel tone="gold" className="anim-in mt-4 px-4 py-3 text-center">
            <span className="pixel ink-sm block text-[9px]" dir="ltr">
              ★ GOLDEN QUESTION ★
            </span>
            <span className="ink-sm mt-2 block text-base font-black">{s.goldenQuestion}</span>
            <span className="ink-sm mt-1 block text-xs font-bold leading-6">{quiz.kids ? s.goldenHintKids : s.goldenHint}</span>
          </Panel>
        )}

        <Panel tone="dark" className="anim-in mt-3 p-5" key={q.n}>
          <h1 className="ink-sm text-base font-black leading-9 sm:text-lg sm:leading-10">
            {copy.text}
          </h1>
        </Panel>

        <div className="mt-3 space-y-2">
          {ord.map((oi, di) => {
            const opt = copy.options[oi];
            const picked = selected === di;
            const correct = revealed && oi === q.correct;
            return (
              <button
                key={oi}
                disabled={revealed}
                data-testid="option"
                aria-pressed={picked}
                onClick={() => {
                  sfx.select();
                  setSelected(di);
                }}
                className="pxl flex w-full items-start gap-3 px-3.5 py-3.5 text-start text-sm font-bold leading-8 transition-transform active:scale-[0.99]"
                style={{
                  background: correct ? '#dff4e8' : picked ? '#e8f1ff' : '#ffffff',
                  border: `2px solid ${correct ? '#63c894' : picked ? '#79aef0' : 'var(--line)'}`,
                }}
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                  style={{
                    background: correct ? 'var(--green)' : picked ? 'var(--gold)' : 'var(--night-2)',
                    color: correct ? '#fff' : picked ? '#4a3300' : 'var(--fg-muted)',
                  }}
                >
                  {letters[di]}
                </span>
                <span className="ink-sm">{opt}</span>
              </button>
            );
          })}
        </div>

        {revealed ? (
          <div ref={revealRef} className="anim-in mt-auto pt-5">
            <Panel tone="green" className="relative p-5">
              <Burst />
              <p className="pixel ink-sm text-[10px]" dir="ltr">
                ✓ CORRECT
              </p>
              <p className="ink-sm mt-3 text-sm font-black leading-8">
                {s.correct} {q.n === quiz.total ? s.winLine : s.wellDone}
              </p>
              <p className="ink-sm mt-3 text-xs font-bold leading-8">{copy.explanation}</p>
            </Panel>
            <PixelButton size="lg" className="mt-3 w-full" onClick={next}>
              {q.n === quiz.total ? s.showResult : s.nextQuestion}
            </PixelButton>
          </div>
        ) : (
          <div
            className="sticky bottom-0 z-10 mt-auto pt-5"
            style={{ background: 'linear-gradient(180deg, rgba(240,248,255,0) 0%, rgba(240,248,255,0.94) 45%)', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <PixelButton
              size="lg"
              className="w-full"
              color={selected === null ? 'slate' : 'gold'}
              disabled={selected === null}
              onClick={confirm}
              sound="none"
            >
              {selected === null ? s.pick : s.confirm}
            </PixelButton>
            <p className="ink-sm mt-3 text-center text-[11px] font-bold leading-6 text-[var(--fg-muted)]">
              {s.oneLife}
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------- مكوّنات صغيرة */

function OnbProgress({ step, className = '' }: { step: 1 | 2; className?: string }) {
  return (
    <div
      className={`h-4 overflow-hidden rounded-full ${className}`}
      style={{ background: '#e5e9ef', maxWidth: 420, marginInline: 'auto', width: '100%' }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={2}
      aria-valuenow={step}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${(step / 2) * 100}%`, background: '#58cc02' }}
      />
    </div>
  );
}

function dirArrow(lang: string) {
  return lang === 'ar' ? '→' : '←';
}

function TimeBar({ left, total }: { left: number; total: number }) {
  const cells = 20;
  const filled = Math.ceil((left / total) * cells);
  const danger = left <= 6;
  return (
    <div className="mt-3 flex items-center gap-2 px-1">
      <span className="pixel text-[9px]" style={{ color: danger ? 'var(--red)' : 'var(--fg-muted)' }}>
        TIME
      </span>
      <div className="flex flex-1 gap-[2px]">
        {Array.from({ length: cells }, (_, i) => (
          <span
            key={i}
            className="h-2.5 flex-1 rounded-full"
            style={{
              background: i < filled ? (danger ? 'var(--red)' : 'var(--gold)') : 'var(--night-2)',
            }}
          />
        ))}
      </div>
      <span
        className="pixel tnum text-[10px]"
        style={{ color: danger ? 'var(--red)' : 'var(--fg-muted)' }}
      >
        {String(left).padStart(2, '0')}
      </span>
    </div>
  );
}

function Rule({ badge, children }: { badge: string; children: React.ReactNode }) {
  return (
    <Panel className="flex items-center gap-3 px-4 py-3">
      <span
        className="pixel flex h-8 w-11 shrink-0 items-center justify-center rounded-xl text-[9px]"
        style={{ background: '#ffe9b0', color: '#7a5200' }}
      >
        {badge}
      </span>
      <span className="ink-sm text-xs font-bold leading-7 text-[var(--fg-muted)]">{children}</span>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="px-4 py-3 text-start">
      <p className="ink-sm text-[10px] font-black text-[var(--fg-dim)]">{label}</p>
      <p className="tnum ink-sm mt-2 text-sm font-black">{value}</p>
    </Panel>
  );
}
