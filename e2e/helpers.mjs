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
