import type { AdminLanguage, Period, QuestionStat, RecentGame, StatsData, VersionFilter } from './types';

export function trueFlag(value: unknown) {
  return value === true || value === 1 || ['true', 'yes', '1'].includes(String(value ?? '').trim().toLowerCase());
}

export function isSensitiveReport(game: RecentGame) {
  return trueFlag(game.fraud_experience) || trueFlag(game.extortion_experience);
}

export function playerName(game: RecentGame, language: AdminLanguage) {
  return game.player_name?.trim() || (language === 'ar' ? 'زائر' : 'Visitor');
}

export function maskContact(value: string | null | undefined, kind: 'email' | 'phone') {
  if (!value) return '—';
  if (kind === 'email') {
    const [local, domain, ...rest] = value.split('@');
    if (!domain || rest.length) return '•••••';
    return `${local.slice(0, 1)}•••••@${domain}`;
  }
  return `${value.slice(0, 4)}•••••${value.slice(-4)}`;
}

export function dateKey(value: string | Date) {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function formatDate(value: string, language: AdminLanguage) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '—';
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-AE' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export function formatDuration(value: number) {
  const seconds = Math.max(0, Math.round(Number(value) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function filterGames(games: RecentGame[], period: Period, version: VersionFilter, now = new Date()) {
  const today = dateKey(now);
  const cutoff = new Date(now);
  if (period === '7d') cutoff.setDate(cutoff.getDate() - 6);
  if (period === '30d') cutoff.setDate(cutoff.getDate() - 29);
  const cutoffKey = dateKey(cutoff);
  return games.filter((game) => {
    const key = dateKey(game.played_at);
    const inPeriod = period === 'all' || (period === 'today' ? key === today : key >= cutoffKey && key <= today);
    const isV2 = game.game_id?.startsWith('v2-');
    return inPeriod && (version === 'all' || (version === 'v2' ? isV2 : !isV2));
  });
}

export function summarizeGames(games: RecentGame[]) {
  const started = games.length;
  const completed = games.filter((game) => trueFlag(game.completed)).length;
  const certificateRequested = games.filter((game) => trueFlag(game.certificate_requested)).length;
  const certificateSent = games.filter((game) => trueFlag(game.certificate_sent)).length;
  const averageSeconds = started
    ? Math.round(games.reduce((sum, game) => sum + (Number(game.duration_seconds) || 0), 0) / started)
    : 0;
  const percent = (value: number) => started ? Math.round(value / started * 100) : 0;
  return {
    started,
    completed,
    completionRate: percent(completed),
    reports: games.filter(isSensitiveReport).length,
    certificateRequested,
    certificateSent,
    averageSeconds,
    funnel: [
      { id: 'started', value: started, percent: 100 },
      { id: 'completed', value: completed, percent: percent(completed) },
      { id: 'requested', value: certificateRequested, percent: percent(certificateRequested) },
      { id: 'sent', value: certificateSent, percent: percent(certificateSent) },
    ],
  };
}

export function dailySeries(games: RecentGame[], period: Period, now = new Date()) {
  const counts = new Map<string, { key: string; started: number; completed: number }>();
  for (const game of games) {
    const key = dateKey(game.played_at);
    const current = counts.get(key) ?? { key, started: 0, completed: 0 };
    current.started += 1;
    if (trueFlag(game.completed)) current.completed += 1;
    counts.set(key, current);
  }
  if (period === 'all') return [...counts.values()].sort((a, b) => a.key.localeCompare(b.key));
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30;
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - index - 1));
    const key = dateKey(date);
    return counts.get(key) ?? { key, started: 0, completed: 0 };
  });
}

