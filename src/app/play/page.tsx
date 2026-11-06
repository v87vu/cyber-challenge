'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { LETTERS, getQuiz, questionCopy, quizCertificateTitle, quizLevelOf, quizRewardFor } from '@/lib/questions';
import { KIDS_MILESTONES, MILESTONES } from '@/lib/i18n';
import { usePrefs } from '@/lib/usePrefs';
import Shell from '@/components/Shell';
import Mascot, { type Mood } from '@/components/Mascot';
import Burst from '@/components/Burst';
import Certificate from '@/components/Certificate';
import AiReviewChat, { type ReviewMistake } from '@/components/AiReviewChat';
import { Chip, Hearts, Panel, PixelButton } from '@/components/PixelUI';
import { mutedServerSnapshot, mutedSnapshot, sfx, subscribeMuted, toggleMuted } from '@/lib/sfx';
import { AGE_GROUPS, setAge, setEmail, setGender, setName, setPhone, type AgeGroup, type Gender } from '@/lib/prefs';
import { bestServerSnapshot, bestSnapshot, recordScore, subscribeBest } from '@/lib/best';

type Phase = 'gender' | 'age' | 'briefing' | 'intro' | 'countdown' | 'question' | 'correct' | 'milestone' | 'golden' | 'lost' | 'won' | 'review' | 'video' | 'survey';

type AnswerAttempt = {
  questionNumber: number;
  selectedOption: number | null;
  correctOption: number;
  isCorrect: boolean;
  timedOut: boolean;
  timeSpentSeconds: number;
};

