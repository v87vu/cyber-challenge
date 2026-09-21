/* المجموعة الأساسية: كل تدفقات اللعبة — تُشغَّل محلياً أو على الإنتاج عبر BASE */
import { chromium } from '/Users/ahmedalali/node_modules/playwright/index.mjs';
import {
  AR_CORRECT, KIDS_AR, ADULT_MILESTONES, KIDS_MILESTONES,
  ADULT_TOTAL, KIDS_TOTAL, pickCorrect, pickWrong, pickAgeAr, pickAgeEn, passBrief,
} from './helpers.mjs';

const S = new URL('./shots/', import.meta.url).pathname;
import { mkdirSync } from 'fs';
mkdirSync(S, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:3001';
const problems = [];
const note = (m) => { problems.push(m); console.log('PROBLEM:', m); };
const ok = (m) => console.log('ok:', m);

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
const p = await c.newPage();
const issues = [];
p.on('pageerror', e => issues.push(`[pageerror] ${e.message}`));
p.on('console', m => { if (m.type() === 'error') issues.push(`[console] ${m.text().slice(0, 200)}`); });
const shot = (n, full = false) => p.screenshot({ path: `${S}${n}.png`, fullPage: full });

async function fresh(prefs) {
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate((pr) => { localStorage.clear(); if (pr) localStorage.setItem('dac-prefs', JSON.stringify(pr)); }, prefs ?? null);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(350);
}

async function playAdultRound({ answers = AR_CORRECT, upTo = ADULT_TOTAL, wrongAt = null } = {}) {
  for (let i = 0; i < upTo; i++) {
    const n = i + 1;
    const opts = p.getByTestId('option');
    await opts.first().waitFor({ timeout: 15000 });
    if (wrongAt === n) await pickWrong(p, i, answers);
    else await pickCorrect(p, i, answers);
    await p.getByRole('button', { name: 'تأكيد الإجابة' }).click();
    await p.waitForTimeout(160);
    if (wrongAt === n) return;
    await p.getByRole('button', { name: n === ADULT_TOTAL ? 'إعلان النتيجة' : 'السؤال التالي' }).click();
    await p.waitForTimeout(170);
    if (n === 19) {
      await p.waitForTimeout(380);
      if (!(await p.locator('body').innerText()).includes('السؤال الذهبي')) note('golden ceremony missing');
      await shot('m5-ceremony');
    }
    if (ADULT_MILESTONES.includes(n)) {
      await p.getByRole('button', { name: 'متابعة' }).click();
      await p.waitForTimeout(170);
    }
    if (n === 8) await shot('m4-question', true);
  }
}

/* 1) القائمة + اللغة + العمر أولاً ثم النوع */
await fresh(null);
const menuAr = await p.locator('body').innerText();
if (!menuAr.includes('ابدأ التحدي')) note('AR menu missing');
await shot('m1-menu', true);
await p.getByRole('button', { name: 'English', exact: true }).click();
await p.waitForTimeout(300);
if (!(await p.locator('body').innerText()).includes('Start the Challenge')) note('EN toggle broken');
await p.getByRole('button', { name: 'العربية', exact: true }).click();
await p.waitForTimeout(250);
await p.getByRole('link', { name: /START/ }).click();
await p.waitForURL('**/play');
await p.getByText('حماية المجتمع').waitFor({ timeout: 8000 }).catch(() => note('brief message missing'));
if (!(await p.locator('body').innerText()).includes('سيف')) note('Saif brief missing');
await shot('m0-brief');
await passBrief(p);
if (!(await p.locator('body').innerText()).includes('كم عمرك؟')) note('age step after brief missing');
await shot('m2b-age');
await pickAgeAr(p);
if (!(await p.locator('body').innerText()).includes('من أنت؟')) note('gender step (second) missing');
await shot('m2-gender');
await p.getByText('أنثى', { exact: true }).click();
await p.waitForTimeout(300);
if (!/هل أنتِ مستعدة/.test(await p.locator('body').innerText())) note('feminine intro missing');
ok('menu + toggle + age-first + gender');

/* 2) عدّ تنازلي + لوحة مفاتيح + كتم (المؤقّت مفعّل) */
await p.getByRole('button', { name: /ابدأ/ }).click();
await p.waitForTimeout(280);
await shot('m3-countdown');
await p.getByTestId('option').first().waitFor({ timeout: 15000 });
const q1texts = await p.getByTestId('option').allInnerTexts();
const q1idx = q1texts.findIndex(t => t.includes('تُرتكب باستخدام التقنية'));
if (q1idx < 0) note('Q1 correct option not found');
await p.keyboard.press(String(q1idx + 1));
await p.waitForTimeout(140);
if ((await p.getByTestId('option').nth(q1idx).getAttribute('aria-pressed')) !== 'true') note('keyboard select broken');
await p.keyboard.press('Enter');
await p.waitForTimeout(240);
if (!(await p.locator('body').innerText()).includes('إجابة صحيحة!')) note('Enter confirm broken');
const muteBtn = p.getByRole('button', { name: 'الصوت' });
await muteBtn.click(); await p.waitForTimeout(100);
if ((await muteBtn.innerText()) !== 'OFF') note('mute toggle broken');
await muteBtn.click();
ok('countdown + keyboard + mute');

/* 3) جولة كاملة 22/22 */
await p.goto(BASE + '/play', { waitUntil: 'networkidle' });
await passBrief(p);
await pickAgeAr(p);
await p.getByText('أنثى', { exact: true }).click();
await p.waitForTimeout(250);
await p.getByRole('switch').click();
await p.getByRole('button', { name: /ابدأ/ }).click();
await playAdultRound();
const win = await p.locator('body').innerText();
if (!win.includes(`${ADULT_TOTAL} / ${ADULT_TOTAL}`)) note('win score missing');
if (!win.includes('مشاركة النتيجة')) note('share button missing');
await shot('m7-win', true);
ok('22/22 + ceremony + milestones');

/* 4) الشهادة */
await p.getByRole('button', { name: /استلام الشهادة/ }).click();
const h = await p.getByRole('heading', { level: 2 }).innerText();
if (h !== 'شهادة تقدير') note('cert heading wrong: ' + h);
await p.getByLabel('الاسم كما تريده على الشهادة').fill('اختبار');
await p.waitForTimeout(650);
const white = await p.evaluate(() => {
  const cv = document.querySelector('canvas[aria-label]');
  const d = cv.getContext('2d').getImageData(cv.width/2-200, 580, 400, 60).data;
  let w=0,t=0; for (let i=0;i<d.length;i+=4){t++;if(d[i]>240&&d[i+1]>240&&d[i+2]>240)w++;}
  return w/t;
});
if (white < 0.5) note('certificate not white: ' + white.toFixed(2));
await shot('m8-cert', true);
await p.getByRole('button', { name: 'إغلاق' }).click();
ok('certificate white + heading');

/* 5) خسارة عند 15 → شهادة تقدير */
await p.getByRole('button', { name: 'مراجعة كل الأسئلة' }).click();
await p.waitForTimeout(250);
await p.getByRole('button', { name: 'إعادة المحاولة' }).click();
await playAdultRound({ wrongAt: 16 });
await p.waitForTimeout(200);
const lost = await p.locator('body').innerText();
if (!lost.includes(`15 / ${ADULT_TOTAL}`)) note('loss score wrong');
if (!lost.includes('شهادة تقدير')) note('reward at 15 wrong');
await shot('m9-lost', true);
ok('loss at 15 → شهادة تقدير');

/* 6) العشوائية عبر الجولات */
{
  let differs = false, prev = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    await p.goto(BASE + '/play', { waitUntil: 'networkidle' });
    await passBrief(p);
    await pickAgeAr(p);
    await p.getByText('أنثى', { exact: true }).click();
    await p.waitForTimeout(200);
    await p.getByRole('switch').click();
    await p.getByRole('button', { name: /ابدأ/ }).click();
    await p.getByTestId('option').first().waitFor({ timeout: 15000 });
    const texts = (await p.getByTestId('option').allInnerTexts()).join('|');
    if (prev !== null && texts !== prev) { differs = true; break; }
    prev = texts;
  }
  if (!differs) note('options order identical across rounds — shuffle broken');
  else ok('options shuffle across rounds');
}

