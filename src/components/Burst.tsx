'use client';

/* انفجار نجوم بكسل عند الإجابة الصحيحة */

const BITS = [
  { dx: -120, dy: -90, c: '#f5b301', s: 8, d: 0 },
  { dx: 110, dy: -110, c: '#ffffff', s: 6, d: 40 },
  { dx: -70, dy: -140, c: '#2fa96a', s: 7, d: 20 },
  { dx: 140, dy: -50, c: '#f5b301', s: 5, d: 70 },
  { dx: -150, dy: -30, c: '#7aa2ff', s: 6, d: 50 },
  { dx: 60, dy: -160, c: '#f5b301', s: 8, d: 10 },
  { dx: -30, dy: -170, c: '#ffffff', s: 5, d: 90 },
  { dx: 90, dy: -130, c: '#2fa96a', s: 7, d: 60 },
];

export default function Burst() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {BITS.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '50%',
            width: b.s + 2,
            height: b.s + 2,
            background: b.c,
            animation: `burst 0.7s steps(7) ${b.d}ms both`,
            ['--bx' as string]: `${b.dx}px`,
            ['--by' as string]: `${b.dy}px`,
          }}
        />
      ))}
    </div>
  );
}
