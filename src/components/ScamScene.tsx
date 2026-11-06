'use client';

import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { Lang } from '@/lib/questions';
import type { Scene } from '@/lib/scenes';
import AnswerFeedback from './AnswerFeedback';

function Signal() {
  return <svg width="34" height="10" viewBox="0 0 34 10" fill="currentColor" aria-hidden><path d="M0 7h2v3H0zm4-2h2v5H4zm4-2h2v7H8zm4-3h2v10h-2z" /><rect x="20" y="1" width="11" height="8" rx="2" fill="none" stroke="currentColor" /><path d="M22 3h7v4h-7zm10 0h2v4h-2z" /></svg>;
}

// Decorative poster pattern, deliberately not an encoded or navigable URL.
function QR() {
  return <svg viewBox="0 0 29 29" width="72" height="72" aria-hidden className="scene-qr-pattern"><rect width="29" height="29" fill="white" />{[[2, 2], [20, 2], [2, 20]].map(([x, y]) => <g key={`${x}-${y}`}><rect x={x} y={y} width="7" height="7" rx=".5" fill="currentColor" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="white" /><rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" /></g>)}{Array.from({ length: 81 }, (_, i) => { const x = 2 + (i % 9) * 3; const y = 2 + Math.floor(i / 9) * 3; return ((x < 10 && (y < 10 || y > 18)) || (x > 18 && y < 10) || i % 4 === 0) ? null : <rect key={i} x={x} y={y} width={i % 3 === 0 ? 2 : 1} height="2" fill="currentColor" />; })}</svg>;
}

export default function ScamScene({ scene, lang, inspect, found, onFind, feedback, feedbackId }: {
  scene: Scene;
  lang: Lang;
  inspect: boolean;
  found: string[];
  onFind: (id: string) => void;
  feedback: 'correct' | 'wrong' | null;
  feedbackId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0, arrow: 20 });
  const root = useRef<HTMLElement>(null);
  const anchor = useRef<HTMLButtonElement | null>(null);
  const id = useId();
  const current = scene.flags.find((flag) => flag.id === active);
  const count = scene.flags.filter((flag) => found.includes(flag.id)).length;
  const complete = count === scene.flags.length;
  const text = (ar: string, en: string, ur: string) => lang === 'ar' ? ar : lang === 'ur' ? ur : en;
  const caption = text('المشهد', 'Scene', 'منظر');

  // Keep the label next to its actual element, clamped inside the scene in either direction.
  useEffect(() => {
    if (!active || !root.current || !anchor.current) return;
    const update = () => {
      if (!root.current || !anchor.current) return;
      const bounds = root.current.getBoundingClientRect();
      const target = anchor.current.getBoundingClientRect();
      const center = target.left - bounds.left + target.width / 2;
      const x = Math.max(8, Math.min(bounds.width - 218, center - 105));
      setTip({ x, y: target.bottom - bounds.top + 8, arrow: Math.max(12, Math.min(198, center - x)) });
    };
    const observer = new ResizeObserver(update);
    observer.observe(root.current);
    update();
    return () => observer.disconnect();
  }, [active]);

  function mark(flagId: string, children?: ReactNode, className = '') {
    const index = scene.flags.findIndex((flag) => flag.id === flagId);
    const flag = scene.flags[index];
    if (!flag) return null;
    const content = children ?? <bdi>{flag.content[lang]}</bdi>;
    if (!inspect) return <span className={className} data-scene-element={flag.id}>{content}</span>;
    return <button type="button" className={`scene-hotspot ${className} ${found.includes(flag.id) ? 'scene-found' : ''}`} data-scene-element={flag.id} data-testid="scene-hotspot" aria-label={flag.content[lang]} aria-pressed={active === flag.id} aria-describedby={active === flag.id ? `${id}-tip` : undefined} onKeyDown={(event) => { if (event.key === 'Escape') setActive(null); }} onClick={(event) => {
      anchor.current = event.currentTarget;
      setActive(active === flag.id ? null : flag.id);
      onFind(flag.id);
    }}>{content}<span className="scene-marker" aria-hidden>{index + 1}</span></button>;
  }
  function message(exclude: string[] = []) {
    if (scene.body) return scene.body[lang].split(/(\{[^}]+\})/g).map((part, i) => <Fragment key={i}>{part.startsWith('{') ? mark(part.slice(1, -1), undefined, part === '{link}' ? 'scene-link' : ['{urgent}', '{deadline}'].includes(part) ? 'scene-urgent' : '') : part}</Fragment>);
    return scene.flags.filter((flag) => !exclude.includes(flag.id)).map((flag, i) => <Fragment key={flag.id}>{i > 0 ? ' · ' : ''}{mark(flag.id, undefined, flag.id === 'link' ? 'scene-link' : '')}</Fragment>);
  }
  const senderFlag = scene.flags.find((flag) => flag.id === 'sender');
  const sender = senderFlag
    ? mark('sender', <><bdi>{scene.sender ?? '+971 5x xxx xxxx'}</bdi><small className="scene-sender-note">{senderFlag.content[lang]}</small></>)
    : <bdi>{scene.sender ?? (scene.kind === 'sms' ? '+971 5x xxx xxxx' : scene.title[lang])}</bdi>;
  const status = <div className="scene-status" dir="ltr" aria-hidden><span>9:41</span><span className="scene-speaker" /><Signal /></div>;
  const header = <div className="scene-app-header"><span aria-hidden>‹</span><span className="scene-avatar" aria-hidden>{scene.kind === 'sms' ? '✉' : '●'}</span><strong>{sender}</strong><span aria-hidden>⋮</span></div>;
  let mock: ReactNode;

  switch (scene.kind) {
    case 'sms':
    case 'whatsapp':
      mock = <>{status}{header}<div className="scene-chat-body"><div className="scene-message">{message(['sender'])}<small dir="ltr">09:41 {scene.kind === 'whatsapp' && <span className="scene-ticks">✓✓</span>}</small></div></div></>;
      break;
    case 'email':
      mock = <>{status}<div className="scene-mail-header"><strong>✉ {text('البريد', 'Mail', 'میل')}</strong><span aria-hidden>⋯</span></div><div className="scene-mail-body"><div className="scene-mail-from">{text('من:', 'From:', 'از:')} {mark('identity')} <bdi className="scene-mail-address" dir="ltr">{scene.sender}</bdi></div><strong>{text('الموضوع:', 'Subject:', 'موضوع:')} {scene.title[lang]}</strong><p>{message()}</p>{mark('link', undefined, 'scene-link scene-mail-link')}</div></>;
      break;
    case 'call':
      mock = <>{status}<div className="scene-call-label">{text('مكالمة واردة', 'Incoming call', 'آنے والی کال')}</div><div className="scene-caller"><span className="scene-avatar" aria-hidden>☎</span><div><strong dir="ltr">+971 5x xxx xxxx</strong><small>{scene.title[lang]}</small></div></div><p className="scene-transcript">{message()}</p><div className="scene-call-actions" aria-hidden><span>☎ <small>{text('رفض', 'Decline', 'رد')}</small></span><span>☎ <small>{text('قبول', 'Accept', 'قبول')}</small></span></div></>;
      break;
    case 'social':
    case 'ad':
      mock = <>{status}<div className="scene-social-header"><strong>◉ {text('المجتمع', 'Community', 'کمیونٹی')}</strong><span aria-hidden>⌕</span></div><div className="scene-post-header"><span className="scene-avatar" aria-hidden>●</span><div><strong>{sender}</strong><small>{scene.kind === 'ad' ? text('مموّل', 'Sponsored', 'اشتہار') : text('منشور في المجموعة', 'Group post', 'گروپ پوسٹ')}</small></div><span aria-hidden>⋯</span></div><div className="scene-post-body"><div className="scene-post-art" aria-hidden>{scene.artwork ?? '🎁'}</div><p>{message(['sender'])}</p></div><div className="scene-post-cta" aria-hidden>{scene.kind === 'ad' ? text('اعرف المزيد', 'Learn more', 'مزید جانیں') : text('تعليق · مشاركة', 'Comment · Share', 'تبصرہ · شیئر')}</div></>;
      break;
    case 'web':
      mock = <>{status}<div className="scene-browser-bar" dir="ltr"><span>🔒 https://account.example/login</span><span aria-hidden>⟳</span></div><div className="scene-web-body"><strong>{scene.title[lang]}</strong><div className="scene-login" aria-hidden><span>{text('اسم المستخدم', 'Username', 'صارف نام')}</span><span>••••••••</span><b>{text('تسجيل الدخول', 'Sign in', 'لاگ ان')}</b></div><div className="scene-account-activity">{scene.flags.map((flag) => <div key={flag.id}>{mark(flag.id)}</div>)}</div></div></>;
      break;
    case 'wifi':
      mock = <>{status}<div className="scene-wifi-heading"><strong>Wi-Fi</strong><span aria-hidden>●</span></div><div className="scene-network-list">{scene.flags.map((flag) => <div key={flag.id}>{mark(flag.id)}<span aria-hidden>🔓</span></div>)}<div><bdi>Home_Network</bdi><span aria-hidden>🔒</span></div></div></>;
      break;
    case 'qr':
      mock = <>{status}<div className="scene-poster-heading"><span aria-hidden>▦</span><strong>{text('إعلان', 'Advertisement', 'اشتہار')}</strong><span aria-hidden>⋯</span></div><div className="scene-poster"><span className="scene-poster-star" aria-hidden>🎁</span><strong>{scene.title[lang]}</strong><div>{mark('code', <><QR /><span className="sr-only">{scene.flags[0].content[lang]}</span></>, 'scene-qr-target')}</div><p>{mark('prize')}</p></div></>;
      break;
    case 'receipt':
      mock = <>{status}<div className="scene-receipt-heading"><span aria-hidden>🧾</span><strong>{scene.title[lang]}</strong><span dir="ltr">09:41</span></div><div className="scene-receipt-body"><strong dir="ltr">AED 1,000.00 ✓</strong><p>{mark('reference')}</p><div className="scene-message">💬 {mark('seller')} <span aria-hidden>✓✓</span></div></div></>;
      break;
    case 'card':
      mock = <div className="scene-illustration"><div className="scene-orbit"><span className="scene-hero-icon" aria-hidden>{scene.artwork}</span>{scene.flags.map((flag, i) => <span key={flag.id} className={`scene-orbit-item scene-orbit-item--${i}`}>{mark(flag.id, <><span aria-hidden>{flag.content[lang].split(' ')[0]}</span><span className="sr-only">{flag.content[lang]}</span></>)}</span>)}</div><p>{scene.title[lang]}</p></div>;
      break;
  }

  return <section ref={root} dir={lang === 'en' ? 'ltr' : 'rtl'} className={`scam-scene ${inspect || expanded ? 'scene-expanded' : ''}`} aria-label={caption} data-inspect={inspect} data-scene-kind={scene.kind}>
    <div key={feedbackId} className={feedback === 'wrong' ? 'scene-shake' : undefined}>
      <div className="scene-heading"><span>{caption} · {scene.title[lang]}</span><button type="button" className="scene-toggle" aria-expanded={inspect || expanded} aria-controls={id} onClick={() => setExpanded(!expanded)} hidden={inspect}>{expanded ? text('طي', 'Less', 'بند') : text('عرض', 'View', 'دیکھیں')}</button></div>
      <div id={id} className="scene-content"><div className={`scene-device scene-device--${scene.kind}`}>{mock}</div></div>
    </div>
    {feedback && <AnswerFeedback key={`${feedbackId}-${feedback}`} result={feedback} lang={lang} />}
    {inspect && <div className="scene-inspection"><p aria-live="polite">{text('اكتشفت', 'Found', 'دریافت')} <bdi>{count}/{scene.flags.length}</bdi> · {complete ? text('كل العلامات! +1 ★', 'All flags! +1 ★', 'سب نشان! +1 ★') : text('المس العلامات لتكتشفها', 'Tap the hotspots', 'نشان دبائیں')}</p>{complete && <span className="scene-star-burst" aria-hidden>✦ ★ ✧</span>}</div>}
    {inspect && current && <div id={`${id}-tip`} role="status" className="scene-tip" style={{ left: tip.x, top: tip.y }}><span className="scene-tip-arrow" style={{ left: tip.arrow }} /><span>{current.label[lang]}</span><button type="button" aria-label={text('إغلاق', 'Close', 'بند')} onClick={() => setActive(null)}>×</button></div>}
  </section>;
}
