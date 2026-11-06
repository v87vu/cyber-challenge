'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AdminLanguage, RecentGame } from './types';
import { formatDate, formatDuration, playerName, trueFlag } from './data';
import { Card, EmptyState, Icon } from './ui';

function flagLabel(value: unknown, ar: boolean) {
  if (value === null || value === undefined || value === '') return ar ? 'غير محدد' : 'Not specified';
  return trueFlag(value) ? (ar ? 'نعم' : 'Yes') : (ar ? 'لا' : 'No');
}

export default function Rounds({ games, language }: { games: RecentGame[]; language: AdminLanguage }) {
  const ar = language === 'ar';
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RecentGame | null>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return games;
    return games.filter((game) => [game.game_id, game.player_name, game.player_email, game.player_phone].some((value) => value?.toLowerCase().includes(needle)));
  }, [games, query]);
  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [selected]);
  const completion = (game: RecentGame) => trueFlag(game.completed) ? (ar ? 'مكتملة' : 'Completed') : (ar ? 'لم تكتمل' : 'Incomplete');
  return <div>
    <div className="mb-5"><h1 className="text-2xl font-black">{ar ? 'الجولات' : 'Rounds'}</h1><p className="mt-1 text-sm font-semibold text-[#657c7a]">{ar ? 'ابحث في الجولات واضغط أي صف لعرض كل التفاصيل.' : 'Search rounds and select any row to see every detail.'}</p></div>
    <Card className="p-4 md:p-5">
      <label className="relative block"><span className="sr-only">{ar ? 'بحث في الجولات' : 'Search rounds'}</span><span className="pointer-events-none absolute inset-y-0 start-4 grid place-items-center text-[#718683]"><Icon name="search"/></span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? 'الاسم، البريد، الهاتف أو رقم الجولة…' : 'Name, email, phone or round ID…'} className="min-h-12 w-full rounded-xl border border-[#d8e4e2] bg-[#fbfdfc] ps-12 pe-4 text-sm font-bold outline-none focus:border-[#0f766e]"/></label>
      <p className="mt-3 text-[11px] font-bold text-[#718683]">{ar ? `${filtered.length} جولة` : `${filtered.length} rounds`}</p>
      {filtered.length === 0 ? <div className="mt-4"><EmptyState>{query ? (ar ? 'لا توجد جولات تطابق بحثك.' : 'No rounds match your search.') : (ar ? 'لا توجد جولات في هذه الفترة بعد.' : 'No rounds in this period yet.')}</EmptyState></div> : <>
        <div className="mt-3 hidden md:block"><table className="w-full table-fixed text-start text-xs"><thead><tr className="border-b border-[#dfe9e7] text-[#657c7a]"><th className="w-[24%] p-3 text-start">{ar ? 'اللاعب' : 'Player'}</th><th className="w-[25%] p-3 text-start">{ar ? 'التاريخ' : 'Date'}</th><th className="w-[13%] p-3 text-start">{ar ? 'الفئة' : 'Group'}</th><th className="w-[13%] p-3 text-start">{ar ? 'النتيجة' : 'Score'}</th><th className="w-[15%] p-3 text-start">{ar ? 'الحالة' : 'Status'}</th><th className="w-[10%] p-3 text-start">{ar ? 'المدة' : 'Time'}</th></tr></thead><tbody>{filtered.map((game) => <tr key={game.game_id} onClick={() => setSelected(game)} className="cursor-pointer border-b border-[#edf2f1] last:border-0 hover:bg-[#f6faf9]"><td className="truncate p-3 font-black" title={playerName(game, language)}>{playerName(game, language)}</td><td className="truncate p-3 font-semibold text-[#657c7a]">{formatDate(game.played_at, language)}</td><td className="p-3 font-bold">{game.quiz_type === 'kids' ? (ar ? 'أطفال' : 'Kids') : (ar ? 'بالغون' : 'Adults')}</td><td className="tnum p-3 font-black">{game.score ?? '—'} / {game.total ?? '—'}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${trueFlag(game.completed) ? 'bg-[#e7f3f1] text-[#0f766e]' : 'bg-[#f0f4f3] text-[#657c7a]'}`}>{completion(game)}</span></td><td className="tnum p-3 font-bold">{formatDuration(game.duration_seconds)}</td></tr>)}</tbody></table></div>
        <div className="mt-3 grid gap-3 md:hidden">{filtered.map((game) => <button type="button" key={game.game_id} onClick={() => setSelected(game)} className="rounded-xl border border-[#dfe9e7] bg-white p-4 text-start"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-sm font-black">{playerName(game, language)}</h2><p className="mt-1 text-[10px] font-semibold text-[#718683]">{formatDate(game.played_at, language)}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${trueFlag(game.completed) ? 'bg-[#e7f3f1] text-[#0f766e]' : 'bg-[#f0f4f3] text-[#657c7a]'}`}>{completion(game)}</span></div><div className="mt-3 flex gap-5 text-[11px] font-bold text-[#657c7a]"><span>{ar ? 'النتيجة' : 'Score'} <b className="tnum text-[#294b48]">{game.score ?? '—'} / {game.total ?? '—'}</b></span><span>{ar ? 'المدة' : 'Time'} <b className="tnum text-[#294b48]">{formatDuration(game.duration_seconds)}</b></span></div></button>)}</div>
      </>}
    </Card>
    {selected && <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={ar ? 'تفاصيل الجولة' : 'Round details'}><button type="button" aria-label={ar ? 'إغلاق' : 'Close'} onClick={() => setSelected(null)} className="absolute inset-0 bg-[#173c3c]/25"/><aside className="relative h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">{playerName(selected, language)}</h2><p className="mt-1 text-xs font-semibold text-[#718683]">{formatDate(selected.played_at, language)}</p></div><button type="button" autoFocus onClick={() => setSelected(null)} aria-label={ar ? 'إغلاق' : 'Close'} className="grid h-11 w-11 place-items-center rounded-xl border border-[#d8e4e2]"><Icon name="close"/></button></div><dl className="mt-6 divide-y divide-[#e7efed]">{[
      [ar ? 'رقم الجولة' : 'Game ID', selected.game_id], [ar ? 'رقم اللاعب' : 'Player ID', selected.player_id],
      [ar ? 'الاسم' : 'Name', playerName(selected, language)], [ar ? 'البريد الإلكتروني' : 'Email', selected.player_email], [ar ? 'الهاتف' : 'Phone', selected.player_phone],
      [ar ? 'اللغة' : 'Language', selected.lang], [ar ? 'الفئة العمرية' : 'Age group', selected.age_group], [ar ? 'الجنس' : 'Gender', selected.gender], [ar ? 'فئة اللعبة' : 'Quiz type', selected.quiz_type],
      [ar ? 'الإجابات الصحيحة' : 'Score', selected.score], [ar ? 'إجمالي الأسئلة' : 'Total questions', selected.total], [ar ? 'المحاولات الخاطئة' : 'Wrong attempts', selected.wrong_attempts], [ar ? 'المدة' : 'Duration', formatDuration(selected.duration_seconds)],
      [ar ? 'اكتملت الجولة' : 'Completed', flagLabel(selected.completed, ar)], [ar ? 'طلب الشهادة' : 'Certificate requested', flagLabel(selected.certificate_requested, ar)], [ar ? 'إرسال الشهادة' : 'Certificate sent', flagLabel(selected.certificate_sent, ar)],
      [ar ? 'تعرض لاحتيال' : 'Fraud experience', flagLabel(selected.fraud_experience, ar)], [ar ? 'تفاصيل الاحتيال' : 'Fraud details', selected.fraud_details],
      [ar ? 'تعرض لابتزاز' : 'Extortion experience', flagLabel(selected.extortion_experience, ar)], [ar ? 'تفاصيل الابتزاز' : 'Extortion details', selected.extortion_details],
    ].map(([label, value]) => <div key={String(label)} className="grid grid-cols-[40%_60%] gap-3 py-3 text-xs"><dt className="font-bold text-[#657c7a]">{label}</dt><dd className="break-words font-bold text-[#294b48]" dir={label === (ar ? 'البريد الإلكتروني' : 'Email') || label === (ar ? 'الهاتف' : 'Phone') ? 'ltr' : undefined}>{value === null || value === undefined || value === '' ? '—' : String(value)}</dd></div>)}</dl></aside></div>}
  </div>;
}
