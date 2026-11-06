'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePrefs } from '@/lib/usePrefs';
import { EventPlayer } from '@/lib/event/player';
import { eventStrings } from '@/lib/event/strings';
import Shell from '@/components/Shell';
import { Panel, PixelButton } from '@/components/PixelUI';

export function useEventPlayer(correct: number, finished: boolean, running: boolean) {
  const search = useSearchParams();
  const code = search.get('event');
  const controller = useMemo(() => new EventPlayer(code ?? ''), [code]);
  const view = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.serverSnapshot);
  const joined = Boolean(view.player);
  useEffect(() => {
    if (code !== null) return controller.connect();
  }, [controller, code]);
  useEffect(() => {
    controller.updateQuiz(correct, finished, running);
  }, [controller, correct, finished, running, joined]);
  return { active: code !== null, controller, ...view };
}

export default function EventPlayerGate({ event, total, complete = false }: {
  event: ReturnType<typeof useEventPlayer>; total: number; complete?: boolean;
}) {
  const { lang } = usePrefs();
  const s = eventStrings[lang];
  const [team, setTeam] = useState('');
  const [nickname, setNickname] = useState('');
  const ended = event.info?.ended || event.status === 'ended';
  const done = complete || event.player?.finished;
  const canJoin = !ended && !done && event.info && ['ready', 'invalid', 'joining'].includes(event.status);
  const heading = ended ? s.ended : done ? s.finished : s.title;
  return (
    <Shell dim={0.3}>
      <section className="my-auto py-10" data-testid="event-player-gate">
        <Panel className="p-6 sm:p-8">
          <h1 className="text-3xl font-black">{heading}</h1>
          {event.info && <p className="mt-3 text-lg font-bold">{s.code}: <b dir="ltr">{event.info.code}</b></p>}
          {(ended || done) ? (
            <div className="mt-6 space-y-3" role="status">
              {event.player && <p className="text-xl font-bold">{event.player.nickname} · {s.score}: {event.player.correct} / {event.player.total}</p>}
              <p>{s.waiting}</p>
            </div>
          ) : canJoin ? (
            <form className="mt-6 space-y-5" onSubmit={(e) => { e.preventDefault(); event.controller.join(team, nickname, total); }}>
              <fieldset disabled={event.status === 'joining'}>
                <legend className="mb-3 text-lg font-black">{s.team}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {event.info!.teams.map((t) => (
                    <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-4 font-bold">
                      <input type="radio" name="event-team" value={t.id} checked={team === t.id} onChange={() => setTeam(t.id)} required />
                      {t.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block font-bold">
                {s.nickname}
                <input data-testid="event-nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={16} required autoComplete="off" aria-describedby="event-nickname-hint" disabled={event.status === 'joining'} className="mt-2 block w-full rounded-xl border-2 border-[var(--line)] bg-white p-3 text-lg" />
              </label>
              <p id="event-nickname-hint" className="text-sm leading-7">{s.nicknameHint}</p>
              {event.status === 'invalid' && <p role="alert" className="font-bold text-red-800">{s.invalid}</p>}
              <PixelButton type="submit" className="w-full" disabled={event.status === 'joining' || !team || !nickname.trim()}>
                {event.status === 'joining' ? s.joining : s.enter}
              </PixelButton>
              <p className="text-sm leading-7 text-[var(--fg-muted)]">{s.privacy}</p>
            </form>
          ) : <p className="mt-6 font-bold" role="status" data-testid={event.status === 'unavailable' ? 'event-unavailable' : undefined}>
            {event.status === 'unknown' ? s.unknown : event.status === 'full' ? s.full : event.status === 'unavailable' ? s.unavailable : s.connecting}
          </p>}
          <Link href="/" className="mt-8 inline-block font-bold underline underline-offset-4">{s.home}</Link>
        </Panel>
      </section>
    </Shell>
  );
}
