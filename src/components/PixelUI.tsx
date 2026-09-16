'use client';

import { sfx } from '@/lib/sfx';

/* عدة الواجهة الحديثة — الأسماء القديمة محفوظة حتى لا تتغير الصفحات */

const TONES = {
  panel: { bg: '#ffffff', color: undefined as string | undefined, border: 'var(--line)' },
  dark: { bg: 'linear-gradient(160deg, #17385c, #0f2947)', color: '#f2f7ff', border: '#17385c' },
  green: { bg: '#e6f7ee', color: '#135f3c', border: '#bfe8d2' },
  red: { bg: '#fdecec', color: '#8f2320', border: '#f5c9c7' },
  gold: { bg: '#fff5da', color: '#7a5200', border: '#f3ddaa' },
};

export function Panel({
  children,
  className = '',
  tone = 'panel',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: keyof typeof TONES;
  style?: React.CSSProperties;
}) {
  const t = TONES[tone];
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const BTN = {
  gold: { bg: 'linear-gradient(160deg, #ffcf3f, #f0a500)', color: '#4a3300' },
  blue: { bg: 'linear-gradient(160deg, #4ba3f5, #1f6fd0)', color: '#ffffff' },
  green: { bg: 'linear-gradient(160deg, #46c07f, #1c8d55)', color: '#ffffff' },
  red: { bg: 'linear-gradient(160deg, #f2685f, #d3372f)', color: '#ffffff' },
  slate: { bg: 'linear-gradient(160deg, #ffffff, #eef4fa)', color: 'var(--fg)' },
};

export function PixelButton({
  children,
  onClick,
  disabled,
  color = 'gold',
  size = 'md',
  className = '',
  sound = 'confirm',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: keyof typeof BTN;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  sound?: 'confirm' | 'select' | 'none';
}) {
  const pad = { sm: 'px-4 py-2.5 text-sm', md: 'px-5 py-3 text-[15px]', lg: 'px-6 py-4 text-lg' }[size];
  const v = BTN[color];
  return (
    <button
      type="button"
      onClick={() => {
        if (sound !== 'none') sfx[sound]();
        onClick?.();
      }}
      disabled={disabled}
      className={`pxl-btn font-black ${pad} ${className}`}
      style={{
        background: v.bg,
        color: v.color,
        border: color === 'slate' ? '1px solid var(--line)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

export function Hearts({ alive, label }: { alive: boolean; label: string }) {
  return (
    <span
      className="inline-grid h-10 w-10 place-items-center rounded-full"
      style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}
      aria-label={label}
    >
      <svg width="20" height="18" viewBox="0 0 24 22" aria-hidden>
        <path
          d="M12 20 C5 14 1.5 10.2 1.5 6.6 C1.5 3.6 3.9 1.5 6.7 1.5 C8.8 1.5 10.8 2.8 12 4.8 C13.2 2.8 15.2 1.5 17.3 1.5 C20.1 1.5 22.5 3.6 22.5 6.6 C22.5 10.2 19 14 12 20 Z"
          fill={alive ? '#e5484d' : '#cdd8e2'}
        />
      </svg>
    </span>
  );
}

export function Chip({
  children,
  color = '#4ba3f5',
  className = '',
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black text-white ${className}`}
      style={{ background: color, boxShadow: 'var(--shadow-sm)' }}
    >
      {children}
    </span>
  );
}
