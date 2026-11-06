import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfigured, supabaseRest } from '@/lib/supabaseAdmin';

async function authorized(request: Request) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!url || !serviceKey || !adminEmail || !token) return false;

  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return !error && data.user.email?.trim().toLowerCase() === adminEmail;
}

export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  try {
    const [summaryRows, questions, recentGames] = await Promise.all([
      supabaseRest<Record<string, number>[]>('game_dashboard_summary?select=*'),
      supabaseRest<Record<string, number | string>[]>('question_statistics?select=*&order=wrong_attempts.desc'),
      supabaseRest<Record<string, number | string | null>[]>(
        'game_sessions?select=played_at,lang,age_group,gender,quiz_type,wrong_attempts,duration_seconds&order=played_at.desc&limit=1000',
      ),
    ]);

    return NextResponse.json({
      summary: summaryRows[0] ?? {
        total_players: 0,
        total_games: 0,
        total_wrong_attempts: 0,
        average_duration_seconds: 0,
      },
      questions,
      recentGames,
    });
  } catch (error) {
    console.error('Loading admin analytics failed:', error);
    return NextResponse.json({ error: 'Unable to load analytics.' }, { status: 502 });
  }
}
