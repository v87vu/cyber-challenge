'use client';

import { usePrefs } from '@/lib/usePrefs';
import Background from '@/components/Background';
import type { Location } from '@/lib/locations';

/** يضبط اتجاه الصفحة ولغتها حسب اختيار اللاعب، فوق مشهد البكسل */
export default function Shell({
  children,
  dim = 0,
  wide,
  location,
  nextLocation,
}: {
  children: React.ReactNode;
  dim?: number;
  wide?: boolean;
  location?: Location;
  nextLocation?: Location;
}) {
  const { lang, dir } = usePrefs();
  return (
    <div dir={dir} lang={lang} className="min-h-dvh overflow-x-clip">
      <Background dim={dim} location={location} nextLocation={nextLocation} />
      <main
        className={`mx-auto flex min-h-dvh w-full flex-col px-4 py-6 pb-10 ${wide ? 'max-w-6xl' : 'max-w-2xl'}`}
      >
        {children}
      </main>
    </div>
  );
}
