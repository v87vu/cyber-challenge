import type { Level } from './questions';
import type { QuizType } from './scenes';

export type Location = 'fort' | 'home' | 'school' | 'souq' | 'bank' | 'corniche' | 'park';

const ADULT: Record<Level['id'], Location> = { 1: 'home', 2: 'park', 3: 'souq', 4: 'bank', 5: 'fort', 6: 'corniche' };
const KIDS: Partial<Record<Level['id'], Location>> = { 1: 'school', 2: 'park', 3: 'home', 5: 'fort' };

export function levelLocation(mode: QuizType, level: Level['id']): Location {
  return (mode === 'kids' ? KIDS[level] : ADULT[level]) ?? 'fort';
}

export function locationImage(location: Location): string {
  return location === 'fort' ? '/art/bg-fort.jpg' : `/scenes/bg-${location}.webp`;
}
