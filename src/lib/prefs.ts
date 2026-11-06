/* تفضيلات اللاعب: النوع واللغة — مخزن خارجي مع حفظ محلي */

export type Gender = 'male' | 'female';
export type Lang = 'ar' | 'en' | 'ur';
export const AGE_GROUPS = ['12-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65-70', '70+'] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export type Prefs = { gender: Gender | null; lang: Lang; age: AgeGroup | null; name: string; email: string; phone: string; onboarded: boolean };

let prefs: Prefs = { gender: null, lang: 'ar', age: null, name: '', email: '', phone: '', onboarded: false };

if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('dac-prefs');
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs>;
      prefs = {
        gender: p.gender === 'male' || p.gender === 'female' ? p.gender : null,
        lang: p.lang === 'en' || p.lang === 'ur' ? p.lang : 'ar',
        age: AGE_GROUPS.includes(p.age as AgeGroup) ? (p.age as AgeGroup) : null,
        name: typeof p.name === 'string' ? p.name.slice(0, 120) : '',
        email: typeof p.email === 'string' ? p.email.slice(0, 180) : '',
        phone: typeof p.phone === 'string' ? p.phone.slice(0, 40) : '',
        onboarded: p.onboarded === true,
      };
    }
  } catch {}
}

const SERVER: Prefs = { gender: null, lang: 'ar', age: null, name: '', email: '', phone: '', onboarded: false };
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

export function setName(name: string) {
  commit({ ...prefs, name: name.trimStart().slice(0, 120) });
}

export function setEmail(email: string) {
  commit({ ...prefs, email: email.trim().slice(0, 180) });
}

export function setPhone(phone: string) {
  commit({ ...prefs, phone: phone.trim().slice(0, 40) });
}

export function finishOnboarding() {
  commit({ ...prefs, onboarded: true });
}

export function resetPrefs() {
  commit({ gender: null, lang: 'ar', age: null, name: '', email: '', phone: '', onboarded: false });
}
