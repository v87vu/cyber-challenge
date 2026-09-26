/* خريطة الإتقان محلياً — قائمتان منفصلتان لنسخة الكبار ونسخة الأطفال */

export type Mastery = { adult: number[]; kids: number[] };

const KEYS = { adult: 'dac-mastery', kids: 'dac-mastery-kids' } as const;
const SERVER: Mastery = { adult: [], kids: [] };
const listeners = new Set<() => void>();

function readStored(key: string): number[] {
  try {
    const value = localStorage.getItem(key);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((n): n is number => Number.isInteger(n) && n > 0))].sort(
      (a, b) => a - b,
    );
  } catch {
    return [];
  }
}

let mastery: Mastery = { adult: [], kids: [] };

if (typeof window !== 'undefined') {
  mastery = {
    adult: readStored(KEYS.adult),
    kids: readStored(KEYS.kids),
  };
}

export function subscribeMastery(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function masterySnapshot(): Mastery {
  return mastery;
}

export function masteryServerSnapshot(): Mastery {
  return SERVER;
}

/** يسجّل إجابة صحيحة ويعيد true إذا فُتح درس جديد */
export function recordCorrect(kids: boolean, n: number): boolean {
  const key = kids ? 'kids' : 'adult';
  if (!Number.isInteger(n) || n <= 0 || mastery[key].includes(n)) return false;

  const next = [...mastery[key], n].sort((a, b) => a - b);
  mastery = { ...mastery, [key]: next };
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(next));
  } catch {}
  listeners.forEach((listener) => listener());
  return true;
}
