'use client';

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Panel, PixelButton } from '@/components/PixelUI';
import { usePrefs } from '@/lib/usePrefs';

export type ReviewMistake = {
  questionNumber: number;
  question: string;
  selectedAnswers: string[];
  correctAnswer: string;
  explanation: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: {
    results: { [index: number]: { [index: number]: { transcript: string } } };
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type Props = {
  mistakes: ReviewMistake[];
  lang: 'ar' | 'en' | 'ur';
  onComplete: () => void;
};

function navigationHint(currentIndex: number, total: number, lang: 'ar' | 'en' | 'ur'): string {
  const lastQuestion = currentIndex >= total - 1;

  if (lang === 'ar') {
    return lastQuestion
      ? 'اضغط الآن على زر «فهمت، إنهاء المراجعة».'
      : 'اضغط الآن على زر «فهمت، السؤال التالي».';
  }
  if (lang === 'ur') {
    return lastQuestion
      ? 'اگر آپ سمجھ گئے ہیں تو ”سمجھ گیا، جائزہ ختم کریں“ کا بٹن دبائیں۔'
      : 'اگر آپ سمجھ گئے ہیں تو ”سمجھ گیا، اگلا سوال“ کا بٹن دبائیں۔';
  }

  return lastQuestion
    ? 'If you understood the explanation, click “Understood, finish review”.'
    : 'If you understood the explanation, click “Understood, next question”.';
}

function initialReview(
  mistake: ReviewMistake | undefined,
  lang: 'ar' | 'en' | 'ur',
): ChatMessage[] {
  if (!mistake) return [];

  const learnerAnswer =
    mistake.selectedAnswers.filter(Boolean).join('، ') ||
    (lang === 'ar'
      ? 'انتهى الوقت دون إجابة'
      : lang === 'ur'
        ? 'وقت ختم ہو گیا اور جواب نہیں دیا گیا'
        : 'Time expired without an answer');

  if (lang === 'ur') {
    return [{
      role: 'assistant',
      content:
        'سوال: ' + mistake.question +
        '\n\nآپ کا جواب: ' + learnerAnswer +
        '\n\nدرست جواب: ' + mistake.correctAnswer +
        '\n\nمختصر وضاحت: ' + mistake.explanation +
        '\n\nایک مختصر سوال: اگر یہ صورتحال دوبارہ پیش آئے تو آپ کیا کریں گے؟',
    }];
  }

  const content =
    lang === 'ar'
      ? `السؤال: ${mistake.question}\n\nإجابتك: ${learnerAnswer}\n\nالإجابة الصحيحة: ${mistake.correctAnswer}\n\nشرح مختصر: ${mistake.explanation}\n\nسؤال سريع: ماذا ستفعل إذا تكرر موقف مشابه؟`
      : `Question: ${mistake.question}\n\nYour answer: ${learnerAnswer}\n\nCorrect answer: ${mistake.correctAnswer}\n\nShort explanation: ${mistake.explanation}\n\nQuick check: What would you do if a similar situation happened again?`;

  return [{ role: 'assistant', content }];
}

function reviewProgress(current: number, total: number, lang: 'ar' | 'en' | 'ur') {
  if (lang === 'ar') return 'مراجعة السؤال ' + current + ' من ' + total;
  if (lang === 'ur') return 'سوال ' + current + ' از ' + total + ' کا جائزہ';
  return 'Reviewing question ' + current + ' of ' + total;
}

function speechLabel(
  key: 'enable' | 'listen' | 'stop' | 'preparing' | 'speaking' | 'unavailable',
  lang: 'ar' | 'en' | 'ur',
) {
  const labels = {
    ar: {
      enable: 'تشغيل الصوت',
      listen: 'استمع مرة ثانية',
      stop: 'إيقاف الصوت',
      preparing: 'جارٍ تجهيز الصوت…',
      speaking: 'جارٍ تشغيل الشرح…',
      unavailable: 'تعذر تشغيل الصوت. اضغط «استمع مرة ثانية»، وتأكد أن تبويب المتصفح غير مكتوم.',
    },
    en: {
      enable: 'Enable voice',
      listen: 'Listen again',
      stop: 'Stop voice',
      preparing: 'Preparing voice…',
      speaking: 'Playing explanation…',
      unavailable: 'Voice could not play. Click “Listen again” and make sure the browser tab is not muted.',
    },
    ur: {
      enable: 'آواز چلائیں',
      listen: 'دوبارہ سنیں',
      stop: 'آواز بند کریں',
      preparing: 'آواز تیار ہو رہی ہے…',
      speaking: 'وضاحت چل رہی ہے…',
      unavailable: 'آواز نہیں چل سکی۔ ”دوبارہ سنیں“ دبائیں اور براؤزر ٹیب کا میوٹ چیک کریں۔',
    },
  };
  return labels[lang][key];
}

function microphoneLabel(
  key: 'answer' | 'listening' | 'unavailable' | 'notHeard',
  lang: 'ar' | 'en' | 'ur',
) {
  const labels = {
    ar: {
      answer: 'أجب بالصوت',
      listening: 'تكلم الآن…',
      unavailable: 'الميكروفون غير متاح. استخدم Chrome واسمح للموقع باستخدام الميكروفون.',
      notHeard: 'لم أسمع الإجابة بوضوح. اضغط الميكروفون وحاول مرة ثانية.',
    },
    en: {
      answer: 'Answer by voice',
      listening: 'Speak now…',
      unavailable: 'The microphone is unavailable. Use Chrome and allow microphone access.',
      notHeard: 'I could not hear the answer clearly. Tap the microphone and try again.',
    },
    ur: {
      answer: 'آواز سے جواب دیں',
      listening: 'اب بولیں…',
      unavailable: 'مائیکروفون دستیاب نہیں۔ Chrome استعمال کریں اور مائیکروفون کی اجازت دیں۔',
      notHeard: 'جواب واضح سنائی نہیں دیا۔ مائیکروفون دبا کر دوبارہ کوشش کریں۔',
    },
  };
  return labels[lang][key];
}

function recognitionLanguage(lang: 'ar' | 'en' | 'ur') {
  if (lang === 'ar') return 'ar-AE';
  if (lang === 'ur') return 'ur-PK';
  return 'en-US';
}

export default function AiReviewChat({ mistakes, lang, onComplete }: Props) {
  const { gender, age } = usePrefs();
  const voicePersona =
    gender === 'female' ? 'female' : age === '12-17' ? 'child' : 'male';
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialReview(mistakes[0], lang),
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [canAdvance, setCanAdvance] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speechLoading, setSpeechLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [voiceInputSupported, setVoiceInputSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceInputError, setVoiceInputError] = useState('');
  const completionNotified = useRef(false);
  const lastSpokenText = useRef('');
  const speechRun = useRef(0);
  const speechRequest = useRef<AbortController | null>(null);
  const activeAudio = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrl = useRef<string | null>(null);
  const audioCache = useRef(new Map<string, Blob>());
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const currentMistake = mistakes[currentIndex];

  const releaseActiveAudio = useCallback(() => {
    const audio = activeAudio.current;
    if (audio) {
      audio.onplaying = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      activeAudio.current = null;
    }
    if (activeAudioUrl.current) {
      URL.revokeObjectURL(activeAudioUrl.current);
      activeAudioUrl.current = null;
    }
  }, []);

  const stopSpeech = useCallback(() => {
    speechRun.current += 1;
    speechRequest.current?.abort();
    speechRequest.current = null;
    releaseActiveAudio();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setSpeechLoading(false);
    setSpeaking(false);
  }, [releaseActiveAudio]);

  const speakText = useCallback(async (text: string, enableVoice = false) => {
    const transcript = text.trim();
    if (!transcript) return;
    if (enableVoice) setSpeechEnabled(true);

    stopSpeech();
    setSpeechError('');

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechError(speechLabel('unavailable', lang));
      return;
    }

    const synth = window.speechSynthesis;
    const run = ++speechRun.current;

    const utterance = new SpeechSynthesisUtterance(transcript);
    utteranceRef.current = utterance;

    utterance.lang =
      lang === 'ar' ? 'ar-AE' : lang === 'ur' ? 'ur-PK' : 'en-US';

    // Pick the closest installed voice for the selected language/persona.
    const pickVoice = () => {
      const voices = synth.getVoices();
      const languagePrefix = lang === 'ar' ? 'ar' : lang === 'ur' ? 'ur' : 'en';
      const languageVoices = voices.filter((voice) =>
        voice.lang?.toLowerCase().startsWith(languagePrefix),
      );

      const femaleHints = ['female', 'zira', 'susan', 'samantha', 'hazel', 'heera'];
      const maleHints = ['male', 'david', 'mark', 'daniel', 'george'];
      const hints = voicePersona === 'female' ? femaleHints : voicePersona === 'male' ? maleHints : [];

      const hinted = languageVoices.find((voice) =>
        hints.some((hint) => voice.name.toLowerCase().includes(hint)),
      );

      return hinted ?? languageVoices[0] ?? voices.find((voice) =>
        voice.lang?.toLowerCase().startsWith(languagePrefix),
      ) ?? null;
    };

    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    // Device voices do not expose an actual "child" voice reliably,
    // so use gentle pitch/rate tuning for the chosen player persona.
    if (voicePersona === 'child') {
      utterance.pitch = 1.25;
      utterance.rate = 0.92;
    } else if (voicePersona === 'female') {
      utterance.pitch = 1.08;
      utterance.rate = 0.94;
    } else {
      utterance.pitch = 0.92;
      utterance.rate = 0.93;
    }

    utterance.volume = 1;

    utterance.onstart = () => {
      if (speechRun.current !== run) return;
      setSpeechLoading(false);
      setSpeaking(true);
    };

    utterance.onend = () => {
      if (speechRun.current !== run) return;
      utteranceRef.current = null;
      setSpeechLoading(false);
      setSpeaking(false);
    };

    utterance.onerror = () => {
      if (speechRun.current !== run) return;
      utteranceRef.current = null;
      setSpeechLoading(false);
      setSpeaking(false);
      setSpeechError(speechLabel('unavailable', lang));
    };

    setSpeechLoading(true);

    // Chrome may return the voice list a moment late.
    // Starting shortly after the click is much more reliable.
    window.setTimeout(() => {
      if (speechRun.current !== run) return;
      try {
        synth.cancel();
        synth.speak(utterance);
        // If onstart does not fire quickly, don't leave the UI stuck on "preparing".
        window.setTimeout(() => {
          if (speechRun.current === run && !synth.speaking) {
            setSpeechLoading(false);
          }
        }, 1200);
      } catch {
        setSpeechLoading(false);
        setSpeaking(false);
        setSpeechError(speechLabel('unavailable', lang));
      }
    }, 80);
  }, [lang, stopSpeech, voicePersona]);

  const requestReply = useCallback(async (history: ChatMessage[]) => {
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mistakes: currentMistake ? [currentMistake] : [],
          messages: history,
          lang,
          hasMore: currentIndex < mistakes.length - 1,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok || typeof data.reply !== 'string') {
        throw new Error(data.error || 'AI review failed');
      }

      // نمنع الدوران: بعد محاولتين نعرض التصحيح ونسمح بالانتقال.
      const answerAttempts = history.filter((message) => message.role === 'user').length;
      const understood = data.understood === true || answerAttempts >= 2;
      setCanAdvance(understood);

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            understood && data.understood !== true
              ? `${
                  lang === 'ar'
                    ? `التصرف الصحيح هو: ${currentMistake?.correctAnswer ?? ''}`
                    : lang === 'ur'
                      ? `درست عمل یہ ہے: ${currentMistake?.correctAnswer ?? ''}`
                      : `The correct action is: ${currentMistake?.correctAnswer ?? ''}`
                }\n\n${navigationHint(currentIndex, mistakes.length, lang)}`
              : understood
                ? `${data.reply}\n\n${navigationHint(currentIndex, mistakes.length, lang)}`
                : data.reply,
        },
      ]);
    } catch {
      // تعطل الخدمة لا يمنع الطفل من إكمال المراجعة.
      setCanAdvance(true);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            lang === 'ar'
              ? `الإجابة الصحيحة موضحة فوق: ${currentMistake?.correctAnswer ?? ''}\n\n${navigationHint(currentIndex, mistakes.length, lang)}`
              : lang === 'ur'
                ? `درست جواب اوپر موجود ہے: ${currentMistake?.correctAnswer ?? ''}\n\n${navigationHint(currentIndex, mistakes.length, lang)}`
                : `The correct answer is shown above: ${currentMistake?.correctAnswer ?? ''}\n\n${navigationHint(currentIndex, mistakes.length, lang)}`,
        },
      ]);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, [currentIndex, currentMistake, lang, mistakes.length]);

  const submitAnswer = useCallback(async (rawContent: string) => {
    const content = rawContent.trim();
    if (!content || loading || canAdvance) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setCanAdvance(false);
    setVoiceInputError('');
    setMessages(nextMessages);
    setInput('');
    await requestReply(nextMessages);
  }, [canAdvance, loading, messages, requestReply]);

  const startVoiceAnswer = useCallback(() => {
    if (loading || canAdvance) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setVoiceInputError(microphoneLabel('unavailable', lang));
      return;
    }

    stopSpeech();
    setVoiceInputError('');

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = recognitionLanguage(lang);
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let receivedAnswer = false;
    let recognitionFailed = false;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? '';
      if (!transcript) return;

      receivedAnswer = true;
      setListening(false);
      setInput(transcript);
      void submitAnswer(transcript);
    };
    recognition.onerror = (event) => {
      recognitionFailed = true;
      setListening(false);
      if (event.error !== 'aborted') {
        setVoiceInputError(
          event.error === 'no-speech'
            ? microphoneLabel('notHeard', lang)
            : microphoneLabel('unavailable', lang),
        );
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setListening(false);
      if (!receivedAnswer && !recognitionFailed) {
        setVoiceInputError(microphoneLabel('notHeard', lang));
      }
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setVoiceInputError(microphoneLabel('unavailable', lang));
    }
  }, [canAdvance, lang, listening, loading, stopSpeech, submitAnswer]);

  useEffect(() => {
    if (mistakes.length === 0 && !completionNotified.current) {
      completionNotified.current = true;
      onComplete();
    }
  }, [mistakes.length, onComplete]);

  useEffect(() => {
    const speechWindow = window as Window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };
    setVoiceInputSupported(
      Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition),
    );

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => () => {
    speechRun.current += 1;
    speechRequest.current?.abort();
    speechRequest.current = null;
    releaseActiveAudio();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, [releaseActiveAudio]);

  useEffect(() => {
    // Browsers require one deliberate click before reliable audio playback.
    if (loading || !speechEnabled) return;
    const latestMessage = messages[messages.length - 1];
    if (
      latestMessage?.role !== 'assistant' ||
      latestMessage.content === lastSpokenText.current
    ) return;

    lastSpokenText.current = latestMessage.content;
    const timer = window.setTimeout(() => void speakText(latestMessage.content), 200);
    return () => window.clearTimeout(timer);
  }, [loading, messages, speakText, speechEnabled]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    await submitAnswer(input);
  }

  function advanceReview() {
    if (loading) return;

    stopSpeech();

    if (currentIndex >= mistakes.length - 1) {
      setCompleted(true);
      onComplete();
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    lastSpokenText.current = '';
    setMessages(initialReview(mistakes[nextIndex], lang));
    setCanAdvance(false);
    setInput('');
  }

  if (mistakes.length === 0) {
    return (
      <Panel tone="green" className="mt-5 p-6 text-center">
        <p className="text-5xl" aria-hidden>🏆</p>
        <h2 className="ink mt-4 text-2xl font-black">
          {lang === 'ar' ? 'أداء ممتاز!' : lang === 'ur' ? 'بہترین کارکردگی!' : 'Outstanding performance!'}
        </h2>
        <p className="ink-sm mt-3 text-sm font-bold leading-8">
          {lang === 'ar'
            ? 'أجبت عن جميع الأسئلة من أول محاولة. أحسنت، واستمر في تطبيق ممارسات الأمن الرقمي.'
            : lang === 'ur'
              ? 'آپ نے سب سوالات کا پہلی کوشش میں درست جواب دیا۔ محفوظ ڈیجیٹل عادات جاری رکھیں۔'
              : 'You answered every question correctly on the first attempt. Well done—keep practising safe digital habits.'}
        </p>
      </Panel>
    );
  }

  if (completed) {
    return (
      <Panel tone="green" className="mt-5 p-6 text-center">
        <p className="text-5xl" aria-hidden>✅</p>
        <h2 className="ink mt-4 text-2xl font-black">
          {lang === 'ar' ? 'اكتملت مراجعة الأخطاء' : lang === 'ur' ? 'غلطیوں کا جائزہ مکمل' : 'Mistake review complete'}
        </h2>
        <p className="ink-sm mt-3 text-sm font-bold leading-8">
          {lang === 'ar'
            ? 'راجعت جميع الأسئلة التي أخطأت فيها. يمكنك الآن استلام شهادتك.'
            : lang === 'ur'
              ? 'آپ نے تمام غلط سوالات کا جائزہ لے لیا۔ اب آپ اپنا سرٹیفکیٹ حاصل کر سکتے ہیں۔'
              : 'You reviewed every question you missed. You can now receive your certificate.'}
        </p>
      </Panel>
    );
  }

  return (
    <div className="mt-5">
      <Panel tone="gold" className="p-4 text-center">
        <p className="ink-sm text-sm font-black">
          {reviewProgress(currentIndex + 1, mistakes.length, lang)}
        </p>
      </Panel>

      <Panel className="mt-3 max-h-[55dvh] space-y-3 overflow-y-auto p-4" tone="panel">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="ink-sm max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm font-bold leading-7"
              style={{
                background: message.role === 'user' ? '#e8f1ff' : '#e6f7ee',
                color: message.role === 'user' ? '#153e75' : '#135f3c',
                border: `1px solid ${message.role === 'user' ? '#bfd5f5' : '#bfe8d2'}`,
              }}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <p className="ink-sm text-xs font-black text-[var(--fg-muted)]">
            {lang === 'ar' ? 'لحظة، جارٍ التحقق…' : lang === 'ur' ? 'ایک لمحہ، جواب چیک ہو رہا ہے…' : 'One moment, checking your answer…'}
          </p>
        )}
        <div ref={endRef} />
      </Panel>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2" aria-live="polite">
          <button
            type="button"
            disabled={speechLoading}
            onClick={() => {
              const latestAssistantMessage = [...messages]
                .reverse()
                .find((message) => message.role === 'assistant');
              if (latestAssistantMessage) {
                lastSpokenText.current = latestAssistantMessage.content;
                void speakText(latestAssistantMessage.content, true);
              }
            }}
            className="rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-2 text-sm font-black disabled:opacity-50"
          >
            🔊 {speechLabel(speechLoading ? 'preparing' : speechEnabled ? 'listen' : 'enable', lang)}
          </button>
          <button
            type="button"
            onClick={stopSpeech}
            disabled={!speaking && !speechLoading}
            className="rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-2 text-sm font-black disabled:opacity-40"
          >
            ⏹ {speechLabel('stop', lang)}
          </button>
          {speechLoading && (
            <span className="ink-sm text-xs font-black text-[var(--fg-muted)]">
              {speechLabel('preparing', lang)}
            </span>
          )}
          {speaking && (
            <span className="ink-sm text-xs font-black text-[var(--fg-muted)]">
              {speechLabel('speaking', lang)}
            </span>
          )}
      </div>

      {speechError && (
        <p className="ink-sm mt-2 text-center text-xs font-black text-red-700" role="alert">
          {speechError}
        </p>
      )}

      {!canAdvance && (
        <form onSubmit={sendMessage} className="mt-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              disabled={loading || listening}
              placeholder={lang === 'ar' ? 'اكتب التصرف الصحيح باختصار…' : lang === 'ur' ? 'درست عمل مختصر لکھیں…' : 'Briefly type the correct action…'}
              aria-label={lang === 'ar' ? 'إجابتك' : lang === 'ur' ? 'آپ کا جواب' : 'Your answer'}
              className="ink-sm min-w-0 flex-1 rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--blue)]"
              dir={lang === 'en' ? 'ltr' : 'rtl'}
            />
            <PixelButton type="submit" size="md" color="blue" disabled={loading || listening || !input.trim()}>
              {lang === 'ar' ? 'إرسال' : lang === 'ur' ? 'بھیجیں' : 'Send'}
            </PixelButton>
          </div>

          {voiceInputSupported && (
            <button
              type="button"
              onClick={startVoiceAnswer}
              disabled={loading}
              aria-pressed={listening}
              className={`mt-2 w-full rounded-2xl border-2 px-4 py-3 text-sm font-black disabled:opacity-50 ${
                listening
                  ? 'border-red-400 bg-red-50 text-red-800'
                  : 'border-[var(--line)] bg-white text-[var(--fg)]'
              }`}
            >
              {listening ? '⏹ ' : '🎤 '}
              {microphoneLabel(listening ? 'listening' : 'answer', lang)}
            </button>
          )}

          {voiceInputError && (
            <p className="ink-sm mt-2 text-center text-xs font-black text-red-700" role="alert">
              {voiceInputError}
            </p>
          )}
        </form>
      )}

      {canAdvance && !loading && (
        <PixelButton size="lg" color="green" className="mt-3 w-full" onClick={advanceReview}>
          {lang === 'ar'
            ? currentIndex === mistakes.length - 1
              ? 'فهمت، إنهاء المراجعة'
              : 'فهمت، السؤال التالي'
            : lang === 'ur'
              ? currentIndex === mistakes.length - 1
                ? 'سمجھ گیا، جائزہ ختم کریں'
                : 'سمجھ گیا، اگلا سوال'
              : currentIndex === mistakes.length - 1
                ? 'Understood, finish review'
                : 'Understood, next question'}
        </PixelButton>
      )}
    </div>
  );
}
