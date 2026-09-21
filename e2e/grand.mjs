/* المجموعة الموسّعة: مهلة حقيقية، مشاركة، تنزيل الشهادة، تعرّق L3، قص الاحتفال، وزن الصفحة */
import { chromium } from '/Users/ahmedalali/node_modules/playwright/index.mjs';
import { AR_CORRECT, EN_CORRECT, ADULT_MILESTONES, ADULT_TOTAL, pickCorrect, pickWrong, pickAgeAr, pickAgeEn, passBrief } from './helpers.mjs';
import { mkdirSync } from 'fs';
const S = new URL('./shots/', import.meta.url).pathname;
mkdirSync(S, { recursive: true });
const BASE = process.env.BASE || 'https://cyber-challenge-dusky.vercel.app';
const problems = [];
const note = (m) => { problems.push(m); console.log('PROBLEM:', m); };
const ok = (m) => console.log('ok:', m);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const p = await ctx.newPage();
const issues = [];
p.on('pageerror', e => issues.push('[pageerror] ' + e.message));
p.on('console', m => { if (m.type() === 'error') issues.push('[console] ' + m.text().slice(0, 180)); });

await p.goto(BASE, { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.clear());
const weight = await p.evaluate(() => {
  const rs = performance.getEntriesByType('resource');
  const nav = performance.getEntriesByType('navigation')[0];
  return Math.round((rs.reduce((a, r) => a + (r.transferSize || 0), 0) + (nav?.transferSize || 0)) / 1024);
});
console.log(`page weight: ~${weight}KB`);
if (weight > 1500) note(`first load heavy: ${weight}KB`);

/* 1) جولة كاملة: تعرّق + قص الاحتفال + مشاركة + تنزيل */
await p.reload({ waitUntil: 'networkidle' });
await p.getByRole('link', { name: /START/ }).click();
await p.waitForURL('**/play');
await p.waitForTimeout(300);
await passBrief(p);
await pickAgeAr(p);
await p.getByText('ذكر', { exact: true }).click();
await p.waitForTimeout(250);
await p.getByRole('switch').click();
await p.getByRole('button', { name: /ابدأ/ }).click();
for (let i = 0; i < ADULT_TOTAL; i++) {
  const n = i + 1;
  await p.getByTestId('option').first().waitFor({ timeout: 15000 });
  if (n === 11) {
    const src = await p.locator('img[alt*="الشخصية"]').first().getAttribute('src');
    if (!src?.includes('-sweat')) note('sweat pose missing at L3: ' + src);
    if ((await p.locator('div[style*="radial-gradient"]').count()) < 1) note('L3 vignette missing');
  }
  if (n === 16) await p.screenshot({ path: `${S}g1-level4.png` });
  await pickCorrect(p, i, AR_CORRECT);
  await p.getByRole('button', { name: 'تأكيد الإجابة' }).click();
  await p.waitForTimeout(150);
  await p.getByRole('button', { name: n === ADULT_TOTAL ? 'إعلان النتيجة' : 'السؤال التالي' }).click();
  await p.waitForTimeout(160);
  if (n === 19) {
    await p.waitForTimeout(350);
    if (!(await p.locator('body').innerText()).includes('السؤال الذهبي')) note('ceremony missing');
    await p.keyboard.press('Enter');
    const t0 = Date.now();
    await p.getByTestId('option').first().waitFor({ timeout: 3000 });
    if (Date.now() - t0 > 1200) note('ceremony skip slow');
    else ok('ceremony skip works');
  }
  if (ADULT_MILESTONES.includes(n)) {
    await p.getByRole('button', { name: 'متابعة' }).click();
    await p.waitForTimeout(160);
  }
}
if (!(await p.locator('body').innerText()).includes(`${ADULT_TOTAL} / ${ADULT_TOTAL}`)) note('win missing');
const shareBtn = p.getByRole('button', { name: /مشاركة النتيجة|تم نسخ/ });
await shareBtn.click();
await p.waitForTimeout(600);
const shareTxt = await shareBtn.innerText().catch(() => '');
const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => ''));
if (shareTxt.includes('تم نسخ') || clip.includes('تحدي الوعي الرقمي') || clip.includes('cyber-challenge')) ok('share fallback');
else note('share unclear: ' + shareTxt);
await p.getByRole('button', { name: /استلام الشهادة/ }).click();
const dlBtn = p.getByRole('button', { name: /تنزيل الشهادة/ });
if (!(await dlBtn.isDisabled())) note('download enabled with empty name');
await p.getByLabel('الاسم كما تريده على الشهادة').fill('فحص شامل');
await p.waitForTimeout(650);
const [download] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), dlBtn.click()]);
if (!download.suggestedFilename().includes('شهادة')) note('download filename odd');
else ok('certificate downloads');
await p.getByRole('button', { name: 'إغلاق' }).click();
await p.getByRole('button', { name: 'مراجعة كل الأسئلة' }).click();
await p.waitForTimeout(300);
const rev = await p.locator('body').innerText();
if (!rev.includes('أتجاهل الرسالة') || !rev.includes('معتمدان')) note('review incomplete');
await p.getByRole('button', { name: 'إنهاء', exact: true }).click();
await p.waitForTimeout(250);
if (!/هل أنتَ? مستعد/.test(await p.locator('body').innerText())) note('finish→intro broken');
ok('review + finish');

