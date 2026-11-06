import type { Level } from './questions';
import type { QuizType } from './stars';

export type Location = 'fort' | 'home' | 'school' | 'souq' | 'bank' | 'corniche' | 'park';

const ADULT: Record<Level['id'], Location> = { 1: 'home', 2: 'park', 3: 'souq', 4: 'bank', 5: 'fort', 6: 'corniche' };
const KIDS: Partial<Record<Level['id'], Location>> = { 1: 'school', 2: 'park', 3: 'home', 5: 'fort' };

const ADULT_TRANSITIONS: Record<string, string> = {
  '1-2': '/transitions/t1-home-park.mp4',
  '2-3': '/transitions/t2-park-souq.mp4',
  '3-4': '/transitions/t3-souq-bank.mp4',
  '4-5': '/transitions/t4-bank-fort.mp4',
  '5-6': '/transitions/t5-fort-corniche.mp4',
};
const KIDS_TRANSITIONS: Record<string, string> = {
  '1-2': '/transitions/k1-school-park.mp4',
  '2-3': '/transitions/k2-park-home.mp4',
  '3-5': '/transitions/k3-home-fort.mp4',
};

export function transitionClip(mode: QuizType, fromLevelId: Level['id'], toLevelId: Level['id']): string | null {
  return (mode === 'kids' ? KIDS_TRANSITIONS : ADULT_TRANSITIONS)[`${fromLevelId}-${toLevelId}`] ?? null;
}

export function levelLocation(mode: QuizType, level: Level['id']): Location {
  return (mode === 'kids' ? KIDS[level] : ADULT[level]) ?? 'fort';
}

export function locationImage(location: Location): string {
  return location === 'fort' ? '/art/bg-fort.jpg' : `/scenes/bg-${location}.webp`;
}
