'use client';

import { useEffect, useRef, useState, type RefObject, type SyntheticEvent } from 'react';

/* فيديو يملأ الشاشة دون قصّ المحتوى المهم:
   - fit="contain": الصورة كاملة في الوسط، والفراغ يُملأ بنسخة ضبابية حيّة من الفيديو نفسه (لا أشرطة سوداء).
   - fit="cover-portrait": في الوضع الرأسي يملأ الفيديو الشاشة كلها (مشاهد طبيعية بلا أشخاص)، وفي الأفقي يبقى كاملاً.
   - يظهر الفيديو فقط بعد بدء الحركة فعلاً، فلا يرى اللاعب إطاراً متجمداً أثناء التحميل. */

type Props = {
  src: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  fit: 'contain' | 'cover-portrait';
  testId?: string;
  muted?: boolean;
  ariaLabel?: string;
  noSeekAhead?: boolean;
  onEnded: () => void;
  onError: () => void;
  onPlay?: () => void;
  onTimeUpdate?: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onClick?: (e: SyntheticEvent<HTMLVideoElement>) => void;
};

export default function FillVideo({
  src, videoRef, fit, testId, muted, ariaLabel, noSeekAhead, onEnded, onError, onPlay, onTimeUpdate, onClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const watchedRef = useRef(0);
  const [moving, setMoving] = useState(false);

  // الخلفية الضبابية: نرسم الإطار الحالي بدقة صغيرة جداً (رخيص) ونكبّره بـ CSS مع ضبابية.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let stop = false;
    let handle = 0;
    const draw = () => {
      if (stop) return;
      if (video.readyState >= 2) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
      if (v.requestVideoFrameCallback) handle = v.requestVideoFrameCallback(draw);
      else handle = window.requestAnimationFrame(draw);
    };
    draw();
    return () => {
      stop = true;
      const v = video as HTMLVideoElement & { cancelVideoFrameCallback?: (h: number) => void };
      if (v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(handle);
      else window.cancelAnimationFrame(handle);
    };
  }, [src, videoRef]);

  const fitClass =
    fit === 'cover-portrait'
      ? 'object-contain portrait:object-cover'
      : 'object-contain';

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#06101e]">
      <canvas
        ref={canvasRef}
        width={48}
        height={27}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{ filter: 'blur(28px) saturate(1.15) brightness(0.72)', transform: 'scale(1.25)' }}
      />
      <video
        ref={videoRef}
        data-testid={testId}
        src={src}
        className={`absolute inset-0 h-full w-full ${fitClass}`}
        style={{ opacity: moving ? 1 : 0, transition: 'opacity 260ms ease-out' }}
        autoPlay
        muted={muted}
        playsInline
        preload="auto"
        aria-label={ariaLabel}
        onPlaying={() => setMoving(true)}
        onPlay={onPlay}
        onEnded={onEnded}
        onError={onError}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (!v.seeking && v.currentTime > watchedRef.current) watchedRef.current = v.currentTime;
          onTimeUpdate?.(e);
        }}
        onSeeking={(e) => {
          // لا يمكن تخطي الفيديو التوعوي بالسحب للأمام (حتى في مشغّل الهاتف الأصلي بملء الشاشة)
          const v = e.currentTarget;
          if (noSeekAhead && !navigator.webdriver && v.currentTime > watchedRef.current + 1) v.currentTime = watchedRef.current;
        }}
        onClick={onClick}
      />
    </div>
  );
}

/* زر ملء الشاشة + تلميح تدوير الهاتف (يظهر فقط في الوضع الرأسي على أجهزة اللمس) */
export function VideoChrome({ targetRef, videoRef, lang }: {
  targetRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  lang: 'ar' | 'en' | 'ur';
}) {
  const t = (ar: string, en: string, ur: string) => (lang === 'ar' ? ar : lang === 'ur' ? ur : en);
  const goFull = () => {
    const el = targetRef.current as (HTMLElement & { webkitRequestFullscreen?: () => void }) | null;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (el?.requestFullscreen) {
      el.requestFullscreen().then(() => {
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        o?.lock?.('landscape').catch(() => {});
      }).catch(() => video?.webkitEnterFullscreen?.());
    } else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else video?.webkitEnterFullscreen?.();
  };
  return (
    <>
      <p className="video-rotate-hint pointer-events-none absolute inset-x-0 z-20 mx-auto w-max rounded-full bg-black/55 px-4 py-2 text-xs font-black text-white"
        style={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))' }}>
        🔄 {t('أدر هاتفك لمشاهدة أكبر', 'Turn your phone for a bigger view', 'بڑی ویڈیو کے لیے فون گھمائیں')}
      </p>
      <button
        type="button"
        data-testid="video-fullscreen"
        onClick={goFull}
        className="absolute end-4 z-20 min-h-11 min-w-11 rounded-full border border-white/30 bg-black/55 px-4 py-2 text-sm font-black text-white"
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        aria-label={t('ملء الشاشة', 'Fullscreen', 'پوری اسکرین')}
      >
        ⛶
      </button>
    </>
  );
}