/* 2) انتهاء الوقت (45 ثانية) */
await p.goto(BASE + '/play', { waitUntil: 'networkidle' });
await passBrief(p);
await pickAgeAr(p);
await p.getByText('ذكر', { exact: true }).click();
await p.waitForTimeout(250);
await p.getByRole('button', { name: /ابدأ/ }).click();
await p.getByTestId('option').first().waitFor({ timeout: 15000 });
console.log('waiting 47s for the 45s timer…');
await p.waitForTimeout(47500);
if (!(await p.locator('body').innerText()).includes('انتهى الوقت')) note('timeout loss missing');
else ok('timeout → انتهى الوقت');
await p.screenshot({ path: `${S}g2-timeout.png`, fullPage: true });
await p.getByRole('link', { name: /القائمة الرئيسية|MENU/ }).first().click();
await p.waitForURL(BASE + '/');
ok('menu from loss');

/* 3) الإنجليزية: خسارة + شهادة EN */
await p.evaluate(() => localStorage.setItem('dac-prefs', JSON.stringify({ gender: 'female', lang: 'en', age: '18-24', onboarded: true })));
await p.goto(BASE + '/play', { waitUntil: 'networkidle' });
await passBrief(p);
await pickAgeEn(p);
await p.getByText('Female', { exact: true }).click();
await p.waitForTimeout(250);
await p.getByRole('switch').click();
await p.getByRole('button', { name: /Start/ }).click();
for (let i = 0; i < 5; i++) {
  await p.getByTestId('option').first().waitFor({ timeout: 15000 });
  await pickCorrect(p, i, EN_CORRECT);
  await p.getByRole('button', { name: 'Confirm answer' }).click();
  await p.waitForTimeout(150);
  await p.getByRole('button', { name: 'Next question' }).click();
  await p.waitForTimeout(160);
  if (i === 4) { await p.getByRole('button', { name: 'Continue' }).click(); await p.waitForTimeout(160); }
}
await p.getByTestId('option').first().waitFor({ timeout: 15000 });
await pickWrong(p, 5, ['', '', '', '', '', 'official channels']);
await p.getByRole('button', { name: 'Confirm answer' }).click();
await p.waitForTimeout(300);
if (!(await p.locator('body').innerText()).includes('Wrong answer')) note('EN loss missing');
await p.getByRole('button', { name: /certificate/i }).click();
if ((await p.getByRole('heading', { level: 2 }).innerText()) !== 'Certificate of Appreciation') note('EN cert heading wrong');
await p.getByLabel('Name as it should appear').fill('Test Run');
await p.waitForTimeout(650);
const whiteEn = await p.evaluate(() => {
  const cv = document.querySelector('canvas[aria-label]');
  const d = cv.getContext('2d').getImageData(cv.width/2-200, 580, 400, 60).data;
  let w=0,t=0; for (let i=0;i<d.length;i+=4){t++;if(d[i]>240&&d[i+1]>240&&d[i+2]>240)w++;}
  return w/t;
});
if (whiteEn < 0.5) note('EN cert not white');
else ok('EN certificate');
await p.screenshot({ path: `${S}g3-cert-en.png`, fullPage: true });

/* 4) العرض المباشر */
await p.getByRole('button', { name: 'Close' }).click();
await p.goto(BASE + '/live', { waitUntil: 'networkidle' });
await p.waitForTimeout(350);
await p.screenshot({ path: `${S}g4-live-mobile.png` });
const d = await b.newPage({ viewport: { width: 1600, height: 900 } });
d.on('pageerror', e => issues.push('[live] ' + e.message));
await d.goto(BASE + '/live', { waitUntil: 'networkidle' });
await d.waitForTimeout(350);
await d.keyboard.press('Space'); await d.waitForTimeout(200);
await d.keyboard.press('ArrowLeft'); await d.waitForTimeout(250);
if (!(await d.locator('body').innerText()).includes('إجابة صحيحة')) note('live reveal broken');
await d.keyboard.press('n'); await d.waitForTimeout(150);
if ((await d.locator('body').innerText()).includes('HOST')) note('N hide broken');
ok('live desktop + mobile');

console.log('\n==== CONSOLE ====');
console.log(issues.length ? issues.join('\n') : 'none');
console.log('==== SUMMARY ====');
console.log(problems.length ? `${problems.length} PROBLEM(S)` : 'ALL EXTENDED CHECKS PASS');
await b.close();
process.exit(problems.length ? 2 : 0);