export function audienceGroups(games: RecentGame[]) {
  const total = games.length;
  const make = (id: string, values: Array<string | null>) => {
    const counts = new Map<string, number>();
    values.forEach((value) => counts.set(value || 'unknown', (counts.get(value || 'unknown') ?? 0) + 1));
    return {
      id,
      items: [...counts.entries()].map(([key, count]) => ({ key, count, percent: total ? count / total * 100 : 0 })).sort((a, b) => b.count - a.count),
    };
  };
  return [
    make('age', games.map((game) => game.age_group)),
    make('language', games.map((game) => game.lang)),
    make('gender', games.map((game) => game.gender)),
    make('audience', games.map((game) => game.quiz_type)),
  ];
}

export function rankQuestions(questions: QuestionStat[]) {
  return [...questions].sort((a, b) =>
    Number(a.first_try_success_rate) - Number(b.first_try_success_rate) ||
    b.wrong_attempts - a.wrong_attempts ||
    a.question_number - b.question_number,
  );
}

export function questionLabel(stat: QuestionStat, language: AdminLanguage) {
  return `${language === 'ar' ? 'س' : 'Q'}${stat.question_number}`;
}

export function demoStats(): StatsData {
  const now = new Date();
  const at = (daysAgo: number, hour: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, 20, 0, 0);
    return date.toISOString();
  };
  const base: RecentGame = {
    game_id: 'current-demo-1', player_id: 'demo-1', played_at: at(0, 10), player_name: '',
    player_email: 'visitor@example.com', player_phone: '+971501234567', lang: 'ar', age_group: '18–24',
    gender: 'male', quiz_type: 'adult', score: 18, total: 22, wrong_attempts: 4,
    duration_seconds: 312, completed: true, certificate_requested: true, certificate_sent: true,
    fraud_experience: 'yes', fraud_details: 'وصلني رابط يطلب تحديث بياناتي البنكية.',
    extortion_experience: 'no', extortion_details: null,
  };
  const recentGames = [
    base,
    { ...base, game_id: 'v2-demo-2', player_id: 'demo-2', player_name: 'سارة', lang: 'en' as const, gender: 'female' as const, played_at: at(0, 9), completed: true, fraud_experience: 'no', extortion_experience: 'yes', extortion_details: 'Threatening messages from an unknown account.' },
    { ...base, game_id: 'v2-demo-3', player_id: 'demo-3', player_name: 'محمد', played_at: at(1, 15), completed: false, certificate_requested: false, certificate_sent: false, fraud_experience: 'no', duration_seconds: 95 },
    { ...base, game_id: 'current-demo-4', player_id: 'demo-4', player_name: 'أحمد', quiz_type: 'kids' as const, age_group: '12–17', total: 10, score: 9, played_at: at(2, 12), fraud_experience: 'no', certificate_sent: false },
    { ...base, game_id: 'v2-demo-5', player_id: 'demo-5', player_name: 'Mariam', lang: 'en' as const, gender: 'female' as const, played_at: at(4, 17), fraud_experience: 'no' },
    { ...base, game_id: 'current-demo-6', player_id: 'demo-6', player_name: 'خالد', played_at: at(6, 11), completed: false, certificate_requested: false, certificate_sent: false, fraud_experience: 'no' },
  ];
  const questions: QuestionStat[] = [
    { quiz_type: 'adult', question_number: 6, players_answered: 24, wrong_attempts: 31, first_try_correct_players: 8, first_try_success_rate: 33.3 },
    { quiz_type: 'adult', question_number: 12, players_answered: 22, wrong_attempts: 18, first_try_correct_players: 12, first_try_success_rate: 54.5 },
    { quiz_type: 'adult', question_number: 17, players_answered: 20, wrong_attempts: 12, first_try_correct_players: 14, first_try_success_rate: 70 },
    { quiz_type: 'kids', question_number: 4, players_answered: 15, wrong_attempts: 14, first_try_correct_players: 7, first_try_success_rate: 46.7 },
    { quiz_type: 'kids', question_number: 8, players_answered: 14, wrong_attempts: 8, first_try_correct_players: 10, first_try_success_rate: 71.4 },
  ];
  return { summary: {}, journey: {}, questions, recentGames };
}
