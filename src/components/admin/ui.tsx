import type { ReactNode } from 'react';
import type { AdminLanguage, DashboardTab } from './types';

export const TEAL = '#0f766e';
export const GOLD = '#b7791f';

export function Icon({ name, size = 20 }: { name: DashboardTab | 'refresh' | 'collapse' | 'close' | 'search' | 'download' | 'shield' | 'chevron'; size?: number }) {
  const paths: Record<string, ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    rounds: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M9 7h7M9 11h5"/></>,
    reports: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v4M12 16h.01"/></>,
    gaps: <><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></>,
    exports: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    refresh: <><path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.4-2.6L20 11M4 13l2.5 4.6A7 7 0 0 0 17.9 15"/></>,
    collapse: <><path d="m15 18-6-6 6-6"/><path d="M20 4v16"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    chevron: <><path d="m9 18 6-6-6-6"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">{paths[name]}</svg>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#dfe9e7] bg-white shadow-[0_2px_10px_rgba(15,118,110,0.04)] ${className}`}>{children}</section>;
}

export function SectionTitle({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3">
    <div><h2 className="text-base font-black text-[#183b3a]">{title}</h2>{hint && <p className="mt-1 text-xs font-semibold leading-5 text-[#657c7a]">{hint}</p>}</div>
    {action}
  </div>;
}

export function Chip({ active, children, onClick, gold = false }: { active?: boolean; children: ReactNode; onClick: () => void; gold?: boolean }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`min-h-10 rounded-full border px-4 text-xs font-extrabold transition-colors ${gold ? 'border-[#e4c887] bg-[#fff8e8] text-[#8a5a12]' : active ? 'border-[#0f766e] bg-[#0f766e] text-white' : 'border-[#d8e4e2] bg-white text-[#526d6a] hover:border-[#0f766e]'}`}>{children}</button>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[#cfdfdc] bg-[#f8fbfa] px-4 py-8 text-center text-sm font-bold text-[#657c7a]">{children}</div>;
}

export function LineChart({ data, language }: { data: Array<{ key: string; started: number; completed: number }>; language: AdminLanguage }) {
  if (!data.length) return <EmptyState>{language === 'ar' ? 'لا توجد جولات في هذه الفترة بعد.' : 'No rounds in this period yet.'}</EmptyState>;
  const width = 600, height = 220, left = 38, right = 16, top = 18, bottom = 38;
  const max = Math.max(1, ...data.flatMap((day) => [day.started, day.completed]));
  const x = (index: number) => left + (data.length === 1 ? (width - left - right) / 2 : index * (width - left - right) / (data.length - 1));
  const y = (value: number) => top + (height - top - bottom) * (1 - value / max);
  const points = (key: 'started' | 'completed') => data.map((day, index) => `${x(index)},${y(day[key])}`).join(' ');
  const labelIndexes = [...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])];
  return <div>
    <div className="mb-3 flex gap-5 text-xs font-bold text-[#657c7a]"><span className="flex items-center gap-2"><i className="h-2 w-5 rounded-full bg-[#0f766e]"/>{language === 'ar' ? 'بدأت' : 'Started'}</span><span className="flex items-center gap-2"><i className="h-2 w-5 rounded-full bg-[#d8a33d]"/>{language === 'ar' ? 'اكتملت' : 'Completed'}</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label={language === 'ar' ? 'الجولات التي بدأت واكتملت يوميًا' : 'Daily started and completed rounds'}>
      {[0, .5, 1].map((part) => <g key={part}><line x1={left} x2={width - right} y1={y(max * part)} y2={y(max * part)} stroke="#e4ecea"/><text x={left - 8} y={y(max * part) + 4} textAnchor="end" fontSize="10" fill="#718683">{Math.round(max * part)}</text></g>)}
      <polyline points={points('started')} fill="none" stroke={TEAL} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      <polyline points={points('completed')} fill="none" stroke="#d8a33d" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      {data.map((day, index) => <g key={day.key}><circle cx={x(index)} cy={y(day.started)} r="3.5" fill={TEAL}/><circle cx={x(index)} cy={y(day.completed)} r="3.5" fill="#d8a33d"/>{labelIndexes.includes(index) && <text x={x(index)} y={height - 12} textAnchor="middle" fontSize="10" fill="#718683">{day.key.slice(5).split('-').reverse().join('/')}</text>}</g>)}
    </svg>
  </div>;
}