/* 7) الإنجليزية */
await fresh({ gender: 'female', lang: 'en', age: '18-24', onboarded: true });
await p.goto(BASE + '/play', { waitUntil: 'networkidle' });
await passBrief(p);
await pickAgeEn(p);
await p.getByText('Female', { exact: true }).click();
await p.waitForTimeout(250);
if (!(await p.locator('body').innerText()).includes('Are you ready?')) note('EN intro missing');
await p.getByRole('switch').click();
await p.getByRole('button', { name: /Start/ }).click();
await p.getByTestId('option').first().waitFor({ timeout: 15000 });
if (!(await p.locator('body').innerText()).includes('What is meant by cybercrime?')) note('EN question missing');
if ((await p.locator('div[dir]').first().getAttribute('dir')) !== 'ltr') note('EN not LTR');
await shot('m10-en');
ok('English mode');

/* 8) وضع الأطفال 12–17 */
await fresh(null);
await p.goto(BASE + '/play', { waitUntil: 'networkidle' });
await passBrief(p);
await pickAgeAr(p, '12–17 سنة');
await p.getByText('ذكر', { exact: true }).click();
await p.waitForTimeout(300);
const kidSrc = await p.locator('img[alt*="الشخصية"]').first().getAttribute('src');
if (!kidSrc?.includes('mk-')) note('kid art not used: ' + kidSrc);
await p.getByRole('switch').click();
await p.getByRole('button', { name: /ابدأ/ }).click();
await p.getByTestId('option').first().waitFor({ timeout: 15000 });
if (!(await p.locator('body').innerText()).includes('وأنت تلعب لعبة إلكترونية')) note('kids Q1 not shown');
await shot('m13-kids-q1', true);
for (let i = 0; i < KIDS_TOTAL; i++) {
  const n = i + 1;
  const opts = p.getByTestId('option');
  await opts.first().waitFor({ timeout: 15000 });
  await opts.filter({ hasText: KIDS_AR[i] }).first().click();
  await p.getByRole('button', { name: 'تأكيد الإجابة' }).click();
  await p.waitForTimeout(160);
  await p.getByRole('button', { name: n === KIDS_TOTAL ? 'إعلان النتيجة' : 'السؤال التالي' }).click();
  await p.waitForTimeout(170);
  if (n === 9) {
    await p.waitForTimeout(380);
    if (!(await p.locator('body').innerText()).includes('السؤال الذهبي')) note('kids golden ceremony missing');
  }
  if (KIDS_MILESTONES.includes(n)) {
    await p.getByRole('button', { name: 'متابعة' }).click();
    await p.waitForTimeout(170);
  }
}
const kidsWin = await p.locator('body').innerText();
if (!kidsWin.includes(`${KIDS_TOTAL} / ${KIDS_TOTAL}`)) note('kids win score missing');
if (!kidsWin.includes('بطل الوعي الرقمي')) note('kids champion missing');
await shot('m14-kids-win', true);
ok('kids mode end-to-end');

/* 9) العرض المباشر */
const d = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
d.on('pageerror', e => issues.push('[live] ' + e.message));
await d.goto(BASE + '/live', { waitUntil: 'networkidle' });
await d.waitForTimeout(350);
await d.screenshot({ path: `${S}m11-live.png` });
await d.keyboard.press('Space'); await d.waitForTimeout(220);
await d.keyboard.press('ArrowLeft'); await d.waitForTimeout(260);
if (!(await d.locator('body').innerText()).includes('إجابة صحيحة')) note('live reveal broken');
await d.screenshot({ path: `${S}m12-live-reveal.png` });
for (let i = 0; i < 43; i++) { await d.keyboard.press('Space'); await d.waitForTimeout(22); }
await d.waitForTimeout(220);
if (!(await d.locator('body').innerText()).includes('GAME CLEAR')) note('live outro missing');
ok('live mode');

console.log('\n==== CONSOLE ====');
console.log(issues.length ? issues.join('\n') : 'none');
console.log('==== SUMMARY ====');
console.log(problems.length ? `${problems.length} PROBLEM(S)` : 'ALL FLOWS PASS');
await b.close();
process.exit(problems.length ? 2 : 0);