const TIME = 45;
const COUNT_FROM = 3;
const QUIZ_KIDS = getQuiz(true);
const QUIZ_ADULT = getQuiz(false);
/* خلط فيشر–ييتس — يُستدعى عند بدء كل جولة فقط (لا أثناء الرسم) */
function shuffled(): number[] {
  const a = [0, 1, 2, 3];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function devicePlayerId() {
  const key = 'dac-device-player-id';
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const created = crypto.randomUUID();
    localStorage.setItem(key, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export default function Play() {
  const { gender, lang, age, name: playerName, email: playerEmail, phone: playerPhone, s } = usePrefs();
  const quiz = age === '12-17' ? QUIZ_KIDS : QUIZ_ADULT;
  const MS = age === '12-17' ? KIDS_MILESTONES : MILESTONES;
  const ageLabel = age ? s.ageGroups[AGE_GROUPS.indexOf(age)] : '';
  const playerIdleAvatar =
    gender === 'female'
      ? '/avatar-female-idle.png'
      : age === '12-17'
        ? '/avatar-boy-idle.png'
        : '/avatar-man-idle.png';
  const [phase, setPhase] = useState<Phase>('age');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timerOn, setTimerOn] = useState(true);
  const [left, setLeft] = useState(TIME);
  const [count, setCount] = useState(COUNT_FROM);
  const [cert, setCert] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [copied, setCopied] = useState(false);
  // ترتيب عرض الخيارات لكل سؤال — يتجدد عشوائياً في كل جولة
  const [order, setOrder] = useState<number[][]>([]);
  const [agePick, setAgePick] = useState<AgeGroup | null>(null);
  const [nameInput, setNameInput] = useState(playerName);
  const [emailInput, setEmailInput] = useState(playerEmail);
  const [phoneInput, setPhoneInput] = useState(playerPhone);
  const [attempts, setAttempts] = useState<AnswerAttempt[]>([]);
  const [wrongAttempt, setWrongAttempt] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [videoComplete, setVideoComplete] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [videoTap, setVideoTap] = useState(false);
  const introVideoRef = useRef<HTMLVideoElement | null>(null);
  const [fraudExperience, setFraudExperience] = useState<'yes' | 'no' | null>(null);
  const [fraudDetails, setFraudDetails] = useState('');
  const [extortionExperience, setExtortionExperience] = useState<'yes' | 'no' | null>(null);
  const [extortionDetails, setExtortionDetails] = useState('');
  const [briefingVoiceLoading, setBriefingVoiceLoading] = useState(false);
  const [briefingVoiceError, setBriefingVoiceError] = useState(false);
  const [briefingSpeaking, setBriefingSpeaking] = useState(false);
  const [briefingPose, setBriefingPose] = useState(1);
  const briefingAudioRef = useRef<HTMLAudioElement | null>(null);
  const briefingAudioUrlRef = useRef<string | null>(null);
  const briefingUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const mute = useSyncExternalStore(subscribeMuted, mutedSnapshot, mutedServerSnapshot);
  const revealRef = useRef<HTMLDivElement>(null);
  const attemptStartedAt = useRef(Date.now());
  const playerIdRef = useRef('');
  const gameIdRef = useRef('');
  const registeredNameRef = useRef('');
  const registeredEmailRef = useRef('');
  const registeredPhoneRef = useRef('');
  const gameStartedAt = useRef(Date.now());
  const analyticsSent = useRef(false);
  const bestPair = useSyncExternalStore(subscribeBest, bestSnapshot, bestServerSnapshot);
  const best = quiz.kids ? bestPair.kids : bestPair.adult;

  const briefingText =
    lang === 'ar'
      ? 'حماية المجتمع مسؤولية مشتركة تبدأ بالوعي وتعززها اليقظة والمسؤولية. بتكاتفنا، نحافظ على أمن مجتمعنا الرقمي ونصنع بيئة أكثر أمانًا لجميع أفراد المجتمع.'
      : lang === 'ur'
        ? 'معاشرے کی حفاظت ایک مشترکہ ذمہ داری ہے جو آگاہی سے شروع ہوتی ہے اور ہوشیاری اور ذمہ داری سے مضبوط ہوتی ہے۔ مل کر ہم اپنے ڈیجیٹل معاشرے کو محفوظ رکھتے ہیں اور سب کے لیے زیادہ محفوظ ماحول بناتے ہیں۔'
        : 'Protecting our community is a shared responsibility that begins with awareness and is strengthened by vigilance and responsibility. Together, we protect our digital community and create a safer environment for everyone.';

  const stopBriefingVoice = useCallback(() => {
    if (briefingAudioRef.current) {
      briefingAudioRef.current.pause();
      briefingAudioRef.current.currentTime = 0;
      setBriefingSpeaking(false);
      briefingAudioRef.current = null;
    }
    if (briefingAudioUrlRef.current) {
      URL.revokeObjectURL(briefingAudioUrlRef.current);
      briefingAudioUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    briefingUtteranceRef.current = null;
  }, []);

  const playBriefingVoice = useCallback(async () => {
    stopBriefingVoice();
    setBriefingVoiceError(false);
    setBriefingVoiceLoading(true);

    const playDeviceFallback = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setBriefingVoiceError(true);
        setBriefingVoiceLoading(false);
        return;
      }

      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(briefingText);
      briefingUtteranceRef.current = utterance;

      utterance.lang = lang === 'ar' ? 'ar-AE' : lang === 'ur' ? 'ur-PK' : 'en-US';
      utterance.rate = lang === 'ar' ? 0.9 : 0.94;
      utterance.pitch = 0.96;
      utterance.volume = 1;

      const voices = synth.getVoices();
      const prefix = lang === 'ar' ? 'ar' : lang === 'ur' ? 'ur' : 'en';
      const matching = voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix));
      if (matching) utterance.voice = matching;

      utterance.onstart = () => {
        setBriefingVoiceLoading(false);
        setBriefingSpeaking(true);
      };
      utterance.onend = () => {
        setBriefingSpeaking(false);
        briefingUtteranceRef.current = null;
      };
      utterance.onerror = () => {
        setBriefingVoiceLoading(false);
        setBriefingSpeaking(false);
        setBriefingVoiceError(true);
        briefingUtteranceRef.current = null;
      };

      try {
        synth.cancel();
        synth.speak(utterance);
        window.setTimeout(() => {
          if (!synth.speaking) setBriefingVoiceLoading(false);
        }, 1200);
      } catch {
        setBriefingVoiceLoading(false);
        setBriefingVoiceError(true);
      }
    };

    let lastStatus = 0;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            text: briefingText,
            lang,
            voiceProfile: 'adult-male',
          }),
        });

        lastStatus = response.status;
        if (!response.ok) throw new Error(`TTS ${response.status}`);

        const blob = await response.blob();
        if (!blob.size || !blob.type.startsWith('audio/')) {
          throw new Error('Invalid audio');
        }

        const url = URL.createObjectURL(blob);
        briefingAudioUrlRef.current = url;

        const audio = new Audio(url);
        briefingAudioRef.current = audio;
        audio.preload = 'auto';

        audio.onplaying = () => {
          setBriefingVoiceLoading(false);
          setBriefingSpeaking(true);
        };
        audio.onended = () => {
          setBriefingSpeaking(false);
          briefingAudioRef.current = null;
        };
        audio.onerror = () => {
          setBriefingSpeaking(false);
          playDeviceFallback();
        };

        await audio.play();
        return;
      } catch (error) {
        if (attempt === 0 && lastStatus === 429) {
          await new Promise((resolve) => window.setTimeout(resolve, 1400));
          continue;
        }
      }
    }

    // Gemini failed: use the device only as a backup so the page still speaks.
    playDeviceFallback();
  }, [briefingText, lang, stopBriefingVoice]);

  useEffect(() => {
    if (phase !== 'briefing') {
      stopBriefingVoice();
      return;
    }

    void playBriefingVoice();

    return () => {
      stopBriefingVoice();
    };
  }, [phase, playBriefingVoice, stopBriefingVoice]);

  useEffect(() => {
    if (phase !== 'briefing' || !briefingSpeaking) {
      setBriefingPose(1);
      return;
    }

    const timer = window.setInterval(() => {
      setBriefingPose((current) => (current >= 5 ? 1 : current + 1));
    }, 900);

    return () => window.clearInterval(timer);
  }, [phase, briefingSpeaking]);

  const q = quiz.questions[idx];
  const copy = questionCopy(q, lang);
  const ord = order[idx] ?? [0, 1, 2, 3];
  const correctDisplay = ord.indexOf(q.correct);
  const level = quizLevelOf(quiz, q.n);
  const letters = LETTERS[lang];
  const isGolden = q.n === quiz.golden;
  const isExpertFinal = level.id === 6;
  const score = phase === 'won' ? quiz.total : idx;
  const streak = idx;

  const reviewMistakes: ReviewMistake[] = quiz.questions.flatMap((item) => {
    const wrongAttempts = attempts.filter(
      (attempt) => attempt.questionNumber === item.n && !attempt.isCorrect,
    );
    if (wrongAttempts.length === 0) return [];

    const itemCopy = questionCopy(item, lang);
    const selectedAnswers = Array.from(
      new Set(
        wrongAttempts.map((attempt) =>
          attempt.selectedOption === null
            ? lang === 'ar'
              ? 'انتهى الوقت دون إجابة'
              : lang === 'ur'
                ? 'وقت ختم ہو گیا اور جواب نہیں دیا گیا'
                : 'Time expired without an answer'
            : itemCopy.options[attempt.selectedOption],
        ),
      ),
    );

    return [
      {
        questionNumber: item.n,
        question: itemCopy.text,
        selectedAnswers,
        correctAnswer: itemCopy.options[item.correct],
        explanation: itemCopy.explanation,
      },
    ];
  });

  const saveAttempt = useCallback(
    (pickedDisplayIndex: number | null, timedOut = false) => {
      const selectedOption =
        pickedDisplayIndex === null ? null : (ord[pickedDisplayIndex] ?? null);
      const timeSpentSeconds = Math.max(
        1,
        Math.ceil((Date.now() - attemptStartedAt.current) / 1000),
      );

      setAttempts((current) => [
        ...current,
        {
          questionNumber: q.n,
          selectedOption,
          correctOption: q.correct,
          isCorrect: selectedOption === q.correct,
          timedOut,
          timeSpentSeconds,
        },
      ]);

      attemptStartedAt.current = Date.now();
    },
    [ord, q.correct, q.n],
  );

  const mood: Mood =
    phase === 'lost' ? 'ko'
    : phase === 'won' ? 'win'
    : phase === 'correct' || phase === 'milestone' ? 'happy'
    : phase === 'question' ? 'think'
    : 'idle';

  const advance = useCallback(() => {
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    setSelected(null);
    setWrongAttempt(false);
    setLeft(TIME);
    setPhase(quiz.questions[nextIdx]?.n === quiz.golden ? 'golden' : 'question');
  }, [idx, quiz]);

  const confirm = useCallback(() => {
    if (selected === null) return;
    saveAttempt(selected);

    if (selected === correctDisplay) {
      sfx.correct();
      setWrongAttempt(false);
      setPhase('correct');
    } else {
      sfx.wrong();
      setWrongAttempt(true);
      setSelected(null);
      setLeft(TIME);
    }
  }, [selected, correctDisplay, saveAttempt]);

  const next = useCallback(() => {
    if (q.n === quiz.total) {
      sfx.win();
      setNewBest(recordScore(quiz.total, quiz.kids));
      setPhase('won');
    } else if (MS[q.n]) {
      sfx.levelup();
      setPhase('milestone');
    } else advance();
  }, [q.n, advance, MS, quiz.total, quiz.kids]);

  const share = useCallback(async () => {
    const text = s.shareTextWin;
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: s.appTitle, text, url });
        return;
      }
    } catch {
      return; // المستخدم ألغى المشاركة
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [s]);

  const saveGameState = useCallback(
    async (extra: {
      completed?: boolean;
      certificateRequested?: boolean;
      certificateSent?: boolean;
      fraudExperience?: 'yes' | 'no' | null;
      fraudDetails?: string;
      extortionExperience?: 'yes' | 'no' | null;
      extortionDetails?: string;
    } = {}) => {
      const savedName = registeredNameRef.current.trim() || playerName.trim();
      const savedEmail = registeredEmailRef.current.trim() || playerEmail.trim();
      const savedPhone = registeredPhoneRef.current.trim() || playerPhone.trim();

      if (
        !age ||
        !gender ||
        !savedName ||
        (savedEmail && !validEmail(savedEmail)) ||
        !playerIdRef.current ||
        !gameIdRef.current
      ) {
        return;
      }

      const payload = {
        playerId: playerIdRef.current,
        gameId: gameIdRef.current,
        playerName: savedName,
        playerEmail: savedEmail,
        playerPhone: savedPhone,
        lang,
        ageGroup: age,
        gender,
        quizType: quiz.kids ? 'kids' : 'adult',
        score: extra.completed ? quiz.total : Math.min(idx, quiz.total),
        total: quiz.total,
        durationSeconds: Math.max(0, Math.round((Date.now() - gameStartedAt.current) / 1000)),
        completed: extra.completed === true,
        certificateRequested: extra.certificateRequested === true,
        certificateSent: extra.certificateSent === true,
        fraudExperience: extra.fraudExperience ?? null,
        fraudDetails: extra.fraudDetails ?? '',
        extortionExperience: extra.extortionExperience ?? null,
        extortionDetails: extra.extortionDetails ?? '',
        attempts,
      };

      let lastError: unknown = null;

      for (let saveTry = 0; saveTry < 3; saveTry += 1) {
        try {
          const response = await fetch('/api/game-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            cache: 'no-store',
            body: JSON.stringify(payload),
          });

          if (response.ok) return;

          const detail = await response.text().catch(() => '');
          lastError = new Error(`Game state save failed (${response.status}) ${detail}`);
        } catch (error) {
          lastError = error;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 350 * (saveTry + 1)));
      }

      console.error('Game state save failed after retries:', lastError);
      throw lastError instanceof Error ? lastError : new Error('Game state save failed');
    },
    [age, gender, playerName, playerEmail, playerPhone, lang, quiz.kids, quiz.total, idx, attempts],
  );

  useEffect(() => {
    if (
      phase !== 'survey' ||
      !age ||
      !gender ||
      !gameIdRef.current ||
      (fraudExperience === null && extortionExperience === null)
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveGameState({
        completed: true,
        fraudExperience,
        fraudDetails: fraudExperience === 'yes' ? fraudDetails : '',
        extortionExperience,
        extortionDetails: extortionExperience === 'yes' ? extortionDetails : '',
      }).catch((error) => {
        console.error('Survey autosave failed:', error);
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    phase,
    age,
    gender,
    fraudExperience,
    fraudDetails,
    extortionExperience,
    extortionDetails,
    saveGameState,
  ]);

  const finishReview = useCallback(() => {
    setReviewComplete(true);
    setPhase('video');
  }, []);

  const finishVideo = useCallback(() => {
    setVideoError(false);
    setVideoComplete(true);
    setVideoProgress(100);
    setPhase('survey');
    sfx.win();
  }, []);

  // تشغيل الفيديو التوعوي المحلي تلقائياً — وإن منعه المتصفح نعرض زر التشغيل
  useEffect(() => {
    if (phase !== 'video') return;
    introVideoRef.current?.play().catch(() => setVideoTap(true));
  }, [phase]);

  const failVideo = useCallback(() => {
    setVideoError(true);
  }, []);

  const begin = useCallback(() => {
    const savedName = registeredNameRef.current.trim() || nameInput.trim() || playerName.trim();
    const savedEmail = registeredEmailRef.current.trim() || emailInput.trim() || playerEmail.trim();
    const savedPhone = registeredPhoneRef.current.trim() || phoneInput.trim() || playerPhone.trim();

    registeredNameRef.current = savedName;
    registeredEmailRef.current = savedEmail;
    registeredPhoneRef.current = savedPhone;

    if (!playerIdRef.current) playerIdRef.current = devicePlayerId();
    if (!gameIdRef.current) {
      gameIdRef.current = crypto.randomUUID();
    }
    gameStartedAt.current = Date.now();
    analyticsSent.current = false;

    if (age && gender && savedName && (!savedEmail || validEmail(savedEmail))) {
      void fetch('/api/game-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        cache: 'no-store',
        body: JSON.stringify({
          playerId: playerIdRef.current,
          gameId: gameIdRef.current,
          playerName: savedName,
          playerEmail: savedEmail,
          playerPhone: savedPhone,
          lang,
          ageGroup: age,
          gender,
          quizType: quiz.kids ? 'kids' : 'adult',
          score: 0,
          total: quiz.total,
          durationSeconds: 0,
          completed: false,
          attempts: [],
        }),
      }).then(async (response) => {
        if (!response.ok) {
          console.error('Initial player save failed:', response.status, await response.text().catch(() => ''));
        }
      }).catch((error) => {
        console.error('Initial player save failed:', error);
      });
    }
    setOrder(quiz.questions.map(() => shuffled()));
    setIdx(0);
    setSelected(null);
    setAttempts([]);
    setWrongAttempt(false);
    setReviewComplete(false);
    setVideoComplete(false);
    setVideoProgress(0);
    setVideoError(false);
    setFraudExperience(null);
    setFraudDetails('');
    setExtortionExperience(null);
    setExtortionDetails('');
    setCert(false);
    setLeft(TIME);
    setCount(COUNT_FROM);
    setNewBest(false);
    setPhase('countdown');
  }, [age, gender, lang, emailInput, nameInput, phoneInput, playerEmail, playerName, playerPhone, quiz]);

  // يحفظ اكتمال الجولة فورًا مع إعادة المحاولة عند تعذر الحفظ مؤقتًا.
  useEffect(() => {
    if (phase !== 'won' || analyticsSent.current || !age || !gender || !gameIdRef.current) return;
    analyticsSent.current = true;

    void saveGameState({ completed: true }).catch((error) => {
      console.error('Completed game save failed:', error);
      analyticsSent.current = false;
    });
  }, [phase, age, gender, saveGameState]);

  // يبدأ حساب وقت المحاولة عند ظهور السؤال، ويحفظ السجل مؤقتاً للمراجعة والتقارير.
  useEffect(() => {
    if (phase === 'question') attemptStartedAt.current = Date.now();
  }, [phase, idx]);

  useEffect(() => {
    sessionStorage.setItem('cyberChallengeAttempts', JSON.stringify(attempts));
  }, [attempts]);

  // العدّ التنازلي قبل السؤال الأول
  useEffect(() => {
    if (phase !== 'countdown') return;
    const t = setTimeout(() => {
      if (count <= 1) {
        sfx.start();
        setPhase('question');
      } else {
        sfx.tick();
        setCount(count - 1);
      }
    }, 620);
    return () => clearTimeout(t);
  }, [phase, count]);

  // مؤقّت السؤال — انتهاء الوقت يُسجّل كمحاولة خاطئة ويعيد السؤال نفسه.
  useEffect(() => {
    if (phase !== 'question' || !timerOn || left <= 0) return;
    const t = setTimeout(() => {
      if (left <= 1) {
        sfx.wrong();
        saveAttempt(null, true);
        setSelected(null);
        setWrongAttempt(true);
        setLeft(TIME);
      } else {
        const tickAt = level.id >= 4 ? 10 : level.id === 3 ? 8 : 6;
        if (left <= tickAt) sfx.tick();
        setLeft(left - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, timerOn, left, saveAttempt, level.id]);

  // الاحتفال الذهبي: دحرجة طبول ثم يبدأ السؤال تلقائياً
  useEffect(() => {
    if (phase !== 'golden') return;
    sfx.drumroll();
    const t = setTimeout(() => setPhase('question'), 2600);
    return () => clearTimeout(t);
  }, [phase]);

  // تمرير تلقائي: السؤال الجديد من أعلى الصفحة، والنتيجة إلى مجال الرؤية
  useEffect(() => {
    if (phase === 'question') window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (phase === 'correct') {
      const t = setTimeout(
        () => revealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
        60,
      );
      return () => clearTimeout(t);
    }
  }, [phase, idx]);

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'question') {
        const n = Number(e.key);
        if (n >= 1 && n <= 4) {
          sfx.select();
          setSelected(n - 1);
        }
        if (e.key === 'Enter') confirm();
      } else if (phase === 'correct' && e.key === 'Enter') next();
      else if (phase === 'milestone' && e.key === 'Enter') advance();
      else if (phase === 'golden' && (e.key === 'Enter' || e.key === ' ')) setPhase('question');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, confirm, next, advance]);

  const MenuBtn = (
    <Link
      href="/"
      aria-label={s.menu}
      className="pxl px-2 py-1.5"
      style={{ background: 'var(--panel)' }}
    >
      <span className="pixel text-[10px]">MENU</span>
    </Link>
  );

  const MuteBtn = (
    <button
      onClick={() => {
        toggleMuted();
        if (mute) sfx.select();
      }}
      aria-label={s.sound}
      className="pxl px-2 py-1.5"
      style={{ background: 'var(--panel)' }}
    >
      <span className="pixel text-[10px]">{mute ? 'OFF' : 'ON'}</span>
    </button>
  );

  const MenuLink = (
    <Link
      href="/"
      className="ink-sm inline-flex items-center gap-2 text-xs font-black text-[var(--fg-muted)] hover:text-white"
    >
      <span className="pixel text-[9px]" dir="ltr">
        MENU
      </span>
      {lang !== 'en' && <span>{s.menu}</span>}
    </Link>
  );

  /* ------------------------------------------------- اختيار النوع أولاً */
  /* ----------------------------------------- رسالة توعوية بعد اختيار العمر */
  if (phase === 'briefing') {
    return (
      <div
        className="relative min-h-dvh overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/hq-h.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-slate-950/35" />

        <img
          src={`/saif-${briefingPose}.png`}
          alt={lang === 'ar' ? 'سيف' : lang === 'ur' ? 'سیف' : 'Saif'}
          className={`pointer-events-none absolute end-[6%] top-[8%] z-10 h-[38vh] max-h-[430px] w-auto object-contain drop-shadow-2xl transition-transform duration-300 sm:h-[48vh] ${
            briefingSpeaking ? 'scale-[1.02]' : 'scale-100'
          }`}
        />

        <div className="relative z-20 mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-end px-4 pb-6 sm:px-6 sm:pb-10">
          <div className="mx-auto w-full max-w-4xl">
            <div
              className="relative rounded-[30px] bg-white/95 px-6 pb-6 pt-8 text-center sm:px-10 sm:pb-8"
              style={{
                border: '2px solid rgba(152,175,196,.78)',
                boxShadow: '0 18px 42px rgba(19,45,70,.28)',
                backdropFilter: 'blur(7px)',
              }}
            >
              <div
                className="absolute -top-4 end-8 rounded-full px-5 py-2 text-sm font-black text-white"
                style={{ background: '#0d7d75', boxShadow: '0 4px 0 rgba(8,92,86,.22)' }}
              >
                {lang === 'ar' ? 'سيف 🛡️' : lang === 'ur' ? 'سیف 🛡️' : 'Saif 🛡️'}
              </div>

              <p
                className="ink mx-auto max-w-3xl text-lg font-black leading-[2.15] sm:text-2xl"
                dir={lang === 'en' ? 'ltr' : 'rtl'}
                style={{ color: '#102b4c' }}
              >
                {briefingText}
              </p>

              {briefingVoiceLoading && (
                <p className="ink-sm mt-3 text-xs font-bold text-[var(--fg-muted)]">
                  {lang === 'ar' ? 'جارٍ تجهيز الصوت…' : lang === 'ur' ? 'آواز تیار ہو رہی ہے…' : 'Preparing voice…'}
                </p>
              )}

              {briefingVoiceError && (
                <p className="ink-sm mt-3 text-xs font-bold text-red-700">
                  {lang === 'ar'
                    ? 'تعذر تشغيل الصوت على هذا الجهاز.'
                    : lang === 'ur'
                      ? 'اس ڈیوائس پر آواز نہیں چل سکی۔'
                      : 'The voice could not play on this device.'}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                stopBriefingVoice();
                sfx.confirm();
                setPhase('gender');
              }}
              className="mt-5 w-full rounded-2xl px-6 py-4 text-xl font-black text-white transition-transform active:translate-y-[3px]"
              style={{
                background: '#58cc02',
                boxShadow: '0 5px 0 #46a302',
              }}
            >
              {lang === 'ar' ? 'هيا لنبدأ' : lang === 'ur' ? 'آئیے شروع کریں' : 'Let’s begin'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'gender') {
    return (
      <Shell dim={0.35}>
        <div className="anim-in flex min-h-[86dvh] flex-col items-center justify-center text-center">
          <div className="flex w-full max-w-md items-center gap-3 self-center">
            <button
              onClick={() => {
                sfx.select();
                setPhase('age');
              }}
              aria-label={s.back}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-black"
              style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', color: 'var(--fg-muted)' }}
            >
              {dirArrow(lang)}
            </button>
            <OnbProgress step={2} className="flex-1" />
          </div>
          <p className="pixel ink-sm mt-6 text-[10px] text-[var(--fg-muted)]" dir="ltr">
            PLAYER SELECT
          </p>
          <h1 className="ink mt-4 text-3xl font-black text-[var(--gold-dark)] sm:text-4xl">
            {s.onbGenderTitle}
          </h1>
          <p className="ink-sm mt-4 text-xs font-bold text-[var(--fg-muted)]">
            {s.onbGenderHint}
          </p>
          <p className="ink-sm blink mt-3 text-sm font-black text-[var(--gold-dark)]">
            ▼ {s.pickCharacter} ▼
          </p>

          <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-4">
            {(['male', 'female'] as Gender[]).map((g) => {
              const accent = g === 'male' ? '#4b8dff' : '#ff6ea3';
              return (
                <button
                  key={g}
                  onClick={() => {
                    setGender(g);
                    sfx.select();
                  }}
                  className="pxl flex flex-col items-center gap-3 px-3 pb-4 pt-6 transition-transform active:scale-[0.98]"
                  style={{ background: gender === g ? '#eefaf3' : '#ffffff' }}
                >
                  <Mascot gender={g} kid={quiz.kids} mood="happy" size={170} />
                  <span
                    className="w-full rounded-2xl py-1.5 text-base font-black"
                    style={{ background: accent, color: '#fff', boxShadow: 'var(--shadow-sm)' }}
                  >
                    {g === 'male' ? s.male : s.female}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="mt-6 w-full max-w-md rounded-2xl px-4 py-3 text-center"
            style={{
              background: 'rgba(255,255,255,0.94)',
              border: '2px solid #e0a21a',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <p className="ink text-base font-black leading-7 text-[var(--gold-dark)]">
              {lang === 'ar'
                ? 'أدخل بياناتك للحصول على الشهادة'
                : lang === 'ur'
                  ? 'سرٹیفکیٹ حاصل کرنے کے لیے اپنی معلومات درج کریں'
                  : 'Enter your details to receive your certificate'}
            </p>
            <p className="ink-sm mt-1 text-xs font-bold leading-6 text-[var(--fg-muted)]">
              {lang === 'ar'
                ? 'الاسم إجباري، أما البريد الإلكتروني ورقم الهاتف فاختياريان. إذا رغبتم في استلام الشهادة عبر البريد الإلكتروني، يرجى إدخال بريدكم الإلكتروني.'
                : lang === 'ur'
                  ? 'نام لازمی ہے۔ ای میل اور فون نمبر اختیاری ہیں۔ اگر آپ سرٹیفکیٹ ای میل پر چاہتے ہیں تو اپنا ای میل درج کریں۔'
                  : 'Name is required. Email and phone number are optional. If you want the certificate sent by email, enter your email address.'}
            </p>
          </div>

          <div className="mt-4 w-full max-w-md space-y-3 text-start">
            <label className="block">
              <span className="ink-sm mb-1 block text-xs font-black">
                {lang === 'ar' ? 'الاسم الكامل *' : lang === 'ur' ? 'پورا نام *' : 'Full name *'}
              </span>
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                maxLength={120}
                autoComplete="name"
                className="ink-sm w-full rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--blue)]"
                placeholder={lang === 'ar' ? 'اكتب اسمك الكامل' : lang === 'ur' ? 'اپنا پورا نام لکھیں' : 'Enter your full name'}
              />
            </label>

            <label className="block">
              <span className="ink-sm mb-1 block text-xs font-black">
                {lang === 'ar' ? 'البريد الإلكتروني (اختياري)' : lang === 'ur' ? 'ای میل (اختیاری)' : 'Email (optional)'}
              </span>
              <input
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                maxLength={180}
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                className="ink-sm w-full rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--blue)]"
                placeholder="name@example.com"
              />
            </label>

            {emailInput.trim() && !validEmail(emailInput) && (
              <p className="ink-sm text-xs font-black text-red-700">
                {lang === 'ar'
                  ? 'تأكد من كتابة البريد الإلكتروني بشكل صحيح.'
                  : lang === 'ur'
                    ? 'براہ کرم درست ای میل درج کریں۔'
                    : 'Please enter a valid email address.'}
              </p>
            )}

            <label className="block">
              <span className="ink-sm mb-1 block text-xs font-black">
                {lang === 'ar'
                  ? 'رقم الهاتف (اختياري)'
                  : lang === 'ur'
                    ? 'فون نمبر (اختیاری)'
                    : 'Phone number (optional)'}
              </span>
              <input
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                maxLength={40}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                className="ink-sm w-full rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--blue)]"
                placeholder={lang === 'ar' ? '05xxxxxxxxx' : '+971 5X XXX XXXX'}
              />
            </label>

            <PixelButton
              size="lg"
              className="w-full"
              disabled={!gender || !nameInput.trim() || Boolean(emailInput.trim() && !validEmail(emailInput))}
              onClick={async () => {
                const savedName = nameInput.trim();
                const savedEmail = emailInput.trim();
                const savedPhone = phoneInput.trim();

                if (!savedName || !age || !gender) return;
                if (savedEmail && !validEmail(savedEmail)) return;

                registeredNameRef.current = savedName;
                registeredEmailRef.current = savedEmail;
                registeredPhoneRef.current = savedPhone;

                playerIdRef.current = devicePlayerId();
                gameIdRef.current = crypto.randomUUID();
                gameStartedAt.current = Date.now();

                setName(savedName);
                setEmail(savedEmail);
                setPhone(savedPhone);

                try {
                  const response = await fetch('/api/game-results', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    cache: 'no-store',
                    body: JSON.stringify({
                      playerId: playerIdRef.current,
                      gameId: gameIdRef.current,
                      playerName: savedName,
                      playerEmail: savedEmail,
                      playerPhone: savedPhone,
                      lang,
                      ageGroup: age,
                      gender,
                      quizType: quiz.kids ? 'kids' : 'adult',
                      score: 0,
                      total: quiz.total,
                      durationSeconds: 0,
                      completed: false,
                      certificateRequested: false,
                      certificateSent: false,
                      attempts: [],
                    }),
                  });

                  if (!response.ok) {
                    // تعذُّر الحفظ (قاعدة بيانات غير مهيأة أو شبكة متقطعة) لا يمنع اللعب
                    const detail = await response.text().catch(() => '');
                    console.warn('Registration save skipped:', response.status, detail);
                  }
                } catch (error) {
                  console.warn('Registration save skipped:', error);
                }

                sfx.confirm();
                setPhase('intro');
              }}
            >
              {lang === 'ar' ? 'متابعة' : lang === 'ur' ? 'جاری رکھیں' : 'Continue'}
            </PixelButton>

          </div>

          <div className="mt-8">{MenuLink}</div>
        </div>
      </Shell>
    );
  }

  /* --------------------------------------------- الفئة العمرية (أسلوب Duo) */
  if (phase === 'age') {
    return (
      <Shell dim={0.35}>
        <div className="anim-in flex min-h-[92dvh] flex-col">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label={s.menu}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-black"
              style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', color: 'var(--fg-muted)' }}
            >
              {dirArrow(lang)}
            </Link>
            <OnbProgress step={1} className="flex-1" />
          </div>

          {/* الشخصية تسأل عبر فقاعة حوار */}
          <div className="mt-6 flex items-end gap-3">
            <Mascot gender={gender} kid={agePick === '12-17'} mood="think" size={120} />
            <div className="relative mb-8 flex-1">
              <div
                className="rounded-3xl px-4 py-3"
                style={{ background: '#fff', border: '2px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}
              >
                <p className="text-lg font-black">{s.onbAgeTitle}</p>
                <p className="mt-0.5 text-[11px] font-bold" style={{ color: 'var(--muted, #7e94aa)' }}>
                  {s.onbAgeHint}
                </p>
              </div>
              <span
                className="absolute -bottom-[9px] start-6 h-4 w-4 rotate-45"
                style={{ background: '#fff', borderInlineStart: '2px solid var(--line)', borderBottom: '2px solid var(--line)' }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {AGE_GROUPS.map((val, i) => {
              const active = agePick === val;
              return (
                <button
                  key={val}
                  onClick={() => {
                    sfx.select();
                    setAgePick(val);
                  }}
                  aria-pressed={active}
                  className="rounded-2xl px-3 py-3.5 text-start text-sm font-black transition-transform active:scale-[0.98]"
                  style={{
                    background: active ? '#ddf4ff' : '#ffffff',
                    border: `2px solid ${active ? '#1cb0f6' : 'var(--line)'}`,
                    borderBottomWidth: 4,
                    color: active ? '#1899d6' : 'var(--fg)',
                  }}
                >
                  {s.ageGroups[i]}
                </button>
              );
            })}
          </div>

          <div
            className="sticky bottom-0 mt-auto pt-6"
            style={{ background: 'linear-gradient(180deg, rgba(240,248,255,0) 0%, rgba(240,248,255,0.92) 40%)', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <button
              disabled={agePick === null}
              onClick={() => {
                if (agePick === null) return;
                setAge(agePick);
                sfx.confirm();
                setPhase('briefing');
              }}
              className="w-full rounded-2xl px-6 py-4 text-lg font-black uppercase tracking-wide transition-transform active:translate-y-[3px] disabled:cursor-not-allowed"
              style={{
                background: agePick === null ? '#e5e9ef' : '#58cc02',
                color: agePick === null ? '#a9b4c0' : '#ffffff',
                boxShadow: agePick === null ? 'none' : '0 4px 0 0 #46a302',
              }}
            >
              {s.continue}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ---------------------------------------------------------- شاشة البداية */
  if (phase === 'intro') {
    return (
      <Shell dim={0.45}>
        <div className="anim-in flex min-h-[80dvh] flex-col justify-center text-center">
          <div className="flex justify-center">
            <Mascot gender={gender} kid={quiz.kids} mood="idle" size={150} />
          </div>
          <p className="pixel ink-sm mt-4 text-[10px] text-[var(--fg-muted)]">READY?</p>
          <h1 className="ink mt-3 text-4xl font-black text-[var(--gold-dark)] sm:text-5xl">
            {s.ready}
          </h1>
          {best > 0 && (
            <p className="ink-sm mt-4 text-xs font-black text-[var(--gold-dark)]">
              🏆 {s.bestScore}: {best} / {quiz.total}
            </p>
          )}

          <div className="mx-auto mt-7 w-full max-w-md space-y-2 text-start">
            <Rule badge="1UP">{s.rule1}</Rule>
            <Rule badge="∞">{s.rule2}</Rule>
            <Rule badge="?!">{s.rule3}</Rule>
          </div>

          <Panel className="mx-auto mt-4 flex w-full max-w-md items-center justify-between px-4 py-3 text-start">
            <span>
              <span className="ink-sm block text-sm font-black">{s.timer}</span>
              <span className="tnum ink-sm block text-xs text-[var(--fg-muted)]">
                {s.timerSub}
              </span>
            </span>
            <button
              role="switch"
              aria-checked={timerOn}
              aria-label={s.timer}
              onClick={() => {
                sfx.select();
                setTimerOn((v) => !v);
              }}
              className="pxl px-3 py-2"
              style={{
                background: timerOn ? '#2fa96a' : 'var(--night-2)',
                color: timerOn ? '#fff' : 'var(--fg-muted)',
              }}
            >
              <span className="pixel text-[10px]">{timerOn ? 'ON' : 'OFF'}</span>
            </button>
          </Panel>

          <div className="mx-auto mt-6 w-full max-w-md">
            <PixelButton
              size="lg"
              className="w-full"
              sound="none"
              onClick={() => {
                sfx.confirm();
                begin();
              }}
            >
              <span className="pixel">START</span>
              <span className="ms-3">{s.start}</span>
            </PixelButton>
          </div>

          <div className="mt-6 flex justify-center">{MenuLink}</div>
        </div>
      </Shell>
    );
  }

  /* ------------------------------------------------------- العدّ التنازلي */
  if (phase === 'countdown') {
    return (
      <Shell dim={0.45}>
        <div className="flex min-h-[80dvh] flex-col items-center justify-center text-center">
          <img
            src={playerIdleAvatar}
            alt=""
            aria-hidden
            className="h-48 w-40 object-contain drop-shadow-lg"
          />
          <p key={count} className="title-px count-pop mt-8 text-8xl font-black sm:text-9xl">
            {count}
          </p>
          <p className="ink-sm mt-6 text-sm font-black text-[var(--fg-muted)]">{s.getReady}</p>
        </div>
      </Shell>
    );
  }

  /* ---------------------------------------------------------- شاشة المراجعة */
  if (phase === 'review') {
    return (
      <Shell dim={0.6}>
        <div className="anim-in">
          <div className="flex items-center justify-between gap-3">
            <h1 className="ink text-xl font-black">{s.reviewMode}</h1>
            <div className="flex items-center gap-2">
              <PixelButton size="sm" color="slate" onClick={() => setPhase('intro')}>
                {s.finish}
              </PixelButton>
              {MenuBtn}
            </div>
          </div>
          <p className="ink-sm mt-3 text-xs font-bold leading-7 text-[var(--fg-muted)]">
            {reviewMistakes.length > 0
              ? lang === 'ar'
                ? 'ناقش إجاباتك مع المساعد الذكي حتى تفهم سبب الخطأ والإجابة الصحيحة.'
                : lang === 'ur'
                  ? 'ہر غلطی اور درست جواب سمجھنے کے لیے ذہین معاون کے ساتھ اپنے جوابات کا جائزہ لیں۔'
                  : 'Discuss your answers with the AI coach to understand each mistake and the correct answer.'
              : lang === 'ar'
                ? 'لم تسجل أي إجابة خاطئة في هذه الجولة.'
                : lang === 'ur'
                  ? 'اس مرحلے میں کوئی غلط جواب ریکارڈ نہیں ہوا۔'
                  : 'You did not record any incorrect answers in this round.'}
          </p>
          <AiReviewChat mistakes={reviewMistakes} lang={lang} onComplete={finishReview} />
          <PixelButton size="lg" className="mt-6 w-full" onClick={begin}>
            {s.retry}
          </PixelButton>
        </div>
      </Shell>
    );
  }

  /* ---------------------------------------------------------- الفيديو التوعوي */
  if (phase === 'video') {
    return (
      <Shell dim={0.55}>
        <div className="anim-in">
          <div className="flex items-center justify-between gap-3">
            <h1 className="ink text-xl font-black">
              {lang === 'ar' ? 'الفيديو التوعوي' : lang === 'ur' ? 'آگاہی ویڈیو' : 'Awareness video'}
            </h1>
            {MenuBtn}
          </div>

          <Panel tone="gold" className="mt-4 p-4 text-center">
            <p className="ink-sm text-sm font-black leading-7">
              {lang === 'ar'
                ? `هذا الفيديو مخصص للفئة العمرية ${ageLabel}. شاهده كاملًا لفتح الشهادة.`
                : lang === 'ur'
                  ? `یہ ویڈیو ${ageLabel} عمر کے گروپ کے لیے ہے۔ سرٹیفکیٹ کھولنے کے لیے اسے مکمل دیکھیں۔`
                  : `This video is for the ${ageLabel} age group. Watch it fully to unlock your certificate.`}
            </p>
          </Panel>

          <Panel className="mt-4 overflow-hidden p-3" tone="panel">
            <div className="relative overflow-hidden rounded-2xl" style={{ background: '#04101f' }}>
              <video
                ref={introVideoRef}
                data-testid="intro-video"
                src={`/videos/intro-${quiz.kids ? 'kids' : 'adult'}.mp4${quiz.kids ? '' : '?v=2'}`}
                className="block aspect-video w-full"
                playsInline
                preload="auto"
                onEnded={finishVideo}
                onError={failVideo}
                onPlay={() => setVideoTap(false)}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (!videoComplete && v.duration > 0) {
                    setVideoProgress(Math.min(99, Math.round((v.currentTime / v.duration) * 100)));
                  }
                }}
                onClick={(e) => {
                  const v = e.currentTarget;
                  if (v.paused) v.play().catch(() => setVideoTap(true));
                  else v.pause();
                }}
              />
              {videoTap && (
                <button
                  onClick={() => introVideoRef.current?.play().catch(() => {})}
                  aria-label={lang === 'ar' ? 'اضغط للتشغيل' : lang === 'ur' ? 'چلانے کے لیے دبائیں' : 'Tap to play'}
                  className="absolute inset-0 grid place-items-center"
                  style={{ background: 'rgba(4, 16, 31, 0.45)' }}
                >
                  <span
                    className="grid h-16 w-16 place-items-center rounded-full pb-1 ps-1 text-2xl"
                    style={{ background: '#58cc02', color: '#fff', boxShadow: '0 4px 0 0 #46a302' }}
                  >
                    ▶
                  </span>
                </button>
              )}
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200" aria-hidden>
              <div
                className="h-full rounded-full bg-[var(--green)] transition-[width] duration-300"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
            <p className="ink-sm mt-2 text-center text-xs font-black text-[var(--fg-muted)]">
              {videoComplete
                ? lang === 'ar'
                  ? '✅ اكتملت المشاهدة. انتقل الآن إلى الأسئلة الأخيرة قبل الشهادة.'
                  : lang === 'ur'
                    ? '✅ ویڈیو مکمل ہو گئی۔ سرٹیفکیٹ سے پہلے آخری سوالات مکمل کریں۔'
                    : '✅ Video complete. Please answer the final questions before receiving your certificate.'
                : lang === 'ar'
                  ? `نسبة المشاهدة: ${videoProgress}%`
                  : lang === 'ur'
                    ? `دیکھنے کی پیش رفت: ${videoProgress}%`
                    : `Watched: ${videoProgress}%`}
            </p>

            {videoError && (
              <p className="ink-sm mt-3 text-center text-xs font-black text-red-700" role="alert">
                {lang === 'ar'
                  ? 'تعذر تشغيل الفيديو. تحقق من اتصال الإنترنت ثم أعد المحاولة.'
                  : lang === 'ur'
                    ? 'ویڈیو نہیں چل سکی۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔'
                    : 'The video could not play. Check the internet connection and try again.'}
              </p>
            )}
          </Panel>

          {!videoComplete && (
            <PixelButton
              size="lg"
              color="green"
              className="mt-4 w-full"
              disabled
            >
              {lang === 'ar'
                ? '🔒 أكمل الفيديو للمتابعة'
                : lang === 'ur'
                  ? '🔒 جاری رکھنے کے لیے ویڈیو مکمل کریں'
                  : '🔒 Finish the video to continue'}
            </PixelButton>
          )}

          <PixelButton size="md" className="mt-3 w-full" onClick={begin}>
            {s.retry}
          </PixelButton>
        </div>

      </Shell>
    );
  }

  /* ---------------------------------------------------- أسئلة قبل الشهادة */
  if (phase === 'survey') {
    const surveyReady =
      fraudExperience !== null &&
      extortionExperience !== null &&
      (fraudExperience === 'no' || fraudDetails.trim().length >= 3) &&
      (extortionExperience === 'no' || extortionDetails.trim().length >= 3);

    return (
      <Shell dim={0.55}>
        <div className="anim-in">
          <div className="flex items-center justify-between gap-3">
            <h1 className="ink text-xl font-black">
              {lang === 'ar'
                ? 'أسئلة أخيرة قبل الشهادة'
                : lang === 'ur'
                  ? 'سرٹیفکیٹ سے پہلے آخری سوالات'
                  : 'Final questions before your certificate'}
            </h1>
            {MenuBtn}
          </div>

          <Panel tone="gold" className="mt-4 p-4 text-center">
            <p className="ink-sm text-sm font-black leading-7">
              {lang === 'ar'
                ? 'أجب عن السؤالين التاليين. إذا اخترت «نعم»، اكتب الموقف باختصار بدون ذكر أي بيانات شخصية حساسة.'
                : lang === 'ur'
                  ? 'اگلے دو سوالات کے جواب دیں۔ اگر «ہاں» منتخب کریں تو واقعہ مختصراً لکھیں اور حساس ذاتی معلومات شامل نہ کریں۔'
                  : 'Answer the two questions below. If you choose “Yes”, briefly describe what happened without including sensitive personal information.'}
            </p>
          </Panel>

          <Panel className="mt-4 p-4" tone="panel">
            <p className="ink text-base font-black leading-7">
              {lang === 'ar'
                ? '1. هل سبق وتعرضت للاحتيال الإلكتروني؟'
                : lang === 'ur'
                  ? '1. کیا آپ کبھی آن لائن فراڈ کا شکار ہوئے ہیں؟'
                  : '1. Have you ever experienced online fraud?'}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <PixelButton
                size="md"
                color={fraudExperience === 'yes' ? 'blue' : 'slate'}
                onClick={() => {
                  setFraudExperience('yes');
                  sfx.select();
                }}
              >
                {lang === 'ar' ? 'نعم' : lang === 'ur' ? 'ہاں' : 'Yes'}
              </PixelButton>
              <PixelButton
                size="md"
                color={fraudExperience === 'no' ? 'green' : 'slate'}
                onClick={() => {
                  setFraudExperience('no');
                  setFraudDetails('');
                  sfx.select();
                }}
              >
                {lang === 'ar' ? 'لا' : lang === 'ur' ? 'نہیں' : 'No'}
              </PixelButton>
            </div>

            {fraudExperience === 'yes' && (
              <textarea
                value={fraudDetails}
                onChange={(event) => setFraudDetails(event.target.value)}
                maxLength={800}
                rows={4}
                className="ink-sm mt-3 w-full rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--blue)]"
                placeholder={
                  lang === 'ar'
                    ? 'اكتب باختصار نوع الاحتيال أو الموقف الذي تعرضت له...'
                    : lang === 'ur'
                      ? 'مختصراً لکھیں کہ کس قسم کا فراڈ یا واقعہ پیش آیا...'
                      : 'Briefly describe the fraud or situation you experienced...'
                }
              />
            )}
          </Panel>

          <Panel className="mt-4 p-4" tone="panel">
            <p className="ink text-base font-black leading-7">
              {lang === 'ar'
                ? '2. هل سبق وتعرضت للابتزاز الإلكتروني أو محاولة ابتزاز؟'
                : lang === 'ur'
                  ? '2. کیا آپ کبھی آن لائن بلیک میلنگ یا بلیک میلنگ کی کوشش کا سامنا کر چکے ہیں؟'
                  : '2. Have you ever experienced online blackmail or an attempted blackmail?'}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <PixelButton
                size="md"
                color={extortionExperience === 'yes' ? 'blue' : 'slate'}
                onClick={() => {
                  setExtortionExperience('yes');
                  sfx.select();
                }}
              >
                {lang === 'ar' ? 'نعم' : lang === 'ur' ? 'ہاں' : 'Yes'}
              </PixelButton>
              <PixelButton
                size="md"
                color={extortionExperience === 'no' ? 'green' : 'slate'}
                onClick={() => {
                  setExtortionExperience('no');
                  setExtortionDetails('');
                  sfx.select();
                }}
              >
                {lang === 'ar' ? 'لا' : lang === 'ur' ? 'نہیں' : 'No'}
              </PixelButton>
            </div>

            {extortionExperience === 'yes' && (
              <textarea
                value={extortionDetails}
                onChange={(event) => setExtortionDetails(event.target.value)}
                maxLength={800}
                rows={4}
                className="ink-sm mt-3 w-full rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--blue)]"
                placeholder={
                  lang === 'ar'
                    ? 'اكتب باختصار الموقف بدون ذكر أسماء أو أرقام أو معلومات شخصية حساسة...'
                    : lang === 'ur'
                      ? 'نام، نمبر یا حساس ذاتی معلومات کے بغیر واقعہ مختصراً لکھیں...'
                      : 'Briefly describe what happened without names, numbers, or sensitive personal information...'
                }
              />
            )}
          </Panel>

          <PixelButton
            size="lg"
            color="green"
            className="mt-5 w-full"
            disabled={!surveyReady}
            onClick={async () => {
              if (!surveyReady) return;

              try {
                await saveGameState({
                  completed: true,
                  certificateRequested: true,
                  certificateSent: false,
                  fraudExperience,
                  fraudDetails,
                  extortionExperience,
                  extortionDetails,
                });
              } catch {
                // لا نمنع اللاعب من الوصول للشهادة إذا تعذر حفظ الإحصائيات مؤقتًا.
              }

              setCert(true);
              sfx.confirm();
            }}
          >
            {lang === 'ar'
              ? 'متابعة إلى الشهادة'
              : lang === 'ur'
                ? 'سرٹیفکیٹ کی طرف جاری رکھیں'
                : 'Continue to certificate'}
          </PixelButton>
        </div>

        {cert && (
          <Certificate
            score={quiz.total}
            total={quiz.total}
            title={quizCertificateTitle(quiz, quiz.total)[lang]}
            onClose={() => setCert(false)}
            onEmailSent={() => {
              void saveGameState({
                completed: true,
                certificateRequested: true,
                certificateSent: true,
                fraudExperience,
                fraudDetails,
                extortionExperience,
                extortionDetails,
              });
            }}
          />
        )}
      </Shell>
    );
  }

  /* ---------------------------------------------------------- شاشة الانتقال */
  if (phase === 'milestone') {
    return (
      <Shell dim={0.45}>
        <div className="anim-in flex min-h-[80dvh] flex-col items-center justify-center text-center">
          <img src={playerIdleAvatar} alt="" aria-hidden className="h-44 w-36 object-contain drop-shadow-lg" />
          <p className="pixel ink mt-6 text-lg text-[var(--gold-dark)] sm:text-2xl" dir="ltr">
            STAGE CLEAR
          </p>
          <Panel tone="dark" className="mt-6 w-full max-w-md p-6">
            <p className="ink text-xl font-black leading-relaxed">
              {MS[q.n][lang]}
            </p>
            <p className="tnum ink-sm mt-3 text-sm font-bold" style={{ color: '#c6d8ee' }}>
              {q.n} / {quiz.total}
            </p>
            {q.n === 15 && (
              <p className="ink-sm mt-4 text-sm font-black leading-7 text-[var(--red)]">
                {s.expertStage}
              </p>
            )}
          </Panel>
          <PixelButton size="lg" className="mt-7 w-full max-w-md" onClick={advance}>
            {s.continue}
          </PixelButton>
          <div className="mt-5">{MenuLink}</div>
        </div>
      </Shell>
    );
  }

  /* --------------------------------------------------- الاحتفال الذهبي */
  if (phase === 'golden') {
    return (
      <Shell dim={0.75}>
        <button
          onClick={() => setPhase('question')}
          className="flex min-h-[86dvh] w-full flex-col items-center justify-center text-center"
          aria-label={s.goldenQuestion}
        >
          <span
            aria-hidden
            className="pointer-events-none fixed inset-0"
            style={{
              zIndex: -5,
              background:
                'radial-gradient(circle at 50% 40%, rgba(255,207,63,0.30) 0%, rgba(12,26,50,0.66) 36%, rgba(7,16,34,0.94) 100%)',
            }}
          />
          <p className="count-in text-7xl" style={{ color: '#ffcf3f', filter: 'drop-shadow(0 6px 22px rgba(255,207,63,0.55))' }}>
            ★
          </p>
          <p className="pixel ink-sm mt-6 text-xs text-[#ffb020]" dir="ltr">
            ★ GOLDEN QUESTION ★
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl" style={{ color: '#ffcf3f' }}>
            {s.goldenQuestion}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-xs font-bold leading-7" style={{ color: '#dbe7fa' }}>
            {quiz.kids ? s.goldenHintKids : s.goldenHint}
          </p>
          <p className="blink mt-8 text-sm font-black" style={{ color: '#bcd2f0' }}>
            {s.getReady}
          </p>
        </button>
      </Shell>
    );
  }

  /* ---------------------------------------------------------- شاشة الخسارة */
  if (phase === 'lost') {
    const reward = quizRewardFor(quiz, score);
    const timedOut = selected === null;
    return (
      <Shell dim={0.6}>
        <div className="anim-in">
          <div
            aria-hidden
            className="flash-red pointer-events-none fixed inset-0 z-40"
            style={{ background: 'var(--red)' }}
          />
          <Panel tone="red" className="shake p-6 text-center">
            <div className="flex justify-center">
              <img src={playerIdleAvatar} alt="" aria-hidden className="h-40 w-32 object-contain drop-shadow-lg" />
            </div>
            <p className="pixel ink mt-3 text-xl text-[var(--red-dark)] sm:text-3xl" dir="ltr">
              GAME OVER
            </p>
            <h1 className="ink mt-4 text-xl font-black">{timedOut ? s.timeUp : s.wrongAnswer}</h1>
            <p className="ink-sm mx-auto mt-3 max-w-md text-xs font-bold leading-7">
              {s.keepLearning}
            </p>
          </Panel>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label={s.yourScore} value={`${score} / ${quiz.total}`} />
            <Stat
              label={s.reached}
              value={quizLevelOf(quiz, Math.max(1, score || 1))[lang]}
            />
          </div>

          {newBest && (
            <Panel tone="gold" className="mt-3 px-4 py-3 text-center">
              <span className="pixel ink-sm text-[10px]" dir="ltr">
                NEW RECORD!
              </span>
              <span className="ink-sm ms-3 text-sm font-black">{s.newRecord}</span>
            </Panel>
          )}
          {reward && (
            <Panel tone="gold" className="mt-3 px-4 py-3 text-center">
              <span className="ink-sm text-sm font-black">
                🏅 {s.earned}: {reward[lang]}
              </span>
            </Panel>
          )}
          {best > 0 && (
            <p className="ink-sm mt-3 text-center text-xs font-black text-[var(--fg-muted)]">
              {s.bestScore}: {best} / {quiz.total}
            </p>
          )}

          <Panel className="mt-5 p-5">
            <Chip color={level.color}>
              <span className="pixel text-[9px]">{String(q.n).padStart(2, '0')}</span>
            </Chip>
            <p className="ink-sm mt-3 text-sm font-black leading-8">{copy.text}</p>
            <div className="mt-4 space-y-2">
              {ord.map((oi, di) => {
                const opt = copy.options[oi];
                const isCorrect = oi === q.correct;
                const isPicked = di === selected;
                if (!isCorrect && !isPicked) return null;
                return (
                  <div
                    key={oi}
                    className="ink-sm flex items-start gap-3 rounded-2xl px-3 py-2.5 text-xs font-black leading-7"
                    style={{
                      background: isCorrect ? '#e6f7ee' : '#fdecec',
                      color: isCorrect ? '#135f3c' : '#8f2320',
                      border: `1px solid ${isCorrect ? '#bfe8d2' : '#f5c9c7'}`,
                    }}
                  >
                    <span>{letters[di]})</span>
                    <span>{opt}</span>
                    <span className="pixel ms-auto shrink-0 text-[8px] opacity-80" dir="ltr">
                      {isCorrect ? 'CORRECT' : 'YOU'}
                    </span>
                  </div>
                );
              })}
            </div>
            <p
              className="ink-sm mt-4 border-t pt-4 text-xs font-bold leading-8 text-[var(--fg-muted)]"
              style={{ borderColor: 'var(--line)' }}
            >
              {copy.explanation}
            </p>
          </Panel>

          <div className="mt-5 space-y-2">
            <PixelButton size="lg" className="w-full" onClick={begin}>
              <span className="pixel text-xs">RETRY</span>
              <span className="ms-3">{s.retry}</span>
            </PixelButton>
            <PixelButton size="md" color="slate" className="w-full" onClick={() => setPhase('review')}>
              {s.reviewMode}
            </PixelButton>
            <div className="flex justify-center py-2">{MenuLink}</div>
          </div>
        </div>
      </Shell>
    );
  }

  /* ------------------------------------------------------------ شاشة الفوز */
  if (phase === 'won') {
    return (
      <Shell dim={0.5}>
        <div className="anim-in text-center">
          <p className="pixel title-px text-2xl sm:text-4xl" dir="ltr">
            YOU WIN!
          </p>
          <div className="mt-5 flex items-center justify-center">
            <Mascot gender={gender} kid={quiz.kids} mood="win" size={190} />
          </div>
          <h1 className="ink mt-4 text-3xl font-black text-[var(--gold-dark)]">{s.champion}</h1>
          <p className="ink-sm mx-auto mt-4 max-w-md text-xs font-bold leading-8 text-[var(--fg-muted)]">
            {s.winLine}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-start">
            <Stat label={s.yourScore} value={`${quiz.total} / ${quiz.total}`} />
            <Stat label={s.rank} value={quizCertificateTitle(quiz, quiz.total)[lang]} />
          </div>

          <Panel tone="dark" className="mt-5 p-6">
            <p className="ink text-lg font-black text-[var(--gold)]">{s.slogan}</p>
            <ul className="mt-3 space-y-1 text-xs font-bold leading-7" style={{ color: '#c6d8ee' }}>
              {s.closing.map((l) => (
                <li key={l} className="ink-sm">
                  {l}
                </li>
              ))}
            </ul>
            <p className="ink-sm mt-4 text-sm font-black text-[var(--green)]">{s.tagline}</p>
          </Panel>

          <div className="mt-5 space-y-2">
            <PixelButton size="lg" className="w-full" onClick={() => setPhase('review')}>
              {reviewMistakes.length > 0
                ? lang === 'ar'
                  ? 'مراجعة الأخطاء ثم مشاهدة الفيديو'
                  : lang === 'ur'
                    ? 'غلطیوں کا جائزہ لیں، پھر ویڈیو دیکھیں'
                    : 'Review mistakes, then watch the video'
                : lang === 'ar'
                  ? 'متابعة لمشاهدة الفيديو'
                  : lang === 'ur'
                    ? 'ویڈیو دیکھنے کے لیے جاری رکھیں'
                    : 'Continue to the video'}
            </PixelButton>
            <PixelButton size="md" color="blue" className="w-full" onClick={share} sound="select">
              {copied ? s.copied : `📣 ${s.shareResult}`}
            </PixelButton>
            <div className="flex justify-center py-2">{MenuLink}</div>
          </div>
        </div>
      </Shell>
    );
  }

  /* -------------------------------------------------- شاشة السؤال / الكشف */
  const revealed = phase === 'correct';

  const vignette =
    level.id === 6
      ? 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 44%, rgba(6,44,40,0.58) 100%)'
      : level.id === 5
      ? 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 46%, rgba(70,45,0,0.55) 100%)'
      : level.id === 4
        ? 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 50%, rgba(90,10,10,0.5) 100%)'
        : level.id === 3
          ? 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 55%, rgba(6,16,50,0.42) 100%)'
          : null;

  return (
    <Shell dim={0.68}>
      {vignette && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: -5, background: vignette }}
        />
      )}
      <div className="flex flex-1 flex-col">
        {/* HUD */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Hearts alive label={s.oneLife} />
            <Chip color={level.color}>{level[lang]}</Chip>
          </div>
          <div className="flex items-center gap-2">
            <span className="pixel ink-sm text-[10px] text-[var(--fg-muted)]">
              {String(q.n).padStart(2, '0')}/{quiz.total}
            </span>
            {MuteBtn}
            {MenuBtn}
          </div>
        </div>

        {/* شريط الوقت */}
        {timerOn && !revealed && <TimeBar left={left} total={TIME} />}

        {/* شريط التقدّم */}
        <div
          className="mt-2 flex gap-1 rounded-full p-1"
          style={{ border: '1px solid var(--line)', background: '#ffffff', boxShadow: 'var(--shadow-sm)' }}
        >
          {quiz.questions.map((item) => (
            <span
              key={item.n}
              className="h-2.5 flex-1 rounded-full"
              style={{
                background:
                  item.n < q.n ? quizLevelOf(quiz, item.n).color : item.n === q.n ? 'var(--ink)' : 'var(--night-2)',
              }}
            />
          ))}
        </div>

        {/* الشخصية + السلسلة */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <img
            src={playerIdleAvatar}
            alt={
              gender === 'female'
                ? lang === 'ar'
                  ? 'شخصية اللاعبة'
                  : lang === 'ur'
                    ? 'خاتون کھلاڑی'
                    : 'Female player character'
                : age === '12-17'
                  ? lang === 'ar'
                    ? 'شخصية اللاعب الطفل'
                    : lang === 'ur'
                      ? 'بچے کی شخصیت'
                      : 'Child player character'
                  : lang === 'ar'
                    ? 'شخصية اللاعب'
                    : lang === 'ur'
                      ? 'کھلاڑی کی شخصیت'
                      : 'Player character'
            }
            className="h-28 w-24 object-contain drop-shadow-md"
          />
          {streak >= 3 && (
            <span
              className="rounded-full px-3.5 py-1.5 text-xs font-black text-white"
              style={{ background: 'linear-gradient(160deg, #ff9540, #f2600c)', boxShadow: 'var(--shadow-sm)' }}
            >
              🔥 {s.streak} {streak}
            </span>
          )}
        </div>

        {!quiz.kids && q.n === 16 && (
          <Panel tone="red" className="anim-in mt-4 px-4 py-3 text-center">
            <span className="ink-sm text-xs font-black leading-7">{s.expertStage}</span>
          </Panel>
        )}
        {isExpertFinal && q.n === 21 && (
          <div
            className="anim-in mt-4 rounded-3xl px-4 py-3 text-center"
            style={{ background: 'linear-gradient(160deg, #134e4a, #0f766e)', boxShadow: 'var(--shadow)' }}
          >
            <span className="pixel block text-[10px] text-[#7dd3c8]" dir="ltr">
              ⚡ FINAL STAGE ⚡
            </span>
            <span className="mt-1 block text-base font-black text-white">
              {lang === 'ar' ? 'مستوى الخبير الرقمي' : lang === 'ur' ? 'ڈیجیٹل ایکسپرٹ درجہ' : 'Digital Expert Level'}
            </span>
            <span className="mt-1 block text-xs font-bold" style={{ color: '#b9e8e2' }}>
              {lang === 'ar' ? 'سؤالان يفصلانك عن اللقب!' : lang === 'ur' ? 'لقب تک صرف دو سوال باقی ہیں!' : 'Two questions between you and the title!'}
            </span>
          </div>
        )}
        {isGolden && (
          <Panel tone="gold" className="anim-in mt-4 px-4 py-3 text-center">
            <span className="pixel ink-sm block text-[9px]" dir="ltr">
              ★ GOLDEN QUESTION ★
            </span>
            <span className="ink-sm mt-2 block text-base font-black">{s.goldenQuestion}</span>
            <span className="ink-sm mt-1 block text-xs font-bold leading-6">{quiz.kids ? s.goldenHintKids : s.goldenHint}</span>
          </Panel>
        )}

        <Panel tone="dark" className="anim-in mt-3 p-5" key={q.n}>
          <h1 className="ink-sm text-base font-black leading-9 sm:text-lg sm:leading-10">
            {copy.text}
          </h1>
        </Panel>

        {wrongAttempt && !revealed && (
          <Panel tone="red" className="anim-in mt-3 p-4">
            <p className="ink-sm text-sm font-black leading-7">
              {lang === 'ar'
                ? 'الإجابة غير صحيحة.'
                : lang === 'ur'
                  ? 'یہ جواب درست نہیں ہے۔'
                  : 'That answer is not correct.'}
            </p>

            <p className="ink-sm mt-2 text-xs font-bold leading-7">
              {lang === 'ar'
                ? `ليش؟ ${copy.explanation}`
                : lang === 'ur'
                  ? `کیوں؟ ${copy.explanation}`
                  : `Why? ${copy.explanation}`}
            </p>

            <div
              className="mt-3 rounded-2xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(143,35,32,0.18)' }}
            >
              <p className="ink-sm text-xs font-black leading-7">
                {lang === 'ar'
                  ? '💡 تذكّر: توقف، تحقق، ثم تصرّف بأمان.'
                  : lang === 'ur'
                    ? '💡 یاد رکھیں: رکیں، تصدیق کریں، پھر محفوظ طریقے سے عمل کریں۔'
                    : '💡 Remember: Stop, verify, then act safely.'}
              </p>
            </div>

            <p className="ink-sm mt-3 text-sm font-black leading-7">
              {lang === 'ar'
                ? 'حاول مرة أخرى واختر الإجابة الصحيحة للمتابعة.'
                : lang === 'ur'
                  ? 'دوبارہ کوشش کریں اور آگے بڑھنے کے لیے درست جواب منتخب کریں۔'
                  : 'Try again and choose the correct answer to continue.'}
            </p>
          </Panel>
        )}

        <div className="mt-3 space-y-2">
          {ord.map((oi, di) => {
            const opt = copy.options[oi];
            const picked = selected === di;
            const correct = revealed && oi === q.correct;
            return (
              <button
                key={oi}
                disabled={revealed}
                data-testid="option"
                aria-pressed={picked}
                onClick={() => {
                  sfx.select();
                  setSelected(di);
                }}
                className="pxl flex w-full items-start gap-3 px-3.5 py-3.5 text-start text-sm font-bold leading-8 transition-transform active:scale-[0.99]"
                style={{
                  background: correct ? '#dff4e8' : picked ? '#e8f1ff' : '#ffffff',
                  border: `2px solid ${correct ? '#63c894' : picked ? '#79aef0' : 'var(--line)'}`,
                }}
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                  style={{
                    background: correct ? 'var(--green)' : picked ? 'var(--gold)' : 'var(--night-2)',
                    color: correct ? '#fff' : picked ? '#4a3300' : 'var(--fg-muted)',
                  }}
                >
                  {letters[di]}
                </span>
                <span className="ink-sm">{opt}</span>
              </button>
            );
          })}
        </div>

        {revealed ? (
          <div ref={revealRef} className="anim-in mt-auto pt-5">
            <Panel tone="green" className="relative p-5">
              <Burst />
              <p className="pixel ink-sm text-[10px]" dir="ltr">
                ✓ CORRECT
              </p>
              <p className="ink-sm mt-3 text-sm font-black leading-8">
                {s.correct} {q.n === quiz.total ? s.winLine : s.wellDone}
              </p>
              <p className="ink-sm mt-3 text-xs font-bold leading-8">{copy.explanation}</p>
            </Panel>
            <PixelButton size="lg" className="mt-3 w-full" onClick={next}>
              {q.n === quiz.total ? s.showResult : s.nextQuestion}
            </PixelButton>
          </div>
        ) : (
          <div
            className="sticky bottom-0 z-10 mt-auto pt-5"
            style={{ background: 'linear-gradient(180deg, rgba(240,248,255,0) 0%, rgba(240,248,255,0.94) 45%)', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <PixelButton
              size="lg"
              className="w-full"
              color={selected === null ? 'slate' : 'gold'}
              disabled={selected === null}
              onClick={confirm}
              sound="none"
            >
              {selected === null ? s.pick : s.confirm}
            </PixelButton>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------- مكوّنات صغيرة */

function OnbProgress({ step, className = '' }: { step: 1 | 2; className?: string }) {
  return (
    <div
      className={`h-4 overflow-hidden rounded-full ${className}`}
      style={{ background: '#e5e9ef', maxWidth: 420, marginInline: 'auto', width: '100%' }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={2}
      aria-valuenow={step}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${(step / 2) * 100}%`, background: '#58cc02' }}
      />
    </div>
  );
}

function dirArrow(lang: string) {
  return lang === 'en' ? '←' : '→';
}

function TimeBar({ left, total }: { left: number; total: number }) {
  const cells = 20;
  const filled = Math.ceil((left / total) * cells);
  const danger = left <= 6;
  return (
    <div className="mt-3 flex items-center gap-2 px-1">
      <span className="pixel text-[9px]" style={{ color: danger ? 'var(--red)' : 'var(--fg-muted)' }}>
        TIME
      </span>
      <div className="flex flex-1 gap-[2px]">
        {Array.from({ length: cells }, (_, i) => (
          <span
            key={i}
            className="h-2.5 flex-1 rounded-full"
            style={{
              background: i < filled ? (danger ? 'var(--red)' : 'var(--gold)') : 'var(--night-2)',
            }}
          />
        ))}
      </div>
      <span
        className="pixel tnum text-[10px]"
        style={{ color: danger ? 'var(--red)' : 'var(--fg-muted)' }}
      >
        {String(left).padStart(2, '0')}
      </span>
    </div>
  );
}

function Rule({ badge, children }: { badge: string; children: React.ReactNode }) {
  return (
    <Panel className="flex items-center gap-3 px-4 py-3">
      <span
        className="pixel flex h-8 w-11 shrink-0 items-center justify-center rounded-xl text-[9px]"
        style={{ background: '#ffe9b0', color: '#7a5200' }}
      >
        {badge}
      </span>
      <span className="ink-sm text-xs font-bold leading-7 text-[var(--fg-muted)]">{children}</span>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="px-4 py-3 text-start">
      <p className="ink-sm text-[10px] font-black text-[var(--fg-dim)]">{label}</p>
      <p className="tnum ink-sm mt-2 text-sm font-black">{value}</p>
    </Panel>
  );
}
