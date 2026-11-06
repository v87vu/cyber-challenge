/* أدوات مشتركة لاختبارات تحدي الوعي الرقمي */
export const AR_CORRECT = [
  'تُرتكب باستخدام التقنية', /لا$/, /نعم$/, 'كلمة مرور قوية وتفعيل',
  'محاولة خداع الشخص', 'قنواته الرسمية', 'وأنهي الاتصال', 'يمكن استغلالها',
  'والتحقق من مصدر الرسالة', 'لم يُخترق', 'يجب الحذر', 'تغيير كلمة المرور',
  'أتحقق من الجهة والترخيص', 'بشكل عاجل مع وعود', 'وأحتفظ بالأدلة', 'أدلة ومعلومات مهمة',
  'صفحة احتيالية', 'يتواصل معه عبر وسيلة أخرى', 'التوقف والتحقق من المصدر', 'أتجاهل الرسالة',
  'وأتأكد من صحة الإعلان', 'معتمدان',
];
export const EN_CORRECT = ['committed using technology', /No$/, /Yes$/, 'two-step verification', 'deceive a person'];
export const KIDS_AR = [
  'لا أعطيه المعلومات', 'لا أعطي كلمة المرور', 'قبل أن أضغط', 'أو المعلم', 'لا أرسل الصورة',
  'لا أقبل الطلب', 'لا أجيبه', 'فوراً أخبر', 'لا أتحدث معه', 'أحافظ على معلوماتي',
];
export const ADULT_MILESTONES = [5, 10, 15, 17, 20];
export const KIDS_MILESTONES = [3, 6];
export const ADULT_TOTAL = 22;
export const ADULT_GOLDEN_BEFORE = 19; // الاحتفال يظهر بعد إجابة السؤال 19
export const KIDS_TOTAL = 10;

export const pickCorrect = (page, i, arr) =>
  page.getByTestId('option').filter({ hasText: arr[i] }).first().click();
export const pickWrong = (page, i, arr) =>
  page.getByTestId('option').filter({ hasNotText: arr[i] }).first().click();

export const pickAgeAr = async (page, bracket = '18–24 سنة') => {
  await page.getByText(bracket, { exact: true }).click();
  await page.getByRole('button', { name: 'متابعة' }).click();
  await page.waitForTimeout(250);
};
export const pickAgeEn = async (page, bracket = '18–24 years') => {
  await page.getByText(bracket, { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(250);
};

/* ——— التدفق المعتمد: العمر → الفيديو → تمهيد سيف → النوع → البداية ——— */
export const passOnboardingAr = async (page, { bracket = '18–24 سنة', gender = 'ذكر' } = {}) => {
  await page.getByText(bracket, { exact: true }).click();
  await page.getByRole('button', { name: 'متابعة' }).click();
  await fastForwardVideo(page, bracket === '12–17 سنة');
  await page.getByRole('button', { name: /هيا لنبدأ/ }).click({ timeout: 8000 });
  await page.getByText(gender, { exact: true }).click();
  await page.getByRole('button', { name: /ابدأ/ }).waitFor({ timeout: 8000 });
};

export const startGame = async (page) => {
  await page.getByRole('button', { name: /ابدأ/ }).click();
  await page.getByTestId('option').first().waitFor({ timeout: 15000 });
};

/* إجابة صحيحة واحدة مع تجاوز شاشات الإنجاز والسؤال الذهبي */
export const answerCorrect = async (page, text, skipTransition = true) => {
  await page.getByTestId('option').first().waitFor({ timeout: 15000 });
  await page.getByTestId('option').filter({ hasText: text }).first().click();
  const confirm = page.getByRole('button', { name: /تأكيد|Confirm/ }).first();
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForTimeout(500);
  const next = page.getByRole('button', { name: /التالي|Next/ }).first();
  if (await next.isVisible().catch(() => false)) await next.click();
  const cont = page.getByRole('button', { name: /متابعة|Continue/ }).first();
  if (await cont.isVisible().catch(() => false)) await cont.click().catch(() => {});
  if (skipTransition) {
    const transitionSkip = page.getByTestId('transition-skip');
    if (await transitionSkip.isVisible().catch(() => false)) await transitionSkip.click();
    await page.keyboard.press('Enter').catch(() => {});
  }
  await page.waitForTimeout(300);
};

/* الفيديو التوعوي بعد اختيار العمر: تحقّق من المصدر ثم اقفز لقرب النهاية */
export const fastForwardVideo = async (page, kids = false) => {
  const vid = page.getByTestId('intro-video');
  await vid.waitFor({ timeout: 10000 });
  const src = await vid.getAttribute('src');
  const want = kids ? 'intro-kids.mp4' : 'intro-adult.mp4';
  if (!src?.includes(want)) throw new Error(`video src=${src}, expected ${want}`);
  await vid.evaluate(async (v) => {
    if (!isFinite(v.duration)) {
      await new Promise((r) => v.addEventListener('loadedmetadata', r, { once: true }));
    }
    v.muted = true;
    v.currentTime = Math.max(0, v.duration - 0.4);
    await v.play().catch(() => {});
  });
  await vid.waitFor({ state: 'detached', timeout: 10000 });
  await page.waitForTimeout(200);
};
