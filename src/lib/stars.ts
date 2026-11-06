import { getScene, local, type Localized, type QuizType } from './scenes';

export type StarAttempt = { questionNumber: number; isCorrect: boolean; timeSpentSeconds: number };
export type FoundFlags = Record<number, string[]>;
export type Badge = { id: string; icon: string; name: Localized };

/** Derive rewards from evidence, so retries and repeated hotspot taps never duplicate stars. */
export function summarizeStars(mode: QuizType, attempts: StarAttempt[], found: FoundFlags) {
  const total = mode === 'kids' ? 10 : 22;
  const numbers = Array.from({ length: total }, (_, i) => i + 1);
  const answered = numbers.filter((n) => attempts.some((a) => a.questionNumber === n && a.isCorrect));
  const inspected = (n: number) => {
    if (!answered.includes(n)) return 0;
    return getScene(mode, n).flags.filter((flag) => found[n]?.includes(flag.id)).length;
  };
  const allFound = (n: number) => inspected(n) === getScene(mode, n).flags.length;
  const firstTry = answered.filter((n) => attempts.find((a) => a.questionNumber === n)?.isCorrect).length;
  const inspectionStars = answered.filter(allFound).length;
  const flagCount = numbers.reduce((sum, n) => sum + inspected(n), 0);
  const totalFlags = numbers.reduce((sum, n) => sum + getScene(mode, n).flags.length, 0);
  const finished = answered.length === total;
  // Count every retry's time; a fast final retry cannot erase time spent on earlier attempts.
  const averageSeconds = attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / Math.max(1, answered.length);
  const badges: Badge[] = [];
  const award = (earned: boolean, id: string, icon: string, adult: Localized, kids: Localized) => {
    if (finished && earned) badges.push({ id, icon, name: mode === 'kids' ? kids : adult });
  };
  award(numbers.filter((n) => getScene(mode, n).linkQuestion).every(allFound), 'links', '🔎',
    local('صياد الروابط', 'Link hunter', 'لنک شکاری'), local('كاشف الروابط الصغير', 'Junior link scout', 'ننھا لنک جاسوس'));
  award(averageSeconds < 10, 'quick', '⚡',
    local('سريع البديهة', 'Quick thinker', 'تیز ذہن'), local('النجم السريع', 'Quick star', 'تیز ستارہ'));
  award(attempts.every((a) => a.isCorrect), 'flawless', '✨',
    local('بلا أخطاء', 'Flawless', 'بے خطا'), local('بطل بلا أخطاء', 'Flawless hero', 'بے خطا ہیرو'));
  award(flagCount >= totalFlags * 0.8, 'detective', '🕵️',
    local('المحقق الرقمي', 'Digital detective', 'ڈیجیٹل جاسوس'), local('المحقق الصغير', 'Junior detective', 'ننھا جاسوس'));
  award(true, 'guardian', '🛡️',
    local('حارس أم القيوين', 'UAQ guardian', 'ام القیوین کا محافظ'), local('حارس أم القيوين الصغير', 'Junior UAQ guardian', 'ام القیوین کا ننھا محافظ'));
  return { stars: firstTry + inspectionStars, firstTry, inspectionStars, flagCount, totalFlags, averageSeconds, badges };
}

type BestStars = Record<QuizType, number>;
const KEYS = { adult: 'dac-best-stars-adult', kids: 'dac-best-stars-kids' } as const;
const SERVER: BestStars = { adult: 0, kids: 0 };
let best = SERVER;
const listeners = new Set<() => void>();
function readBest(): BestStars {
  const read = (mode: QuizType) => {
    const value = Number(localStorage.getItem(KEYS[mode]));
    return Number.isFinite(value) ? Math.min(mode === 'kids' ? 20 : 44, Math.max(0, Math.floor(value))) : 0;
  };
  try { return { adult: read('adult'), kids: read('kids') }; } catch { return best; }
}
if (typeof window !== 'undefined') best = readBest();
function notify() { listeners.forEach((listener) => listener()); }
function onStorage(event: StorageEvent) {
  if (event.key !== null && !Object.values(KEYS).some((key) => key === event.key)) return;
  const updated = readBest();
  if (updated.adult !== best.adult || updated.kids !== best.kids) {
    best = updated;
    notify();
  }
}
export function subscribeBestStars(listener: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}
export const bestStarsSnapshot = () => best;
export const bestStarsServerSnapshot = () => SERVER;
export function recordStars(stars: number, mode: QuizType) {
  if (!Number.isFinite(stars)) return false;
  const stored = readBest();
  const value = Math.min(mode === 'kids' ? 20 : 44, Math.max(0, Math.floor(stars)));
  if (value <= Math.max(best[mode], stored[mode])) return false;
  best = { ...best, [mode]: value };
  try { localStorage.setItem(KEYS[mode], String(value)); } catch {}
  notify();
  return true;
}
