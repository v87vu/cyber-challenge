import type { Lang } from '@/lib/questions';

export default function AnswerFeedback({ result, lang }: { result: 'correct' | 'wrong'; lang: Lang }) {
  return (
    <div className={`scene-feedback scene-feedback--${result}`} role="status">
      {result === 'correct' ? (
        <svg className="scene-shield" width="64" height="72" viewBox="0 0 64 72" aria-label={lang === 'ar' ? 'حماية ناجحة' : lang === 'ur' ? 'کامیاب حفاظت' : 'Protected'} role="img">
          <path d="M32 4 58 14v21c0 16-14 27-26 33C20 62 6 51 6 35V14Z" fill="#e6f7ee" stroke="#1c7d4d" strokeWidth="3" />
          <path d="m20 34 9 9 17-19" fill="none" stroke="#1c7d4d" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span className="scene-trap">{lang === 'ar' ? '⚠ وقعت في الفخ' : lang === 'ur' ? '⚠ دھوکے میں آ گئے' : '⚠ Caught in the trap'}</span>
      )}
    </div>
  );
}
