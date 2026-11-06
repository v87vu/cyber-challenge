'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Shell from '@/components/Shell';
import { Panel, PixelButton } from '@/components/PixelUI';
import { setLang, type Lang } from '@/lib/prefs';
import { usePrefs } from '@/lib/usePrefs';
import { leaderboard, MAX_PLAYERS, PRESENTER_KEY, validSession, validTeams, type EventSession } from '@/lib/event/model';
import { connectHost, type HostStatus } from '@/lib/event/host';
import { realtimeAvailable } from '@/lib/event/realtime';
import styles from './EventPresenter.module.css';

const copy = {
  ar: {
    title: 'تحدّي الفرق', setup: 'جهّز الفرق، ثم اعرض رمز الفعالية على الشاشة.', teams: 'أسماء الفرق', team: 'الفريق',
    defaults: ['الفريق الأحمر', 'الفريق الأزرق'], add: 'إضافة فريق', remove: 'حذف الفريق', start: 'بدء الفعالية',
    code: 'رمز الفعالية', join: 'افتح الرابط على هاتفك واختر فريقك', connected: 'متصل الآن', admitted: 'مشارك',
    average: 'متوسط النتيجة', progress: 'أكمل التحدّي', time: 'متوسط الوقت', seconds: 'ث', end: 'إنهاء الفعالية',
    ended: 'انتهت الفعالية — النتائج النهائية', winner: 'الفريق الفائز', winners: 'تعادل بين الفرق', empty: 'بانتظار انضمام اللاعبين…',
    unavailable: 'وضع الفعاليات غير متاح حالياً. حاول مجدداً لاحقاً.', connecting: 'جارٍ الاتصال…', ready: 'الفعالية مباشرة',
    offline: 'انقطع الاتصال. النتائج محفوظة؛ أعد الاتصال لمتابعة التحديثات.', occupied: 'هذه الفعالية مفتوحة في شاشة أخرى. أغلقها هناك ثم أعد المحاولة.',
    storage: 'تعذّر الحفظ في المتصفح. أبقِ هذه الصفحة مفتوحة حتى نهاية الفعالية.', invalid: 'أدخل من ٢ إلى ٦ أسماء فرق مختلفة، حتى ٣٢ حرفاً، باستخدام الحروف والأرقام والمسافات.',
    retry: 'إعادة الاتصال', newEvent: 'فعالية جديدة', home: 'الرئيسية', rules: 'الترتيب حسب متوسط النسبة المئوية لكل لاعب؛ وعند التعادل يفوز الأقل في متوسط الوقت.',
    keep: 'أبقِ هذه الشاشة مفتوحة طوال الفعالية. يمكن للّاعبين الانضمام حتى نهايتها.', noWinner: 'لم ينضم أي لاعب إلى هذه الفعالية.',
  },
  en: {
    title: 'Team challenge', setup: 'Name your teams, then show the event code on the big screen.', teams: 'Team names', team: 'Team',
    defaults: ['Red team', 'Blue team'], add: 'Add team', remove: 'Remove team', start: 'Start event',
    code: 'Event code', join: 'Open this link on your phone and choose your team', connected: 'connected now', admitted: 'players',
    average: 'Average score', progress: 'Completed challenge', time: 'Average time', seconds: 's', end: 'End event',
    ended: 'Event ended — final results', winner: 'Winning team', winners: 'Teams tied', empty: 'Waiting for players to join…',
    unavailable: 'Event mode is unavailable right now. Please try again later.', connecting: 'Connecting…', ready: 'Event is live',
    offline: 'Connection lost. Results are saved; reconnect to resume updates.', occupied: 'This event is open on another screen. Close it there, then try again.',
    storage: 'Browser storage is unavailable. Keep this page open until the event ends.', invalid: 'Enter 2–6 distinct team names, up to 32 characters, using letters, numbers and spaces.',
    retry: 'Reconnect', newEvent: 'New event', home: 'Home', rules: 'Ranked by each team’s average player percentage; ties go to the lowest average time.',
    keep: 'Keep this screen open during the event. Players can join until you end it.', noWinner: 'No players joined this event.',
  },
  ur: {
    title: 'ٹیم چیلنج', setup: 'ٹیموں کے نام لکھیں، پھر ایونٹ کا کوڈ بڑی اسکرین پر دکھائیں۔', teams: 'ٹیموں کے نام', team: 'ٹیم',
    defaults: ['سرخ ٹیم', 'نیلی ٹیم'], add: 'ٹیم شامل کریں', remove: 'ٹیم ہٹائیں', start: 'ایونٹ شروع کریں',
    code: 'ایونٹ کا کوڈ', join: 'اپنے فون پر یہ لنک کھولیں اور ٹیم منتخب کریں', connected: 'ابھی منسلک', admitted: 'کھلاڑی',
    average: 'اوسط اسکور', progress: 'چیلنج مکمل', time: 'اوسط وقت', seconds: 'سیکنڈ', end: 'ایونٹ ختم کریں',
    ended: 'ایونٹ ختم — حتمی نتائج', winner: 'فاتح ٹیم', winners: 'ٹیمیں برابر ہیں', empty: 'کھلاڑیوں کی آمد کا انتظار…',
    unavailable: 'ایونٹ موڈ فی الحال دستیاب نہیں۔ بعد میں دوبارہ کوشش کریں۔', connecting: 'رابطہ ہو رہا ہے…', ready: 'ایونٹ جاری ہے',
    offline: 'رابطہ منقطع ہے۔ نتائج محفوظ ہیں؛ اپ ڈیٹس کے لیے دوبارہ رابطہ کریں۔', occupied: 'یہ ایونٹ دوسری اسکرین پر کھلا ہے۔ وہاں بند کر کے دوبارہ کوشش کریں۔',
    storage: 'براؤزر میں محفوظ نہیں ہو سکا۔ ایونٹ کے اختتام تک یہ صفحہ کھلا رکھیں۔', invalid: '۲ سے ۶ الگ ٹیم نام لکھیں، زیادہ سے زیادہ ۳۲ حروف؛ صرف حروف، اعداد اور خالی جگہ استعمال کریں۔',
    retry: 'دوبارہ رابطہ کریں', newEvent: 'نیا ایونٹ', home: 'ہوم', rules: 'درجہ بندی ہر ٹیم کے کھلاڑیوں کے اوسط فیصد سے ہوتی ہے؛ برابری پر کم اوسط وقت والی ٹیم جیتتی ہے۔',
    keep: 'ایونٹ کے دوران یہ اسکرین کھلی رکھیں۔ اختتام تک کھلاڑی شامل ہو سکتے ہیں۔', noWinner: 'اس ایونٹ میں کوئی کھلاڑی شامل نہیں ہوا۔',
  },
};
const colors = ['#bb3434', '#2269b1', '#18804e', '#90600c', '#7754a8', '#137b85'];
const randomCode = () => String(1000 + crypto.getRandomValues(new Uint32Array(1))[0] % 9000);

