'use client';

import { useSyncExternalStore } from 'react';
import { prefsServerSnapshot, prefsSnapshot, subscribePrefs } from '@/lib/prefs';
import { t } from '@/lib/i18n';

export function usePrefs() {
  const prefs = useSyncExternalStore(subscribePrefs, prefsSnapshot, prefsServerSnapshot);
  return { ...prefs, s: t(prefs.lang, prefs.gender), dir: prefs.lang === 'ar' ? 'rtl' : 'ltr' } as const;
}
