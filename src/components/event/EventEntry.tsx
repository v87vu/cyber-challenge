'use client';

import Link from 'next/link';
import { usePrefs } from '@/lib/usePrefs';
import { eventStrings } from '@/lib/event/strings';
import { realtimeAvailable } from '@/lib/event/realtime';

export default function EventEntry() {
  const { lang } = usePrefs();
  const s = eventStrings[lang];
  return (
    <div className="w-full max-w-sm text-sm">
      <details className="mt-2 rounded-2xl bg-white p-3">
        <summary className="cursor-pointer font-bold">{s.haveCode}</summary>
        {realtimeAvailable ? <form action="/play" className="mt-4 flex items-end gap-2 text-start">
          <label className="min-w-0 flex-1 font-bold">{s.code}
            <input name="event" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} required dir="ltr" placeholder="1234" className="mt-1 block w-full rounded-xl border-2 border-[var(--line)] p-2 text-center text-xl" />
          </label>
          <button type="submit" className="rounded-xl bg-[var(--ink)] px-4 py-3 font-bold text-white">{s.enter}</button>
        </form> : <p className="mt-3" role="status">{s.unavailable}</p>}
      </details>
      <Link href="/event" className="mt-2 inline-block p-2 font-bold underline underline-offset-4">{s.presenter}</Link>
    </div>
  );
}