export default function EventPresenter() {
  const { lang } = usePrefs();
  const t = copy[lang];
  const [names, setNames] = useState<string[] | null>(null);
  const [session, setSession] = useState<EventSession | null>(null);
  const [status, setStatus] = useState<HostStatus>('connecting');
  const [count, setCount] = useState(0);
  const [lockReady, setLockReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [origin, setOrigin] = useState('');
  const controller = useRef<ReturnType<typeof connectHost>>(null);
  const mounted = useRef(false);
  const teams = names ?? t.defaults;

  const connect = useCallback(function open(value: EventSession, fresh = false, attempt = 0) {
    controller.current?.close();
    setStatus('connecting');
    setCount(0);
    controller.current = connectHost(value, {
      change: (next) => { if (mounted.current) setSession(next); },
      count: (next) => { if (mounted.current) setCount(next); },
      storageError: () => { if (mounted.current) setStorageError(true); },
      status: (next) => {
        if (!mounted.current) return;
        if (next === 'occupied' && fresh && attempt < 7) {
          // Close the old channel before choosing another unoccupied code.
          queueMicrotask(() => { if (mounted.current) open({ ...value, code: randomCode() }, true, attempt + 1); });
        } else setStatus(next);
      },
    });
    if (!controller.current) setStatus('unavailable');
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    let release: (() => void) | undefined;
    const initialize = () => {
      if (cancelled) return;
      setOrigin(window.location.origin);
      setLockReady(true);
      try {
        const raw = localStorage.getItem(PRESENTER_KEY);
        const saved: unknown = raw ? JSON.parse(raw) : null;
        if (validSession(saved)) { setSession(saved); connect(saved); return; }
      } catch { setStorageError(true); }
      setStatus(realtimeAvailable ? 'ready' : 'unavailable');
    };
    // A browser-wide lock prevents refreshed or duplicated tabs from forking the saved roster.
    if (navigator.locks) {
      void navigator.locks.request(PRESENTER_KEY, { ifAvailable: true }, async (lock) => {
        if (cancelled) return;
        if (!lock) { setStatus('occupied'); return; }
        initialize();
        await new Promise<void>((resolve) => { release = resolve; });
      }).catch(() => { if (!cancelled) setStatus('unavailable'); });
    } else queueMicrotask(initialize);
    return () => { cancelled = true; mounted.current = false; controller.current?.close(); release?.(); };
  }, [connect]);

  const start = () => {
    const chosen = teams.map((name, i) => ({ id: `team-${i + 1}`, name: name.trim() }));
    if (!validTeams(chosen)) { setInvalid(true); return; }
    setInvalid(false);
    connect({ id: crypto.randomUUID(), code: randomCode(), teams: chosen, ended: false, players: [] }, true);
  };
  const reset = () => {
    controller.current?.close(); controller.current = null;
    try { localStorage.removeItem(PRESENTER_KEY); } catch { setStorageError(true); }
    setSession(null); setCount(0); setStatus('ready');
  };
  const rows = session ? leaderboard(session) : [];
  const ranked = rows.filter((row) => row.count > 0);
  const winners = ranked.filter((row) => row.average === ranked[0]?.average && row.time === ranked[0]?.time);
  const showError = status === 'offline' || status === 'occupied' || status === 'unavailable';

  return (
    <Shell wide>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="rounded-xl bg-white px-4 py-2 font-bold">{t.home}</Link>
        <div className="flex gap-2" role="group" aria-label="Language">
          {(['ar', 'en', 'ur'] as Lang[]).map((l) => <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-bold" style={{ background: lang === l ? '#17385c' : '#fff', color: lang === l ? '#fff' : 'var(--fg)' }}>{l === 'ar' ? 'العربية' : l === 'en' ? 'English' : 'اردو'}</button>)}
        </div>
      </header>
      <h1 className="mb-5 text-3xl font-black sm:text-4xl">{t.title}</h1>
      {showError && <Panel tone="red" className="mb-5 p-5"><p role="alert" data-testid={!realtimeAvailable ? "event-unavailable" : undefined}>{t[status]}</p>{lockReady && session && realtimeAvailable && <PixelButton className="mt-3" color="slate" onClick={() => connect(session)}>{t.retry}</PixelButton>}{((!lockReady && status === 'occupied') || (lockReady && !session && realtimeAvailable)) && <PixelButton className="mt-3" color="slate" onClick={() => window.location.reload()}>{t.retry}</PixelButton>}</Panel>}
      {storageError && <Panel tone="gold" className="mb-5 p-4"><p role="status">{t.storage}</p></Panel>}
      {!session ? <Panel className="mx-auto w-full max-w-3xl p-6 sm:p-8">
        <p className="mb-6 text-lg">{t.setup}</p>
        <fieldset disabled={!lockReady || status === 'connecting'}>
          <legend className="mb-4 text-xl font-black">{t.teams}</legend>
          <div className="space-y-3">{teams.map((name, i) => <div key={i} className="flex items-end gap-3">
            <label className="min-w-0 flex-1"><span className="mb-1 block text-sm font-bold">{t.team} {i + 1}</span><input data-testid={`event-team-name-${i + 1}`} value={name} maxLength={32} onChange={(e) => setNames(teams.map((n, j) => j === i ? e.target.value : n))} className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-lg" /></label>
            {teams.length > 2 && <button aria-label={`${t.remove} ${i + 1}`} onClick={() => setNames(teams.filter((_, j) => j !== i))} className="min-h-12 rounded-xl border border-[var(--line)] px-4 font-bold">×</button>}
          </div>)}</div>
          <div className="mt-5 flex flex-wrap items-center gap-3"><PixelButton color="slate" disabled={teams.length >= 6} onClick={() => setNames([...teams, `${t.team} ${teams.length + 1}`])}>{t.add}</PixelButton><span data-testid="event-start"><PixelButton size="lg" onClick={start} disabled={status !== 'ready' || !realtimeAvailable}>{t.start}</PixelButton></span></div>
        </fieldset>
        {invalid && <p role="alert" className="mt-4 font-bold text-[#8f2320]">{t.invalid}</p>}
        {status === 'connecting' && <p role="status" className="mt-4">{t.connecting}</p>}
      </Panel> : <>
        <Panel className="mb-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div><p className="text-lg font-bold">{t.code}</p><p data-testid="event-code" dir="ltr" className="text-7xl font-black tracking-widest sm:text-8xl">{session.code}</p></div>
            <div className="text-end"><p className="text-2xl font-black"><span data-testid="event-player-count" data-count={count}>{count}</span> {t.connected}</p><p className="mt-2 text-lg">{session.players.length} / {MAX_PLAYERS} {t.admitted}</p><p role="status" className="mt-2 font-bold">{session.ended ? t.ended : status === 'ready' ? t.ready : status === 'connecting' ? t.connecting : ''}</p></div>
          </div>
          {!session.ended && <><p className="mt-5 text-lg">{t.join}</p><p dir="ltr" className="mt-2 break-all text-xl font-black sm:text-3xl">{origin}/play?event={session.code}</p></>}
        </Panel>
        {session.ended && <Panel tone="gold" className="relative mb-5 overflow-hidden p-6 text-center">
          {winners.length > 0 && <div aria-hidden className={styles.confetti}>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${i * 4.3}%`, background: colors[i % colors.length], animationDelay: `${i % 6 * 0.12}s`, transform: `rotate(${i * 27}deg)` }} />)}</div>}
          <p className="text-xl font-bold">{winners.length > 1 ? t.winners : winners.length ? t.winner : t.noWinner}</p><h2 data-testid="event-winner" className="mt-2 break-words text-3xl font-black sm:text-5xl">{winners.map((team) => team.name).join(' · ')}</h2>
        </Panel>}
        <Panel className="overflow-hidden px-5 sm:px-7">
          {rows.map((team, index) => <section data-testid={`event-team-${team.id}`} data-average={team.average} key={team.id} className="border-b border-[var(--line)] py-5 last:border-0">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2"><span className="text-2xl font-black" aria-label={`${index + 1}`}>{index + 1}</span><h2 className="min-w-0 flex-1 break-words text-xl font-black sm:text-2xl">{team.name}</h2><p className="text-base">{team.count} {t.admitted}</p><p className="min-w-36 text-end text-2xl font-black"><span data-testid="team-average">{team.average.toFixed(1)}%</span><span className="ms-2 text-sm font-bold">{t.average}</span></p></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#e4ebf1]" role="progressbar" aria-label={`${team.name} — ${t.average}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={team.average}><div className="h-full rounded-full" style={{ width: `${team.average}%`, background: colors[Number(team.id.slice(-1)) - 1] }} /></div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm font-bold"><p>{t.progress}: {team.progress.toFixed(0)}%</p><p>{t.time}: {team.time.toFixed(0)} {t.seconds}</p></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e4ebf1]" role="progressbar" aria-label={`${team.name} — ${t.progress}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={team.progress}><div className="h-full bg-[#18804e]" style={{ width: `${team.progress}%` }} /></div>
          </section>)}
          {!session.players.length && !session.ended && <p className="pb-5 text-center text-lg font-bold">{t.empty}</p>}
        </Panel>
        <p className="mt-4 text-sm font-bold">{t.rules}</p>
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="max-w-xl text-sm">{t.keep}</p>{session.ended ? <PixelButton color="slate" onClick={reset} disabled={!lockReady || status === 'occupied'}>{t.newEvent}</PixelButton> : <span data-testid="event-end"><PixelButton color="red" onClick={() => controller.current?.end()} disabled={status !== 'ready' && status !== 'offline'}>{t.end}</PixelButton></span>}</footer>
      </>}
    </Shell>
  );
}
