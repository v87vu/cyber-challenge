export type AdminLanguage = 'ar' | 'en';
export type DashboardTab = 'overview' | 'rounds' | 'reports' | 'gaps' | 'exports';
export type Period = 'today' | '7d' | '30d' | 'all';
export type VersionFilter = 'all' | 'current' | 'v2';

export type RecentGame = {
  game_id: string;
  player_id?: string | null;
  played_at: string;
  player_name?: string | null;
  player_email?: string | null;
  player_phone?: string | null;
  lang: 'ar' | 'en' | 'ur';
  age_group: string;
  gender: 'male' | 'female' | null;
  quiz_type: 'kids' | 'adult';
  score?: number | null;
  total?: number | null;
  wrong_attempts: number;
  duration_seconds: number;
  completed?: boolean | string | null;
  certificate_requested?: boolean | string | null;
  certificate_sent?: boolean | string | null;
  fraud_experience?: boolean | string | null;
  fraud_details?: string | null;
  extortion_experience?: boolean | string | null;
  extortion_details?: string | null;
};

export type QuestionStat = {
  quiz_type: 'kids' | 'adult';
  question_number: number;
  players_answered: number;
  wrong_attempts: number;
  first_try_correct_players: number;
  first_try_success_rate: number;
};

export type StatsData = {
  summary: Record<string, number>;
  journey: Record<string, number>;
  questions: QuestionStat[];
  recentGames: RecentGame[];
};

export type ReportKind = 'fraud' | 'extortion';

export type DashboardCopy = {
  ar: string;
  en: string;
};