export function Funnel({ stages, language }: { stages: Array<{ id: string; value: number; percent: number }>; language: AdminLanguage }) {
  const labels: Record<string, [string, string]> = { started: ['بدأوا الجولة', 'Started'], completed: ['أكملوا الجولة', 'Completed'], requested: ['طلبوا الشهادة', 'Certificate requested'], sent: ['أُرسلت الشهادة', 'Certificate sent'] };
  return <div className="space-y-4 pt-2">{stages.map((stage, index) => <div key={stage.id}>
    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold"><span>{labels[stage.id][language === 'ar' ? 0 : 1]}</span><span className="tnum text-[#355e5a]">{stage.value} · {stage.percent}%</span></div>
    <div className="h-3 overflow-hidden rounded-full bg-[#edf3f2]"><div className="h-full rounded-full" style={{ width: `${stage.percent}%`, backgroundColor: index === 0 ? TEAL : index === 1 ? '#2f9288' : index === 2 ? '#d8a33d' : '#b7791f' }}/></div>
  </div>)}</div>;
}

export function StackedBar({ items, labels, language }: { items: Array<{ key: string; count: number; percent: number }>; labels: Record<string, string>; language: AdminLanguage }) {
  const colors = ['#0f766e', '#57a89e', '#d8a33d', '#94b8b2', '#315f5b', '#e3c983', '#769e99', '#c5d9d5'];
  if (!items.length) return <EmptyState>{language === 'ar' ? 'لا توجد بيانات بعد.' : 'No data yet.'}</EmptyState>;
  return <div>
    <div className="flex h-4 overflow-hidden rounded-full bg-[#edf3f2]" role="img" aria-label={items.map((item) => `${labels[item.key] ?? item.key}: ${Math.round(item.percent)}%`).join(', ')}>{items.map((item, index) => <span key={item.key} style={{ width: `${item.percent}%`, backgroundColor: colors[index % colors.length] }}/>)}</div>
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{items.map((item, index) => <span key={item.key} className="flex items-center gap-1.5 text-[11px] font-bold text-[#526d6a]"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}/>{labels[item.key] ?? item.key} <b className="tnum">{Math.round(item.percent)}%</b></span>)}</div>
  </div>;
}

/* مخطط دائري (Donut) — للأجزاء القليلة من كلٍّ واحد (٢–٤ أجزاء).
   ألوان مُتحقَّق منها لعمى الألوان (dataviz validator: ALL PASS)، واللون يتبع الفئة لا ترتيبها. */
export const DONUT_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
const NEUTRAL = '#b9b8b0';

export function Donut({ items, labels, colors, centerLabel, language }: {
  items: Array<{ key: string; count: number }>;
  labels: Record<string, string>;
  colors: Record<string, string>;
  centerLabel: string;
  language: AdminLanguage;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (!total) return <EmptyState>{language === 'ar' ? 'لا توجد بيانات بعد.' : 'No data yet.'}</EmptyState>;
  const size = 148, r = 56, stroke = 20, c = size / 2;
  const visible = items.filter((item) => item.count > 0);
  let angle = -90;
  const arc = (from: number, to: number) => {
    const rad = (a: number) => (a * Math.PI) / 180;
    const x1 = c + r * Math.cos(rad(from)), y1 = c + r * Math.sin(rad(from));
    const x2 = c + r * Math.cos(rad(to)), y2 = c + r * Math.sin(rad(to));
    return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const pct = (n: number) => Math.round((n / total) * 100);
  return <div className="flex items-center gap-4">
    <svg viewBox={`0 0 ${size} ${size}`} className="h-32 w-32 shrink-0" role="img"
      aria-label={visible.map((item) => `${labels[item.key] ?? item.key}: ${item.count} (${pct(item.count)}%)`).join(', ')}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#edf3f2" strokeWidth={stroke}/>
      {visible.length === 1
        ? <circle cx={c} cy={c} r={r} fill="none" stroke={colors[visible[0].key] ?? NEUTRAL} strokeWidth={stroke}><title>{`${labels[visible[0].key] ?? visible[0].key}: ${visible[0].count} (100%)`}</title></circle>
        : visible.map((item) => {
          const sweep = (item.count / total) * 360;
          const from = angle + 1.2, to = angle + sweep - 1.2;
          angle += sweep;
          return <path key={item.key} d={arc(from, Math.max(from + 0.5, to))} fill="none" stroke={colors[item.key] ?? NEUTRAL} strokeWidth={stroke} strokeLinecap="butt"
            className="transition-opacity hover:opacity-80"><title>{`${labels[item.key] ?? item.key}: ${item.count} (${pct(item.count)}%)`}</title></path>;
        })}
      <text x={c} y={c - 2} textAnchor="middle" className="tnum" style={{ fontSize: 26, fontWeight: 900, fill: '#0b0b0b' }}>{total}</text>
      <text x={c} y={c + 18} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: '#52514e' }}>{centerLabel}</text>
    </svg>
    <ul className="min-w-0 max-w-[15rem] flex-1 space-y-2">{items.map((item) => <li key={item.key} className="flex items-center gap-2 text-xs font-bold text-[#52514e]">
      <i className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[item.key] ?? NEUTRAL }}/>
      <span className="truncate text-[#0b0b0b]">{labels[item.key] ?? item.key}</span>
      <span className="ms-auto tnum text-[#0b0b0b]">{item.count}</span>
      <span className="w-10 text-end tnum">{pct(item.count)}%</span>
    </li>)}</ul>
  </div>;
}
