/* تفضيلات اللاعب: النوع واللغة — مخزن خارجي مع حفظ محلي */

export type Gender = 'male' | 'female';
export type Lang = 'ar' | 'en';
export const AGE_GROUPS = ['12-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65-70', '70+'] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export type Prefs = { gender: Gender | null; lang: Lang; age: AgeGroup | null; onboarded: boolean };

let prefs: Prefs = { gender: null, lang: 'ar', age: null, onboarded: false };

if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('dac-prefs');
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs>;
      prefs = {
        gender: p.gender === 'male' || p.gender === 'female' ? p.gender : null,
        lang: p.lang === 'en' ? 'en' : 'ar',
        age: AGE_GROUPS.includes(p.age as AgeGroup) ? (p.age as AgeGroup) : null,
        onboarded: p.onboarded === true,
      };
    }
  } catch {}
}

const SERVER: Prefs = { gender: null, lang: 'ar', age: null, onboarded: false };
const listeners = new Set<() => void>();

export function subscribePrefs(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function prefsSnapshot() {
  return prefs;
}

export function prefsServerSnapshot() {
  return SERVER;
}

function commit(next: Prefs) {
  prefs = next;
  try {
    localStorage.setItem('dac-prefs', JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

export function setGender(gender: Gender) {
  commit({ ...prefs, gender });
}

export function setLang(lang: Lang) {
  commit({ ...prefs, lang });
}

export function setAge(age: AgeGroup) {
  commit({ ...prefs, age });
}

export function finishOnboarding() {
  commit({ ...prefs, onboarded: true });
}

export function resetPrefs() {
  commit({ gender: null, lang: 'ar', age: null, onboarded: false });
}
