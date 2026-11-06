-- مخطط قاعدة بيانات تحدي الوعي الرقمي (مستخرج من مسارات الـ API)
-- يعمل عبر مفتاح service_role فقط — RLS مفعّل بلا سياسات عامة عمداً.

create table if not exists public.game_sessions (
  game_id text primary key,
  player_id text not null,
  player_name text not null,
  player_email text,
  player_phone text,
  lang text not null,
  age_group text not null,
  gender text not null,
  quiz_type text not null,
  score integer not null default 0,
  total integer not null default 0,
  wrong_attempts integer not null default 0,
  duration_seconds integer not null default 0,
  completed boolean not null default false,
  certificate_requested boolean not null default false,
  certificate_sent boolean not null default false,
  fraud_experience boolean,
  fraud_details text,
  extortion_experience boolean,
  extortion_details text,
  played_at timestamptz not null default now()
);
create index if not exists game_sessions_player_idx on public.game_sessions (player_id, played_at desc);
create index if not exists game_sessions_played_idx on public.game_sessions (played_at desc);

create table if not exists public.answer_attempts (
  id bigint generated always as identity primary key,
  game_id text not null,
  player_id text not null,
  quiz_type text not null,
  lang text not null,
  question_number integer not null,
  attempt_number integer not null,
  selected_option integer,
  correct_option integer not null,
  is_correct boolean not null default false,
  timed_out boolean not null default false,
  time_spent_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  unique (game_id, question_number, attempt_number)
);
create index if not exists answer_attempts_game_idx on public.answer_attempts (game_id);

alter table public.game_sessions enable row level security;
alter table public.answer_attempts enable row level security;

-- إحصائيات الأسئلة للوحة الإدارة (يُحسب من محاولات الإجابة)
create or replace view public.question_statistics as
select
  quiz_type,
  question_number,
  count(distinct player_id) as players_answered,
  count(*) filter (where not is_correct) as wrong_attempts,
  count(distinct player_id) filter (where attempt_number = 1 and is_correct) as first_try_correct_players,
  round(
    100.0 * count(distinct player_id) filter (where attempt_number = 1 and is_correct)
    / greatest(count(distinct player_id), 1), 1
  ) as first_try_success_rate
from public.answer_attempts
group by quiz_type, question_number;

-- الوصول عبر مفتاح الخدمة فقط — لا قراءة عامة
revoke all on public.question_statistics from anon, authenticated;
revoke all on public.game_sessions from anon, authenticated;
revoke all on public.answer_attempts from anon, authenticated;
