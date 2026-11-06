import type { AdminLanguage, Period, RecentGame, StatsData, VersionFilter } from './types';
import { audienceGroups, dailySeries, formatDate, formatDuration, playerName, summarizeGames } from './data';
import { Card, Chip, EmptyState, Funnel, LineChart, SectionTitle, StackedBar } from './ui';
import SensitiveReports from './SensitiveReports';
import { GapList } from './AwarenessGaps';

const periodLabels = { today: ['اليوم', 'Today'], '7d': ['7 أيام', '7 days'], '30d': ['30 يوم', '30 days'], all: ['الكل', 'All'] } as const;
const versionLabels = { all: ['الكل', 'All'], current: ['النسخة الحالية', 'Current version'], v2: ['النسخة الجديدة', 'New version'] } as const;

export default function Overview({ data, games, language, period, version, onPeriod, onVersion, onOpenReports }: {
  data: StatsData; games: RecentGame[]; language: AdminLanguage; period: Period; version: VersionFilter;
  onPeriod: (period: Period) => void; onVersion: (version: VersionFilter) => void; onOpenReports: () => void;
}) {
  const ar = language === 'ar';
  const summary = summarizeGames(games);
  const trend = dailySeries(games, period);
  const audience = audienceGroups(games);
  const labels: Record<string, Record<string, string>> = {
    age: {}, language: { ar: ar ? 'العربية' : 'Arabic', en: ar ? 'الإنجليزية' : 'English', ur: ar ? 'الأردية' : 'Urdu' },
    gender: { male: ar ? 'ذكور' : 'Male', female: ar ? 'إناث' : 'Female', unknown: ar ? 'غير محدد' : 'Not specified' },
    audience: { adult: ar ? 'بالغون' : 'Adults', kids: ar ? 'أطفال' : 'Kids' },
  };
  const audienceTitles: Record<string, string> = { age: ar ? 'الفئة العمرية' : 'Age group', language: ar ? 'اللغة' : 'Language', gender: ar ? 'الجنس' : 'Gender', audience: ar ? 'البالغون / الأطفال' : 'Adults / kids' };
  return <div className="space-y-4">
    <div>
      <h1 className="text-2xl font-black md:text-3xl">{ar ? 'نظرة عامة' : 'Overview'}</h1>
      <p className="mt-1 text-sm font-semibold text-[#657c7a]">{ar ? 'ما يحدث الآن، وما يحتاج إلى اهتمامك.' : 'What is happening now, and what needs your attention.'}</p>
      <div className="mt-4 flex flex-wrap gap-2" aria-label={ar ? 'الفترة' : 'Period'}>{(Object.keys(periodLabels) as Period[]).map((key) => <Chip key={key} active={period === key} onClick={() => onPeriod(key)}>{periodLabels[key][ar ? 0 : 1]}</Chip>)}</div>
      <div className="mt-2 flex flex-wrap gap-2" aria-label={ar ? 'النسخة' : 'Version'}>{(Object.keys(versionLabels) as VersionFilter[]).map((key) => <Chip key={key} active={version === key} onClick={() => onVersion(key)}>{versionLabels[key][ar ? 0 : 1]}</Chip>)}</div>
    </div>

    <section className="grid gap-3 sm:grid-cols-3">
      <Card className="p-5"><p className="text-xs font-extrabold text-[#657c7a]">{ar ? 'اللاعبون' : 'Players'}</p><p className="tnum mt-2 text-4xl font-black text-[#0f766e]">{summary.started}</p><p className="mt-1 text-[11px] font-semibold text-[#718683]">{ar ? 'جولة بدأت' : 'Rounds started'}</p></Card>
      <Card className="p-5"><p className="text-xs font-extrabold text-[#657c7a]">{ar ? 'أكملوا الجولة' : 'Completed'}</p><p className="tnum mt-2 text-4xl font-black text-[#0f766e]">{summary.completed}</p><p className="mt-1 text-[11px] font-semibold text-[#718683]">{summary.completionRate}% {ar ? 'من الجولات التي بدأت' : 'of started rounds'}</p></Card>
      <button type="button" onClick={onOpenReports} className="rounded-2xl border border-[#e4c887] bg-[#fffaf0] p-5 text-start shadow-[0_2px_10px_rgba(183,121,31,0.04)]"><span className="block text-xs font-extrabold text-[#8a5a12]">{ar ? 'بلاغات بانتظار الاهتمام' : 'Reports awaiting attention'}</span><span className="tnum mt-2 block text-4xl font-black text-[#a66b17]">{summary.reports}</span><span className="mt-1 block text-[11px] font-semibold text-[#927c56]">{ar ? 'احتيال وابتزاز · عرض البلاغات' : 'Fraud + extortion · View reports'}</span></button>
    </section>

    <Card className="grid grid-cols-3 divide-x divide-[#e4ecea] px-2 py-4 rtl:divide-x-reverse"><div className="px-3 text-center"><p className="tnum text-xl font-black">{summary.certificateRequested}</p><p className="mt-1 text-[10px] font-bold text-[#657c7a] md:text-xs">{ar ? 'طلبات الشهادات' : 'Certificates requested'}</p></div><div className="px-3 text-center"><p className="tnum text-xl font-black">{summary.certificateSent}</p><p className="mt-1 text-[10px] font-bold text-[#657c7a] md:text-xs">{ar ? 'شهادات أُرسلت' : 'Certificates sent'}</p></div><div className="px-3 text-center"><p className="tnum text-xl font-black">{formatDuration(summary.averageSeconds)}</p><p className="mt-1 text-[10px] font-bold text-[#657c7a] md:text-xs">{ar ? 'متوسط مدة الجولة' : 'Average round time'}</p></div></Card>

    <Card className="p-4 md:p-5"><SectionTitle title={ar ? 'أحدث البلاغات' : 'Latest sensitive reports'} hint={ar ? 'أحدث 5 بلاغات احتيال أو ابتزاز تحتاج إلى متابعة.' : 'Latest five fraud or extortion reports needing follow-up.'}/><SensitiveReports games={games} language={language} limit={5} embedded/></Card>

    <section className="grid gap-4 xl:grid-cols-2">
      <Card className="min-w-0 p-4 md:p-5"><SectionTitle title={ar ? 'الجولات يوميًا' : 'Rounds per day'} hint={ar ? 'الجولات التي بدأت مقارنة بالمكتملة.' : 'Started rounds compared with completed rounds.'}/><div className="mt-4">{games.length ? <LineChart data={trend} language={language}/> : <EmptyState>{ar ? 'لا توجد جولات في هذه الفترة بعد.' : 'No rounds in this period yet.'}</EmptyState>}</div></Card>
      <Card className="p-4 md:p-5"><SectionTitle title={ar ? 'مسار اللاعبين' : 'Player funnel'} hint={ar ? 'كل نسبة محسوبة من عدد الجولات التي بدأت.' : 'Every percentage uses started rounds as its denominator.'}/><div className="mt-4">{games.length ? <Funnel stages={summary.funnel} language={language}/> : <EmptyState>{ar ? 'لا توجد بيانات للمسار بعد.' : 'No funnel data yet.'}</EmptyState>}</div></Card>
    </section>

    <Card className="p-4 md:p-5"><SectionTitle title={ar ? 'أهم 5 فجوات وعي' : 'Top 5 awareness gaps'} hint={ar ? 'تظهر الأسئلة بعد مشاركة 10 لاعبين على الأقل.' : 'Questions appear after at least 10 players.'}/>{games.length ? <GapList questions={data.questions} language={language} limit={5} minimumPlayers={10}/> : <div className="mt-4"><EmptyState>{ar ? 'لا توجد بيانات كافية بعد' : 'Not enough data yet'}</EmptyState></div>}</Card>

    <section><div className="mb-3"><h2 className="text-base font-black">{ar ? 'الجمهور' : 'Audience'}</h2></div>{games.length ? <div className="grid gap-3 sm:grid-cols-2">{audience.map((group) => <Card key={group.id} className="p-4"><h3 className="mb-4 text-xs font-black">{audienceTitles[group.id]}</h3><StackedBar items={group.items} labels={labels[group.id]} language={language}/></Card>)}</div> : <Card className="p-4"><EmptyState>{ar ? 'لا توجد بيانات عن الجمهور في هذه الفترة.' : 'No audience data in this period.'}</EmptyState></Card>}</section>

    <Card className="p-4 md:p-5"><SectionTitle title={ar ? 'أحدث 5 جولات' : 'Latest 5 rounds'}/>{games.length ? <div className="mt-3 divide-y divide-[#e7efed]">{games.slice(0, 5).map((game) => <div key={game.game_id} className="flex items-center justify-between gap-3 py-3 text-xs"><div className="min-w-0"><p className="truncate font-black">{playerName(game, language)}</p><p className="mt-1 text-[10px] font-semibold text-[#718683]">{formatDate(game.played_at, language)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${game.completed === true ? 'bg-[#e7f3f1] text-[#0f766e]' : 'bg-[#f0f4f3] text-[#657c7a]'}`}>{game.completed === true ? (ar ? 'مكتملة' : 'Completed') : (ar ? 'لم تكتمل' : 'Incomplete')}</span></div>)}</div> : <div className="mt-3"><EmptyState>{ar ? 'لا توجد جولات بعد.' : 'No rounds yet.'}</EmptyState></div>}</Card>
  </div>;
}
