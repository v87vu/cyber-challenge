/* المجموعة الأساسية:
   العمر → الفيديو → تمهيد سيف → النوع → اللعب → الفوز → الاستبيان → بيانات الشهادة.
   تعمل بلا أي مفاتيح بيئة (Supabase/Gemini/Resend) — أخطاء 503 متوقعة ومرشّحة.
   التشغيل: BASE=http://localhost:3100 node e2e/suite.mjs */
import { chromium } from '/Users/ahmedalali/node_modules/playwright/index.mjs';
import {
  AR_CORRECT, KIDS_AR, ADULT_TOTAL, KIDS_TOTAL,
  passOnboardingAr, startGame, answerCorrect, fastForwardTransition,
} from './helpers.mjs';

const BASE = process.env.BASE || 'http://localhost:3100';
const ok = (m) => console.log('ok:', m);
const bad = (m) => { console.log('PROBLEM:', m); process.exitCode = 1; };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const consoleErrors = [];
const EXPECTED = /503|Failed to load resource|player save|Registration|Survey autosave|game save/i;
const watch = (p) => p.on('console', (m) => {
  if (m.type() === 'error' && !EXPECTED.test(m.text())) consoleErrors.push(m.text().slice(0, 160));
});

/* 1+2) إعداد كامل ثم جولة 22/22 */
let page = await ctx.newPage();
watch(page);
await page.goto(`${BASE}/play`);
await passOnboardingAr(page);
ok('onboarding: age → gender → video');
await startGame(page);
let q1Order = await page.getByTestId('option').allInnerTexts();
for (let n = 1; n <= ADULT_TOTAL; n++) {
  await answerCorrect(page, AR_CORRECT[n - 1], n !== 5);
  if (n === 5) {
    const transition = page.getByTestId('level-transition');
    await transition.waitFor({ timeout: 3000 });
    const src = await transition.locator('video').getAttribute('src');
    if (src?.includes('t1-home-park')) ok('adult Q5 → t1-home-park transition');
    else bad(`adult Q5 transition src=${src}`);
    await fastForwardTransition(page);
  }
}
await page.waitForTimeout(1200);
let body = await page.locator('main').innerText();
if (body.includes(`${ADULT_TOTAL} / ${ADULT_TOTAL}`) && body.includes('بطل الوعي الرقمي')) ok('22/22 → بطل الوعي الرقمي');
else bad(`win screen wrong: ${body.slice(0, 120)}`);

/* 3) الفوز → الاستبيان → إدخال الاسم في النهاية → تنزيل الشهادة */
await page.getByRole('button', { name: /الاستبيان|الأسئلة/ }).first().click();
const no = page.getByRole('button', { name: /^لا$/ });
await no.nth(0).click();
await no.nth(1).click();
await page.getByRole('button', { name: /متابعة إلى الشهادة/ }).click();
await page.locator('input[autocomplete="name"]').fill('لاعب تجريبي');
const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
await page.getByRole('button', { name: /إنشاء الشهادة/ }).click();
const file = await dl;
if (file && (await file.suggestedFilename()).includes('شهادة')) ok(`certificate PDF downloaded (${await file.suggestedFilename()})`);
else bad('certificate download missing');
await page.close();

/* 4) قاعدة نسخة الجهة: الإجابة الخاطئة لا تُنهي الجولة — تعليم ثم إعادة للسؤال نفسه */
page = await ctx.newPage();
watch(page);
await page.goto(`${BASE}/play`);
await passOnboardingAr(page);
await startGame(page);
const q1OrderB = await page.getByTestId('option').allInnerTexts();
if (JSON.stringify(q1Order) !== JSON.stringify(q1OrderB)) ok('options shuffle across runs');
else console.log('note: Q1 order matched once (can happen 1/24) — not failing');
await page.getByTestId('option').filter({ hasNotText: AR_CORRECT[0] }).first().click();
const confirmBtn = page.getByRole('button', { name: /تأكيد/ }).first();
if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
await page.waitForTimeout(1200);
body = await page.locator('main').innerText();
if (/الإجابة غير صحيحة/.test(body) && /01\/22/.test(body)) ok('wrong answer → teach-back, same question retried (no sudden death)');
else bad(`wrong-answer behavior unexpected: ${body.slice(0, 120)}`);
// بعد الخطأ نجيب صحيحاً ونتقدم
await answerCorrect(page, AR_CORRECT[0]);
body = await page.locator('main').innerText();
if (/02\/22/.test(body)) ok('advances after correcting the mistake');
else bad(`no advance after correction: ${body.slice(0, 100)}`);
await page.close();

/* 5) وضع الأطفال 12–17: فيديو الأطفال أثناء الإعداد ثم جولة كاملة */
page = await ctx.newPage();
watch(page);
await page.goto(`${BASE}/play`);
await passOnboardingAr(page, { bracket: '12–17 سنة' });
ok('kids video source correct during onboarding');
await startGame(page);
for (let n = 1; n <= KIDS_TOTAL; n++) await answerCorrect(page, KIDS_AR[n - 1]);
await page.waitForTimeout(1200);
body = await page.locator('main').innerText();
if (body.includes(`${KIDS_TOTAL} / ${KIDS_TOTAL}`)) ok('kids 10/10 win');
else bad(`kids win wrong: ${body.slice(0, 120)}`);
await page.getByRole('button', { name: /الاستبيان|الأسئلة/ }).first().click();
await page.getByText('أسئلة أخيرة قبل الشهادة', { exact: true }).waitFor();
ok('post-win flow goes directly to survey without video');
await page.close();

/* 6) الإنجليزية: الواجهة تتبدل */
page = await ctx.newPage();
watch(page);
await page.addInitScript(() => {
  try { localStorage.setItem('dac-prefs', JSON.stringify({ lang: 'en', onboarded: false })); } catch {}
});
await page.goto(`${BASE}/play`);
await page.getByText('How old are you?').waitFor({ timeout: 8000 });
ok('English mode renders');
await page.close();

/* 7) العرض المباشر */
page = await ctx.newPage();
watch(page);
await page.goto(`${BASE}/live`);
await page.waitForTimeout(1500);
body = await page.locator('body').innerText();
if (body.length > 100) ok('live mode loads');
else bad('live mode empty');
await page.close();

console.log('\n==== CONSOLE (unexpected only) ====');
console.log(consoleErrors.length ? consoleErrors.join('\n') : 'none');
if (consoleErrors.length) process.exitCode = 1;
console.log('==== SUMMARY ====');
console.log(process.exitCode ? 'FAILURES — see above' : 'ALL FLOWS PASS');
await browser.close();
