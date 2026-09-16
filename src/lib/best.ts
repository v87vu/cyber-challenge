/* أفضل نتيجة محليّة — سجلان منفصلان لنسخة الكبار ونسخة الأطفال */

type BestPair = { adult: number; kids: number };

const KEYS = { adult: 'dac-best', kids: 'dac-best-kids' } as const;
let best: BestPair = { adult: 0, kids: 0 };

if (typeof window !== 'undefined') {
  try {
    best = {
      adult: Number(localStorage.getItem(KEYS.adult) || 0) || 0,
      kids: Number(localStorage.getItem(KEYS.kids) || 0) || 0,
    };
  } catch {}
}

const SERVER: BestPair = { adult: 0, kids: 0 };
const listeners = new Set<() => void>();

export function subscribeBest(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function bestSnapshot(): BestPair {
  return best;
}

export function bestServerSnapshot(): BestPair {
  return SERVER;
}

/** يسجّل نتيجة جولة ويعيد true إذا كانت رقماً قياسياً جديداً */
export function recordScore(score: number, kids: boolean) {
  const key = kids ? 'kids' : 'adult';
  if (score <= best[key]) return false;
  best = { ...best, [key]: score };
  try {
    localStorage.setItem(KEYS[key], String(score));
  } catch {}
  listeners.forEach((l) => l());
  return true;
}
