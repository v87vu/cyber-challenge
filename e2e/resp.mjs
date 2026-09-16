import { chromium } from '/Users/ahmedalali/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
const S = new URL('./shots/resp/', import.meta.url).pathname;
mkdirSync(S, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:3001';
const problems = [];
const note = (m) => { problems.push(m); console.log('PROBLEM:', m); };

const VIEWPORTS = [
  ['se', 375, 667], ['androidS', 360, 800], ['iph14', 390, 844], ['iph14pm', 430, 932],
  ['phoneL', 844, 390], ['tabletP', 768, 1024], ['tabletL', 1024, 768],
  ['laptop', 1366, 768], ['desktop', 1600, 900],
];

const b = await chromium.launch();

async function inView(p, loc, label, vp) {
  const v = p.viewportSize();
  if (v.height < 500) {
    // هاتف بالعرض: التمرير طبيعي — يكفي أن يكون العنصر قابلاً للوصول والظهور
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    if (!(await loc.isVisible())) note(`${vp}: ${label} not reachable`);
    return;
  }
  const box = await loc.boundingBox();
  if (!box) { note(`${vp}: ${label} has no box`); return; }
  if (box.y + box.height > v.height + 1 || box.y < -1 || box.x < -1 || box.x + box.width > v.width + 1)
    note(`${vp}: ${label} outside viewport (y=${Math.round(box.y)} h=${Math.round(box.height)} vh=${v.height})`);
}
async function noHScroll(p, vp, screen) {
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 1) note(`${vp}/${screen}: horizontal overflow ${over}px`);
}

for (const [name, w, h] of VIEWPORTS) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: w < 500 });
  const p = await c.newPage();
  p.on('pageerror', e => note(`${name}: pageerror ${e.message.slice(0, 80)}`));

  /* الرئيسية */
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.clear());
  await p.waitForTimeout(350);
  await noHScroll(p, name, 'home');
  await inView(p, p.getByRole('link', { name: /START/ }), 'START button', name);
  // الخلفية محمّلة فعلاً
  const bgOk = await p.evaluate(() => [...document.querySelectorAll('img[src*="bg-fort"]')].some(i => i.naturalWidth > 0 && i.offsetParent !== null || i.getClientRects().length > 0));
  if (!bgOk) note(`${name}: fort background not visible`);
  // في الوضع الرأسي: الحصن كاملاً = الصورة بكامل عرضها مرئية وقاعها عند قاع الشاشة
  if (h > w) {
    const m = await p.evaluate(() => {
      const img = [...document.querySelectorAll('img[src*="bg-fort"]')].find(i => i.getClientRects().length);
      if (!img) return null;
      const r = img.getBoundingClientRect();
      return { w: Math.round(r.width), vw: window.innerWidth, bottomGap: Math.round(window.innerHeight - r.bottom) };
    });
    if (!m) note(`${name}: portrait bg img missing`);
    else {
      if (Math.abs(m.w - m.vw) > 2) note(`${name}: portrait bg not full-width (${m.w} vs ${m.vw})`);
      if (Math.abs(m.bottomGap) > 2) note(`${name}: portrait bg not bottom-anchored (gap ${m.bottomGap})`);
    }
  }
  if (['se', 'iph14pm', 'tabletP', 'desktop'].includes(name)) await p.screenshot({ path: `${S}${name}-home.png` });

  /* العمر */
  await p.getByRole('link', { name: /START/ }).click();
  await p.waitForURL('**/play');
  await p.waitForTimeout(300);
  await noHScroll(p, name, 'age');
  await p.getByText('18–24 سنة', { exact: true }).click();
  await p.waitForTimeout(120);
  const cont = p.getByRole('button', { name: 'متابعة' });
  await inView(p, cont, 'متابعة (sticky)', name);
  await cont.click();
  await p.waitForTimeout(250);

  /* النوع */
  await noHScroll(p, name, 'gender');
  await inView(p, p.getByText('ذكر', { exact: true }), 'gender card', name);
  await p.getByText('ذكر', { exact: true }).click();
  await p.waitForTimeout(300);

  /* البداية */
  await noHScroll(p, name, 'intro');
  await inView(p, p.getByRole('button', { name: /ابدأ/ }), 'start button', name);
  await p.getByRole('switch').click();
  await p.getByRole('button', { name: /ابدأ/ }).click();
  await p.getByTestId('option').first().waitFor({ timeout: 15000 });
  await p.waitForTimeout(250);

  /* السؤال */
  await noHScroll(p, name, 'question');
  if ((await p.getByTestId('option').count()) !== 4) note(`${name}: options != 4`);
  const confirm = p.getByRole('button', { name: /اختر إجابة|تأكيد الإجابة/ });
  await inView(p, confirm, 'confirm (sticky)', name);
  await p.getByTestId('option').filter({ hasText: 'تُرتكب باستخدام التقنية' }).first().click();
  await p.waitForTimeout(150);
  await inView(p, p.getByRole('button', { name: 'تأكيد الإجابة' }), 'confirm after select', name);
  await p.getByRole('button', { name: 'تأكيد الإجابة' }).click();
  await p.waitForTimeout(800); // التمرير التلقائي
  await inView(p, p.getByRole('button', { name: 'السؤال التالي' }), 'next after reveal', name);
  if (['se', 'iph14pm', 'tabletP', 'desktop'].includes(name)) await p.screenshot({ path: `${S}${name}-q.png` });

  /* العرض المباشر */
  await p.goto(BASE + '/live', { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);
  await noHScroll(p, name, 'live');
  await c.close();
  console.log(`viewport ${name} (${w}x${h}) done`);
}

console.log('\n==== SUMMARY ====');
console.log(problems.length ? `${problems.length} PROBLEM(S):\n- ` + problems.join('\n- ') : 'ALL RESPONSIVE CHECKS PASS');
await b.close();
process.exit(problems.length ? 2 : 0);
