import type { Lang, Level } from '@/lib/questions';
import type { QuizType } from '@/lib/scenes';
import { levelLocation, locationImage } from '../lib/locations';

export default function ShieldMap({ levels, completedThrough, lang, mode = 'adult' }: { levels: Level[]; completedThrough: number; lang: Lang; mode?: QuizType }) {
  const next = levels.find((level) => level.to > completedThrough);
  const height = levels.length * 68;
  const points = levels.map((_, i) => ({ x: i % 2 === 0 ? 34 : 266, y: 34 + i * 68 }));
  const path = points.map((point, i) => i === 0 ? `M ${point.x} ${point.y}` : `C ${points[i - 1].x} ${point.y - 34}, ${point.x} ${point.y - 34}, ${point.x} ${point.y}`).join(' ');
  return (
    <section className="shield-map w-full" aria-label={lang === 'ar' ? 'رحلة درع أم القيوين' : lang === 'ur' ? 'ام القیوین کی ڈھال کا سفر' : 'UAQ Shield journey'}>
      <svg className="shield-map-path" viewBox={`0 0 300 ${height}`} preserveAspectRatio="none" aria-hidden>
        <path d={path} fill="none" stroke="#7895a6" strokeWidth="3" strokeDasharray="3 7" strokeLinecap="round" />
      </svg>
      <ol>
        {levels.map((level) => {
          const done = completedThrough >= level.to;
          const current = next?.id === level.id;
          return (
            <li key={level.id} className={`shield-station ${done ? 'shield-complete' : ''} ${current ? 'shield-next' : ''}`} aria-current={current ? 'step' : undefined}>
              <span className="station-shield" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="station-thumbnail" src={locationImage(levelLocation(mode, level.id))} alt="" width={44} height={44} />
                <span>{done ? '🛡️' : current ? '◇' : '○'}</span>
              </span>
              <span className="station-name">{level[lang]}<small>{done ? (lang === 'ar' ? 'اكتمل ✓' : lang === 'ur' ? 'مکمل ✓' : 'Complete ✓') : `${level.from}–${level.to}`}</small></span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
