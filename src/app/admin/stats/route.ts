import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { adminEmails } from '@/lib/adminEmails';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAdminClientAndUser(request: Request) {
  const url =
    process.env.SUPABASE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const allowedEmails = adminEmails();

  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!url || !serviceKey || !allowedEmails.size || !token) {
    return { ok: false as const };
  }

  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (
    userError ||
    !userData.user ||
    !allowedEmails.has(userData.user.email?.trim().toLowerCase() ?? '')
  ) {
    return { ok: false as const };
  }

  return { ok: true as const, supabase };
}

export async function GET(request: Request) {
  const auth = await getAdminClientAndUser(request);

  if (!auth.ok) {
    return NextResponse.json(
      { error: 'Unauthorized', version: 'ADMIN_DIRECT_V2' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const [questionsResult, gamesResult] = await Promise.all([
      auth.supabase
        .from('question_statistics')
        .select('*')
        .order('wrong_attempts', { ascending: false }),
      auth.supabase
        .from('game_sessions')
        .select(
          [
            'game_id',
            'player_id',
            'played_at',
            'player_name',
            'player_email',
            'player_phone',
            'lang',
            'age_group',
            'gender',
            'quiz_type',
            'score',
            'total',
            'wrong_attempts',
            'duration_seconds',
            'completed',
            'certificate_requested',
            'certificate_sent',
            'fraud_experience',
            'fraud_details',
            'extortion_experience',
            'extortion_details',
          ].join(','),
        )
        .order('played_at', { ascending: false })
        .limit(1000),
    ]);

    if (questionsResult.error) throw questionsResult.error;
    if (gamesResult.error) throw gamesResult.error;

    const isYes = (value: unknown) =>
      value === true ||
      value === 1 ||
      String(value ?? '').trim().toLowerCase() === '1' ||
      String(value ?? '').trim().toLowerCase() === 'yes' ||
      String(value ?? '').trim().toLowerCase() === 'true';

    const cleanText = (value: unknown) => {
      const text = String(value ?? '').trim();
      return text && text.toLowerCase() !== 'null' && text.toLowerCase() !== 'undefined'
        ? text
        : null;
    };

    const cleanNumber = (value: unknown) => {
      if (value === null || value === undefined || value === '') return null;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    };

    /*
     * بعض النسخ القديمة كانت تحفظ بيانات اللاعب أولاً، ثم تحفظ نتيجة اللعبة
     * في سجل آخر يحمل player_id نفسه. نبني فهرساً للهوية حتى لا تظهر شرطات
     * في سجل النتيجة بينما الاسم والإيميل موجودان فعلاً في سجل آخر.
     */
    type GameRow = Record<string, unknown>;
    type PlayerIdentity = {
      player_name: string | null;
      player_email: string | null;
      player_phone: string | null;
    };

    const rawGames = (gamesResult.data ?? []) as unknown as GameRow[];
    const identities = new Map<string, PlayerIdentity>();

    for (const game of rawGames) {
      const playerId = cleanText(game.player_id);
      if (!playerId) continue;

      const current = identities.get(playerId) ?? {
        player_name: null,
        player_email: null,
        player_phone: null,
      };

      identities.set(playerId, {
        player_name: current.player_name ?? cleanText(game.player_name),
        player_email: current.player_email ?? cleanText(game.player_email),
        player_phone: current.player_phone ?? cleanText(game.player_phone),
      });
    }

    const recentGames = rawGames.map((game): GameRow => {
      const playerId = cleanText(game.player_id);
      const identity = playerId ? identities.get(playerId) : undefined;

      return {
        ...game,
        player_name: cleanText(game.player_name) ?? identity?.player_name ?? null,
        player_email: cleanText(game.player_email) ?? identity?.player_email ?? null,
        player_phone: cleanText(game.player_phone) ?? identity?.player_phone ?? null,
        score: cleanNumber(game.score),
        total: cleanNumber(game.total),
        wrong_attempts: cleanNumber(game.wrong_attempts) ?? 0,
        duration_seconds: cleanNumber(game.duration_seconds) ?? 0,
        completed: game.completed === null || game.completed === undefined
          ? null
          : isYes(game.completed),
        certificate_requested:
          game.certificate_requested === null || game.certificate_requested === undefined
            ? null
            : isYes(game.certificate_requested),
        certificate_sent:
          game.certificate_sent === null || game.certificate_sent === undefined
            ? null
            : isYes(game.certificate_sent),
      };
    });

    const completedGames = recentGames.filter((game) => game.completed === true).length;
    const incompleteGames = recentGames.filter((game) => game.completed === false).length;
    const certificateRequested = recentGames.filter((game) =>
      isYes(game.certificate_requested),
    ).length;
    const certificateSent = recentGames.filter((game) =>
      isYes(game.certificate_sent),
    ).length;
    const fraudYes = recentGames.filter((game) => isYes(game.fraud_experience)).length;
    const extortionYes = recentGames.filter((game) =>
      isYes(game.extortion_experience),
    ).length;

    const playerKeys = new Set(
      recentGames.map((game) =>
        cleanText(game.player_email)?.toLowerCase() ??
        cleanText(game.player_id) ??
        ([cleanText(game.player_name)?.toLowerCase(), cleanText(game.player_phone)]
          .filter(Boolean)
          .join('|') || cleanText(game.game_id)),
      ),
    );
    playerKeys.delete(null);

    const totalDuration = recentGames.reduce(
      (sum, game) => sum + (cleanNumber(game.duration_seconds) ?? 0),
      0,
    );
    const summary = {
      total_players: playerKeys.size,
      total_games: recentGames.length,
      total_wrong_attempts: recentGames.reduce(
        (sum, game) => sum + (cleanNumber(game.wrong_attempts) ?? 0),
        0,
      ),
      average_duration_seconds:
        recentGames.length > 0 ? Math.round(totalDuration / recentGames.length) : 0,
      arabic_games: recentGames.filter((game) => game.lang === 'ar').length,
      english_games: recentGames.filter((game) => game.lang === 'en').length,
      urdu_games: recentGames.filter((game) => game.lang === 'ur').length,
      kids_games: recentGames.filter((game) => game.quiz_type === 'kids').length,
      adult_games: recentGames.filter((game) => game.quiz_type === 'adult').length,
    };

    const response = NextResponse.json({
      version: 'ADMIN_DIRECT_V2',
      summary,
      journey: {
        completed: completedGames,
        incomplete: incompleteGames,
        certificateRequested,
        certificateSent,
        fraudYes,
        extortionYes,
      },
      questions: questionsResult.data ?? [],
      recentGames,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Loading admin analytics failed:', error);

    return NextResponse.json(
      {
        error: 'Unable to load analytics.',
        version: 'ADMIN_DIRECT_V2',
        detail: error instanceof Error ? error.message : String(error),
      },
      {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
