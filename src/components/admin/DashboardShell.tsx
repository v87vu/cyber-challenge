'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AdminLanguage, DashboardTab, Period, StatsData, VersionFilter } from './types';
import { filterGames, summarizeGames } from './data';
import { Icon } from './ui';
import Overview from './Overview';
import Rounds from './Rounds';
import SensitiveReports from './SensitiveReports';
import AwarenessGaps from './AwarenessGaps';
import ReportExport from './ReportExport';

const tabs: Array<{ id: DashboardTab; ar: string; en: string }> = [
  { id: 'overview', ar: 'نظرة عامة', en: 'Overview' },
  { id: 'rounds', ar: 'الجولات', en: 'Rounds' },
  { id: 'reports', ar: 'البلاغات', en: 'Sensitive reports' },
  { id: 'gaps', ar: 'فجوات الوعي', en: 'Awareness gaps' },
  { id: 'exports', ar: 'التقارير', en: 'Reports' },
];
const validTabs = new Set(tabs.map((tab) => tab.id));

export default function DashboardShell({ data, language, onLanguage, onRefresh, onSignOut, loading }: {
  data: StatsData;
  language: AdminLanguage;
  onLanguage: (language: AdminLanguage) => void;
  onRefresh: () => void;
  onSignOut: () => void;
  loading: boolean;
}) {
  const ar = language === 'ar';
  const [active, setActive] = useState<DashboardTab>('overview');
  const [period, setPeriod] = useState<Period>('30d');
  const [version, setVersion] = useState<VersionFilter>('all');
  const [collapsed, setCollapsed] = useState(false);
  const games = useMemo(() => filterGames(data.recentGames, period, version), [data.recentGames, period, version]);
  const summary = useMemo(() => summarizeGames(games), [games]);

  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.slice(1) as DashboardTab;
      if (validTabs.has(hash)) setActive(hash);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  function navigate(tab: DashboardTab) {
    setActive(tab);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${tab}`);
  }

  const rail = <nav aria-label={ar ? 'أقسام لوحة الأدمن' : 'Admin sections'} className="flex h-full flex-col gap-2 p-3">
    <div className={`mb-5 flex items-center gap-3 px-2 py-3 ${collapsed ? 'justify-center' : ''}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7f3f1] text-[#0f766e]"><Icon name="shield" size={24}/></span>
      {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-black text-[#183b3a]">{ar ? 'تحدي الوعي الرقمي' : 'Digital Awareness'}</p><p className="mt-0.5 text-[10px] font-bold text-[#718683]">{ar ? 'لوحة الأدمن' : 'Admin dashboard'}</p></div>}
    </div>
    {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => navigate(tab.id)} title={collapsed ? tab[language] : undefined} aria-current={active === tab.id ? 'page' : undefined} className={`relative flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-extrabold ${collapsed ? 'justify-center' : ''} ${active === tab.id ? 'bg-[#e7f3f1] text-[#0f766e]' : 'text-[#5a7270] hover:bg-[#f3f8f7]'}`}>
      <Icon name={tab.id}/>{!collapsed && <span className="flex-1 text-start">{tab[language]}</span>}
      {tab.id === 'reports' && summary.reports > 0 && <span className={`grid min-w-6 place-items-center rounded-full bg-[#fff1cc] px-1.5 py-1 text-[10px] font-black text-[#8a5a12] ${collapsed ? 'absolute -left-0.5 top-0.5' : ''}`}>{summary.reports}</span>}
    </button>)}
    <button type="button" onClick={() => setCollapsed((value) => !value)} className="mt-auto hidden min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-[#657c7a] hover:bg-[#f3f8f7] md:flex" aria-label={ar ? (collapsed ? 'توسيع القائمة' : 'طي القائمة') : (collapsed ? 'Expand navigation' : 'Collapse navigation')}><Icon name="collapse"/><span className={collapsed ? 'hidden' : ''}>{ar ? 'طي القائمة' : 'Collapse'}</span></button>
  </nav>;

  return <div dir={ar ? 'rtl' : 'ltr'} className="min-h-dvh bg-[#f4f8f7] font-[family-name:var(--font-ar)] text-[#183b3a]">
    <aside className={`fixed inset-y-0 z-30 hidden border-[#dfe9e7] bg-white md:block ${ar ? 'right-0 border-l' : 'left-0 border-r'} ${collapsed ? 'w-[84px]' : 'w-60'}`}>{rail}</aside>
    <div className={`${collapsed ? (ar ? 'md:mr-[84px]' : 'md:ml-[84px]') : (ar ? 'md:mr-60' : 'md:ml-60')}`}>
      <header className="sticky top-0 z-20 border-b border-[#dfe9e7] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 md:px-7">
          <div className="flex items-center gap-2 md:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e7f3f1] text-[#0f766e]"><Icon name="shield"/></span><strong className="text-sm">{ar ? 'لوحة الأدمن' : 'Admin'}</strong></div>
          <p className="hidden text-xs font-bold text-[#718683] md:block">{ar ? 'القيادة العامة لشرطة أم القيوين' : 'Umm Al Quwain Police GHQ'}</p>
          <div className="flex items-center gap-2">
            <select value={language} onChange={(event) => onLanguage(event.target.value as AdminLanguage)} aria-label={ar ? 'لغة اللوحة' : 'Dashboard language'} className="min-h-10 rounded-xl border border-[#d8e4e2] bg-white px-2 text-xs font-extrabold text-[#355e5a]"><option value="ar">العربية</option><option value="en">English</option></select>
            <button type="button" onClick={onRefresh} disabled={loading} className="grid min-h-10 min-w-10 place-items-center rounded-xl border border-[#d8e4e2] text-[#0f766e] disabled:opacity-50" title={ar ? 'تحديث' : 'Refresh'} aria-label={ar ? 'تحديث' : 'Refresh'}><Icon name="refresh"/></button>
            <button type="button" onClick={onSignOut} className="min-h-10 rounded-xl px-3 text-xs font-extrabold text-[#526d6a] hover:bg-[#f3f8f7]">{ar ? 'خروج' : 'Sign out'}</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-5 md:px-7 md:pb-10 md:pt-7">
        {active === 'overview' && <Overview data={data} games={games} language={language} period={period} version={version} onPeriod={setPeriod} onVersion={setVersion} onOpenReports={() => navigate('reports')}/>}
        {active === 'rounds' && <Rounds games={games} language={language}/>} 
        {active === 'reports' && <SensitiveReports games={games} language={language}/>} 
        {active === 'gaps' && <AwarenessGaps questions={data.questions} language={language}/>} 
        {active === 'exports' && <ReportExport games={data.recentGames} language={language}/>} 
      </main>
    </div>
    <nav aria-label={ar ? 'أقسام لوحة الأدمن' : 'Admin sections'} className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#d8e4e2] bg-white px-1 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden">
      {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => navigate(tab.id)} aria-current={active === tab.id ? 'page' : undefined} className={`relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg text-[9px] font-extrabold ${active === tab.id ? 'bg-[#e7f3f1] text-[#0f766e]' : 'text-[#657c7a]'}`}><Icon name={tab.id} size={19}/><span>{tab[language]}</span>{tab.id === 'reports' && summary.reports > 0 && <span className="absolute right-[12%] top-0 grid min-w-5 place-items-center rounded-full bg-[#d8a33d] px-1 py-0.5 text-[9px] text-white">{summary.reports}</span>}</button>)}
    </nav>
  </div>;
}
