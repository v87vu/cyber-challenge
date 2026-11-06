'use client';

import { useState } from 'react';
import { locationImage, type Location } from '../lib/locations';
import styles from './Background.module.css';

/* خلفية حصن أم القيوين:
   - عرضي/سطح المكتب: تعبئة كاملة (cover).
   - رأسي (الهاتف): الصورة بكامل عرضها مثبتة أسفل الشاشة حتى يظهر الحصن كاملاً،
     وسماء متدرجة تكمل الأعلى بلون حافة الصورة نفسها، مع تلاشٍ ناعم عند الالتقاء. */

function LocationArtwork({ location }: { location: Location }) {
  if (location !== 'fort') {
    // Local pre-rendered artwork; preserve the soft day palette.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={locationImage(location)} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: 'center 60%' }} />;
  }
  return <>
      {/* الوضع العرضي */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/bg-fort.jpg"
        alt=""
        className="absolute inset-0 hidden h-full w-full object-cover landscape:block"
        style={{ objectPosition: 'center 68%' }}
      />

      {/* الوضع الرأسي: سماء ممتدة + الصورة كاملة العرض في الأسفل */}
      <div
        className="absolute inset-0 landscape:hidden"
        style={{
          background:
            'linear-gradient(180deg, #1e7ec9 0%, #3597e2 34%, #47aff8 62%, #47aff8 100%)',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/bg-fort.jpg"
        alt=""
        className="absolute inset-x-0 bottom-0 hidden w-full portrait:block"
        style={{
          height: 'auto',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%)',
        }}
      />

    </>;
}

export default function Background({ dim = 0, location = 'fort', nextLocation }: { dim?: number; location?: Location; nextLocation?: Location }) {
  const [transition, setTransition] = useState({ current: location, previous: location });
  // Remember the outgoing artwork while the new layer fades over it.
  if (transition.current !== location) setTransition({ current: location, previous: transition.current });
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" data-location={location}>
      {nextLocation && nextLocation !== location && <link rel="preload" as="image" href={locationImage(nextLocation)} />}
      <div className="absolute inset-0"><LocationArtwork location={transition.previous} /></div>
      <div key={location} className={`absolute inset-0 ${styles.arriving}`}><LocationArtwork location={location} /></div>
      {/* تدرّج قراءة خفيف */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 40%, rgba(255,251,240,0.28) 100%)',
        }}
      />
      {dim > 0 && (
        <div
          className="absolute inset-0"
          style={{ background: `rgba(248, 251, 255, ${Math.min(0.85, dim * 0.75)})` }}
        />
      )}
    </div>
  );
}
