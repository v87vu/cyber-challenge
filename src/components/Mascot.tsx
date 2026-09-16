'use client';

import { useEffect } from 'react';
import type { Gender } from '@/lib/prefs';

/* شخصيتا اللعبة — رسوم توضيحية مولّدة (ذكر بكندورة وغترة، وأنثى بعباية وشيلة)
   الملفات في public/art — ستة أوضاع لكل شخصية */

export type Mood = 'idle' | 'think' | 'happy' | 'ko' | 'win';

const LABEL: Record<Mood, string> = {
  idle: 'الشخصية في وضع الاستعداد',
  think: 'الشخصية تفكّر',
  happy: 'الشخصية سعيدة',
  ko: 'الشخصية حزينة',
  win: 'الشخصية تحتفل بالكأس',
};

const MOODS = ['idle', 'think', 'happy', 'ko', 'win', 'sweat'] as const;
const preloaded = new Set<string>();

export default function Mascot({
  mood = 'idle',
  gender = 'male',
  size = 72,
  className = '',
  sweat = false,
  kid = false,
}: {
  mood?: Mood;
  gender?: Gender | null;
  size?: number;
  className?: string;
  sweat?: boolean;
  kid?: boolean;
}) {
  const g = (gender === 'female' ? 'f' : 'm') + (kid ? 'k' : '');
  const file = sweat && (mood === 'think' || mood === 'idle') ? 'sweat' : mood;
  const anim = mood === 'ko' ? 'shake' : 'bob';

  // حمّل أوضاع الشخصية مسبقاً حتى لا يرتجف التبديل بين الحالات
  useEffect(() => {
    if (preloaded.has(g)) return;
    preloaded.add(g);
    for (const m of MOODS) {
      const img = new Image();
      img.src = `/art/${g}-${m}.png`;
    }
  }, [g]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/art/${g}-${file}.png`}
      alt={LABEL[mood]}
      className={`${anim} ${className} select-none`}
      style={{
        height: size,
        width: 'auto',
        filter: 'drop-shadow(0 10px 14px rgba(30, 50, 80, 0.28))',
      }}
      draggable={false}
    />
  );
}
