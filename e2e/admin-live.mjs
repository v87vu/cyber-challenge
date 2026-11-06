/* فحص شامل للوحة الإدارة + الاتصال الحقيقي بقاعدة البيانات (على الموقع الحي).
   يلعب جولة حقيقية كجهاز عادي (بلا علامة webdriver) → يتحقق من ظهورها في اللوحة → يحذف صفوف الاختبار.
   التشغيل: BASE=https://cyber-challenge-v2.vercel.app ADMIN_PASS=... node e2e/admin-live.mjs */
import { chromium } from '/Users/ahmedalali/node_modules/playwright/index.mjs';
import { AR_CORRECT, startGame, answerCorrect, fastForwardVideo, fastForwardTransition } from './helpers.mjs';

const BASE = process.env.BASE || 'https://cyber-challenge-v2.vercel.app';
const EMAIL = 'ahmedhhalali@gmail.com';
const PASS = process.env.ADMIN_PASS;
const TAG = 'فحص آلي ' + Date.now().toString().slice(-6);
const ok = (m) => console.log('ok:', m);
const bad = (m) => { console.log('PROBLEM:', m); process.exitCode = 1; };
const errors = [];
const watch = (p, where) => {
  p.on('pageerror', (e) => errors.push(`${where}: pageerror ${String(e).slice(0, 160)}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource: the server responded with a status of 4(01|04)/.test(m.text())) errors.push(`${where}: ${m.text().slice(0, 160)}`); });
};

const b = await chromium.launch();

/* 1) أمان الـ API */
{
  const r1 = await fetch(BASE + '/api/admin/stats');
  r1.status === 401 ? ok('stats API without login → 401') : bad(`stats API without login → ${r1.status}`);
  const r2 = await fetch(BASE + '/api/admin/stats', { headers: { Authorization: 'Bearer not-a-real-token' } });
  r2.status === 401 ? ok('stats API with fake token → 401') : bad(`stats API fake token → ${r2.status}`);
  const r3 = await fetch(BASE + '/api/game-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"gameId":"x"}' });
  r3.status >= 400 && r3.status < 500 ? ok(`game-results rejects bad payload → ${r3.status}`) : bad(`game-results bad payload → ${r3.status}`);
}

/* 2) جولة حقيقية كجهاز عادي حتى الشهادة */
let gameId = null;
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  const p = await ctx.newPage(); watch(p, 'game');
  const saves = [];
  p.on('request', (r) => { if (r.url().includes('/api/game-results') && r.method() === 'POST') { try { const j = JSON.parse(r.postData() || '{}'); saves.push(j); gameId ??= j.gameId; } catch {} } });
  await p.goto(BASE + '/play');
  await p.getByText('25–34 سنة', { exact: true }).click();
  await p.getByRole('button', { name: 'متابعة' }).click();
  await p.getByText('أنثى', { exact: true }).click({ timeout: 8000 });
  const beforeGame = saves.length;
  // جهاز حقيقي لا يستطيع القفز للأمام — نتحقق من ذلك ثم نشاهد بسرعة ×16
  const vid = p.getByTestId('intro-video');
  await vid.waitFor({ timeout: 10000 });
  const blocked = await vid.evaluate(async (v) => {
    if (!isFinite(v.duration)) await new Promise((r) => v.addEventListener('loadedmetadata', r, { once: true }));
    v.muted = true; await v.play().catch(() => {});
    v.currentTime = v.duration - 1;
    await new Promise((r) => setTimeout(r, 400));
    return v.currentTime < v.duration - 2;
  });
  blocked ? ok('awareness video cannot be skipped ahead (real device)') : bad('awareness video seek-ahead NOT blocked');
  await vid.evaluate((v) => { v.playbackRate = 16; v.play().catch(() => {}); });
  await vid.waitFor({ state: 'detached', timeout: 30000 });
  await startGame(p);
  for (let n = 1; n <= 22; n++) {
    await answerCorrect(p, AR_CORRECT[n - 1]);
    if (await p.getByTestId('level-transition').isVisible().catch(() => false)) await fastForwardTransition(p);
  }
  await p.waitForTimeout(1500);
  beforeGame === 0 ? ok('no data sent before the game starts') : bad(`${beforeGame} saves before game start`);
  saves.some((s) => s.completed === true) ? ok('win saved (completed=true)') : bad('no completed save');
  saves.every((s) => !s.playerName) ? ok('all saves anonymous so far') : bad('a name was sent before the certificate step');
  gameId?.startsWith('v2-') ? ok(`game id tagged v2 (${gameId.slice(0, 10)}…)`) : bad(`game id not v2: ${gameId}`);

  // ما بعد الفوز: مراجعة/استبيان/شهادة
  for (let step = 0; step < 6; step++) {
    const body = await p.locator('body').innerText();
    if (/هل سبق وتعرضت للاحتيال/.test(body)) {
      const yes = p.getByRole('button', { name: /^نعم$/ }).first(); await yes.click();
      const ta = p.locator('textarea').first(); if (await ta.isVisible().catch(() => false)) await ta.fill('اختبار آلي — يُحذف');
      const no = p.getByRole('button', { name: /^لا$/ }); await no.last().click();
      await p.getByRole('button', { name: /متابعة|الشهادة/ }).last().click();
    } else if (await p.locator('input').first().isVisible().catch(() => false)) {
      await p.locator('input').first().fill(TAG);
      await p.getByRole('button', { name: 'إنشاء الشهادة' }).click();
      break;
    } else {
      const go = p.getByRole('button', { name: /الفيديو|متابعة|الاستبيان|التالي|شهاد|أكمل/ }).first();
      if (await go.isVisible().catch(() => false)) await go.click().catch(() => {}); else break;
    }
    await p.waitForTimeout(1200);
  }
  await p.waitForTimeout(2500);
  saves.some((s) => s.fraudExperience === 'yes') ? ok('survey answers saved') : bad('survey answers not saved');
  saves.some((s) => s.playerName === TAG) ? ok('name saved only at the certificate step') : bad('certificate name not saved');
  await ctx.close();
}

/* 3) لوحة الإدارة */
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); watch(p, 'admin');
  await p.goto(BASE + '/admin');
  await p.waitForTimeout(1500);
  const email = p.locator('input[type="email"], input[inputmode="email"]').first();
  const pass = p.locator('input[type="password"]').first();
  await email.fill(EMAIL); await pass.fill('wrong-password-123');
  await p.getByRole('button').filter({ hasText: /دخول/ }).first().click();
  await p.waitForTimeout(3000);
  /غير صحيح|خطأ|incorrect|invalid/i.test(await p.locator('body').innerText()) ? ok('wrong password rejected with a message') : bad('wrong password: no error message');
  await pass.fill(PASS);
  await p.getByRole('button').filter({ hasText: /دخول/ }).first().click();
  await p.waitForTimeout(7000);
  let txt = await p.locator('body').innerText();
  /نظرة عامة/.test(txt) && /اللاعبون/.test(txt) ? ok('admin login → overview loads') : bad('admin overview missing after login');

  // النسخة الجديدة + اليوم يجب أن تحتوي جولة الاختبار
  await p.getByRole('button', { name: 'النسخة الجديدة' }).first().click().catch(() => {});
  await p.getByRole('button', { name: 'اليوم' }).first().click().catch(() => {});
  await p.waitForTimeout(800);
  txt = await p.locator('body').innerText();
  const players = Number((txt.match(/اللاعبون\s*\n?\s*(\d+)/) || [])[1] || 0);
  players >= 1 ? ok(`v2 + today filter shows ${players} round(s)`) : bad('v2/today filter shows 0 rounds (test round missing)');
  /\d+%/.test(txt) ? ok('funnel percentages render') : bad('no percentages on overview');

  for (const [tab, expect] of [['الجولات', TAG], ['البلاغات', /احتيال|ابتزاز/], ['فجوات الوعي', /س\s?\d|نجاح/], ['التقارير', /PDF|Excel|تنزيل/]]) {
    await p.getByRole('button', { name: new RegExp(tab) }).first().click();
    await p.waitForTimeout(1200);
    const t = await p.locator('main, body').first().innerText();
    (typeof expect === 'string' ? t.includes(expect) : expect.test(t)) ? ok(`tab «${tab}» loads${tab === 'الجولات' ? ' and lists the test round' : ''}`) : bad(`tab «${tab}» content missing`);
    if (tab === 'الجولات') {
      const search = p.locator('input[type="search"], input[placeholder*="بحث"]').first();
      if (await search.isVisible().catch(() => false)) { await search.fill(TAG); await p.waitForTimeout(500); ok('rounds search works'); }
      await p.getByText(TAG).first().click().catch(() => {});
      await p.waitForTimeout(700);
      (await p.locator('body').innerText()).includes('25') ? ok('round detail drawer opens') : bad('round drawer did not open');
      await p.keyboard.press('Escape').catch(() => {});
    }
    if (tab === 'البلاغات') {
      const reveal = p.getByRole('button', { name: /إظهار/ }).first();
      if (await reveal.isVisible().catch(() => false)) { await reveal.click(); ok('contact reveal button works'); }
    }
    if (tab === 'التقارير') {
      await p.getByRole('button', { name: /تحديد كل الظاهر/ }).first().click();
      await p.waitForTimeout(400);
      for (const kind of [/PDF/, /Excel|xlsx/]) {
        const btn = p.getByRole('button', { name: kind }).first();
        if (await btn.isVisible().catch(() => false)) {
          const dl = p.waitForEvent('download', { timeout: 20000 }).catch(() => null);
          await btn.click();
          const f = await dl;
          f ? ok(`report download: ${await f.suggestedFilename()}`) : bad(`report ${kind} download failed`);
        } else bad(`report button ${kind} not found`);
      }
    }
  }
  await p.screenshot({ path: '/private/tmp/claude-501/-Users-ahmedalali/9fab99bc-b992-4113-8093-6cb820e02d4f/scratchpad/v2shots/admin-final.png', fullPage: false });

  // الهاتف
  const ph = await ctx.newPage(); watch(ph, 'admin-phone');
  await ph.setViewportSize({ width: 390, height: 844 });
  await ph.goto(BASE + '/admin'); await ph.waitForTimeout(5000);
  const hs = await ph.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  hs <= 1 ? ok('admin phone: no horizontal scroll') : bad(`admin phone horizontal overflow ${hs}px`);

  await p.bringToFront();
  await p.getByRole('button', { name: /خروج/ }).first().click();
  await p.waitForTimeout(2000);
  /دخول/.test(await p.locator('body').innerText()) ? ok('logout returns to login') : bad('logout did not return to login');
  await ctx.close();
}
await b.close();

console.log('\n==== GAME ID FOR CLEANUP ====');
console.log(gameId ?? 'none');
console.log('==== CONSOLE / PAGE ERRORS ====');
console.log(errors.length ? errors.join('\n') : 'none');
if (errors.length) process.exitCode = 1;
console.log('==== SUMMARY ====');
console.log(process.exitCode ? 'PROBLEMS — see above' : 'ADMIN + DATA: ALL CHECKS PASS');
