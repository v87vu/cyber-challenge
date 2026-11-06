'use client';

import { useState } from 'react';
import type { AdminLanguage, RecentGame } from './types';
import { formatDate, isSensitiveReport, maskContact, playerName, trueFlag } from './data';
import { Card, EmptyState, SectionTitle } from './ui';

export default function SensitiveReports({ games, language, limit, embedded = false }: { games: RecentGame[]; language: AdminLanguage; limit?: number; embedded?: boolean }) {
  const ar = language === 'ar';
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const sensitive = games.filter(isSensitiveReport);
  const reports = limit === undefined ? sensitive : sensitive.slice(0, limit);
  const list = reports.length ? <div className={`${embedded ? 'mt-3' : 'mt-5'} grid gap-3`}>{reports.map((game) => {
    const id = game.game_id || `${game.played_at}-${game.player_id}`;
    const show = revealed.has(id);
    const kinds = [trueFlag(game.fraud_experience) ? (ar ? 'احتيال إلكتروني' : 'Online fraud') : '', trueFlag(game.extortion_experience) ? (ar ? 'ابتزاز إلكتروني' : 'Online extortion') : ''].filter(Boolean);
    return <article key={id} className="rounded-xl border border-[#eadfca] bg-[#fffcf5] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-[#483b27]">{playerName(game, language)}</h3>{kinds.map((kind) => <span key={kind} className="rounded-full bg-[#fff0c7] px-2.5 py-1 text-[10px] font-black text-[#8a5a12]">{kind}</span>)}</div><p className="mt-1 text-[11px] font-semibold text-[#81745c]">{formatDate(game.played_at, language)}</p></div>
        <button type="button" onClick={() => setRevealed((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} className="min-h-9 rounded-lg border border-[#e3cd9e] bg-white px-3 text-[11px] font-black text-[#8a5a12]">{show ? (ar ? 'إخفاء' : 'Hide') : (ar ? 'إظهار' : 'Show')}</button>
      </div>
      <div className="mt-3 grid gap-1 text-xs font-bold text-[#5c5548] sm:grid-cols-2"><p dir="ltr" className="text-start break-all">{show ? (game.player_email || '—') : maskContact(game.player_email, 'email')}</p><p dir="ltr" className="text-start">{show ? (game.player_phone || '—') : maskContact(game.player_phone, 'phone')}</p></div>
      {(game.fraud_details || game.extortion_details) && <div className="mt-3 space-y-2 border-t border-[#efe2c7] pt-3 text-xs font-semibold leading-6 text-[#554b39]">{trueFlag(game.fraud_experience) && game.fraud_details && <p><b>{ar ? 'تفاصيل الاحتيال: ' : 'Fraud details: '}</b>{game.fraud_details}</p>}{trueFlag(game.extortion_experience) && game.extortion_details && <p><b>{ar ? 'تفاصيل الابتزاز: ' : 'Extortion details: '}</b>{game.extortion_details}</p>}</div>}
    </article>;
  })}</div> : <div className="mt-4"><EmptyState>{ar ? 'لا توجد بلاغات تحتاج إلى متابعة في هذه الفترة.' : 'No reports need attention in this period.'}</EmptyState></div>;
  if (embedded) return list;
  return <div><div className="mb-5"><h1 className="text-2xl font-black">{ar ? 'البلاغات' : 'Sensitive reports'}</h1><p className="mt-1 text-sm font-semibold text-[#657c7a]">{ar ? 'بلاغات الاحتيال والابتزاز التي تحتاج إلى متابعة.' : 'Fraud and extortion reports that need follow-up.'}</p></div><Card className="p-4 md:p-6"><SectionTitle title={ar ? 'بلاغات بانتظار الاهتمام' : 'Reports awaiting attention'} hint={ar ? 'بيانات التواصل مخفية حتى تضغط إظهار.' : 'Contact details stay masked until you choose Show.'}/>{list}</Card></div>;
}
