'use client';

import { useEffect, useState } from 'react';

/* زر القراءة بصوت عالٍ — للأطفال، بطلب اللاعب فقط (لا تشغيل تلقائي)
   يقرأ النص حرفياً، ويختفي إن لم يتوفر صوت مناسب للغة على الجهاز */

function pickVoice(lang: 'ar' | 'en') {
  try {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    return voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
  } catch {
    return null;
  }
}

export default function ReadAloud({ text, lang, active = true }: { text: string; lang: 'ar' | 'en'; active?: boolean }) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const update = () => setVoice(pickVoice(lang));
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update);
      window.speechSynthesis.cancel();
    };
  }, [lang]);

  // أوقف القراءة عند تغيّر السؤال أو بعد تأكيد الإجابة
  useEffect(() => {
    if (!active) {
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    }
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    };
  }, [text, active]);

  if (!voice || !active) return null;

  const toggle = () => {
    try {
      const synth = window.speechSynthesis;
      if (speaking) {
        synth.cancel();
        setSpeaking(false);
        return;
      }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.92;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(u);
    } catch {
      setSpeaking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      aria-label={lang === 'ar' ? 'اقرأ السؤال بصوت عالٍ' : 'Read the question aloud'}
      className="pxl-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black"
      style={{ background: speaking ? 'var(--gold)' : '#ffffff', color: 'var(--ink)' }}
    >
      <span aria-hidden>{speaking ? '⏹' : '🔊'}</span>
      {lang === 'ar' ? (speaking ? 'إيقاف' : 'اسمع السؤال') : speaking ? 'Stop' : 'Listen'}
    </button>
  );
}
