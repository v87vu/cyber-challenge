import { NextResponse } from 'next/server';
import { supabaseConfigured, supabaseRest } from '@/lib/supabaseAdmin';

const LANGS = new Set(['ar', 'en', 'ur']);
const AGE_GROUPS = new Set(['12-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65-70', '70+']);

function safeId(value: unknown) {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(value) ? value : '';
}

function safeInt(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : min;
}

function safeText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ saved: false, reason: 'not-configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const playerId = safeId(body.playerId);
    const gameId = safeId(body.gameId);
    const lang = LANGS.has(body.lang) ? body.lang : 'ar';
    const ageGroup = AGE_GROUPS.has(body.ageGroup) ? body.ageGroup : null;
    const gender = body.gender === 'male' || body.gender === 'female' ? body.gender : null;
    const quizType = body.quizType === 'kids' ? 'kids' : 'adult';
    const total = safeInt(body.total, 1, 50);
    const attempts = Array.isArray(body.attempts) ? body.attempts.slice(0, 250) : [];

    if (!playerId || !gameId || !ageGroup) {
      return NextResponse.json({ error: 'Invalid game result.' }, { status: 400 });
    }

    type SavedIdentity = {
      player_name?: string | null;
      player_email?: string | null;
      player_phone?: string | null;
      completed?: boolean | null;
      certificate_requested?: boolean | null;
      certificate_sent?: boolean | null;
      fraud_experience?: boolean | null;
      fraud_details?: string | null;
      extortion_experience?: boolean | null;
      extortion_details?: string | null;
    };

    const identityColumns =
      'player_name,player_email,player_phone,completed,certificate_requested,certificate_sent,fraud_experience,fraud_details,extortion_experience,extortion_details';

    const [existingRows, playerRows] = await Promise.all([
      supabaseRest<Array<SavedIdentity>>(
        `game_sessions?select=${identityColumns}&game_id=eq.${encodeURIComponent(gameId)}&limit=1`,
      ),
      supabaseRest<Array<SavedIdentity>>(
        `game_sessions?select=${identityColumns}&player_id=eq.${encodeURIComponent(playerId)}&order=played_at.desc&limit=25`,
      ),
    ]);
    const existing = existingRows[0];
    const playerIdentity = playerRows.find(
      (row) =>
        safeText(row.player_name, 120) ||
        safeText(row.player_email, 180) ||
        safeText(row.player_phone, 40),
    );

    const incomingName = safeText(body.playerName, 120);
    const incomingEmail = safeText(body.playerEmail, 180);
    const incomingPhone = safeText(body.playerPhone, 40);

    const resolvedName =
      incomingName ||
      safeText(existing?.player_name, 120) ||
      safeText(playerIdentity?.player_name, 120);
    const resolvedEmail =
      incomingEmail ||
      safeText(existing?.player_email, 180) ||
      safeText(playerIdentity?.player_email, 180);
    const resolvedPhone =
      incomingPhone ||
      safeText(existing?.player_phone, 40) ||
      safeText(playerIdentity?.player_phone, 40);

    if (!resolvedName) {
      return NextResponse.json({ error: 'Player name is required.' }, { status: 400 });
    }

    const incomingFraud =
      body.fraudExperience === 'yes' ? true : body.fraudExperience === 'no' ? false : null;
    const incomingExtortion =
      body.extortionExperience === 'yes' ? true : body.extortionExperience === 'no' ? false : null;

    const incomingFraudDetails = safeText(body.fraudDetails, 800);
    const incomingExtortionDetails = safeText(body.extortionDetails, 800);

    const session = {
      game_id: gameId,
      player_id: playerId,
      player_name: resolvedName,
      player_email: resolvedEmail || null,
      player_phone: resolvedPhone || null,
      lang,
      age_group: ageGroup,
      gender,
      quiz_type: quizType,
      score: safeInt(body.score, 0, total),
      total,
      wrong_attempts: attempts.filter((item: { isCorrect?: boolean }) => item.isCorrect !== true).length,
      duration_seconds: safeInt(body.durationSeconds, 0, 86400),
      completed: existing?.completed === true || body.completed === true,
      certificate_requested:
        existing?.certificate_requested === true || body.certificateRequested === true,
      certificate_sent:
        existing?.certificate_sent === true || body.certificateSent === true,
      fraud_experience:
        incomingFraud !== null ? incomingFraud : (existing?.fraud_experience ?? null),
      fraud_details:
        incomingFraud === false
          ? null
          : incomingFraudDetails || existing?.fraud_details || null,
      extortion_experience:
        incomingExtortion !== null ? incomingExtortion : (existing?.extortion_experience ?? null),
      extortion_details:
        incomingExtortion === false
          ? null
          : incomingExtortionDetails || existing?.extortion_details || null,
    };

    const savedRows = await supabaseRest<Array<{
      game_id?: string;
      player_id?: string;
      player_name?: string | null;
      player_email?: string | null;
      player_phone?: string | null;
    }>>('game_sessions?on_conflict=game_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(session),
    });

    const savedSession = savedRows[0];
    if (!savedSession || !safeText(savedSession.player_name, 120)) {
      throw new Error('Supabase returned a game session without player identity.');
    }

    const perQuestion = new Map<number, number>();
    const answerRows = attempts.map((attempt: Record<string, unknown>) => {
      const questionNumber = safeInt(attempt.questionNumber, 1, 50);
      const attemptNumber = (perQuestion.get(questionNumber) ?? 0) + 1;
      perQuestion.set(questionNumber, attemptNumber);

      return {
        game_id: gameId,
        player_id: playerId,
        quiz_type: quizType,
        lang,
        question_number: questionNumber,
        attempt_number: attemptNumber,
        selected_option:
          attempt.selectedOption === null ? null : safeInt(attempt.selectedOption, 0, 3),
        correct_option: safeInt(attempt.correctOption, 0, 3),
        is_correct: attempt.isCorrect === true,
        timed_out: attempt.timedOut === true,
        time_spent_seconds: safeInt(attempt.timeSpentSeconds, 0, 3600),
      };
    });

    if (answerRows.length > 0) {
      await supabaseRest('answer_attempts?on_conflict=game_id,question_number,attempt_number', {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(answerRows),
      });
    }

    return NextResponse.json({
      saved: true,
      player: {
        id: savedSession.player_id ?? playerId,
        name: savedSession.player_name,
        email: savedSession.player_email ?? null,
        phone: savedSession.player_phone ?? null,
      },
    });
  } catch (error) {
    console.error('Saving game analytics failed:', error);
    return NextResponse.json({ error: 'Unable to save game result.' }, { status: 502 });
  }
}
