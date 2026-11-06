import type { Lang } from './questions';

export type QuizType = 'adult' | 'kids';
export type Localized = Record<Lang, string>;
export type Flag = { id: string; content: Localized; label: Localized };
export type Scene = {
  kind: 'card' | 'whatsapp' | 'sms' | 'email' | 'call' | 'social' | 'web' | 'ad' | 'wifi' | 'receipt' | 'qr';
  title: Localized;
  body?: Localized;
  sender?: string;
  artwork?: string;
  flags: Flag[];
  linkQuestion?: boolean;
};
export const local = (ar: string, en: string, ur: string): Localized => ({ ar, en, ur });
const flag = (id: string, content: Localized, label: Localized): Flag => ({ id, content, label });
const link = (address: string) => flag('link', local(address, address, address), local('رابط غير موثوق؛ تحقق من الوجهة', 'Unverified link: check its destination', 'نامعلوم لنک؛ پتہ چیک کریں'));
const unknown = flag('sender', local('مرسل غير محفوظ', 'Unsaved sender', 'نامعلوم بھیجنے والا'), local('هوية المرسل غير مؤكدة', 'The sender’s identity is unverified', 'بھیجنے والے کی شناخت نامعلوم ہے'));
const password = flag('password', local('أرسل كلمة مرورك', 'Send your password', 'پاس ورڈ بھیجیں'), local('كلمة المرور سرّ لا يُشارك', 'Passwords must stay private', 'پاس ورڈ خفیہ رکھیں'));
const urgency = flag('urgent', local('الآن! العرض ينتهي قريباً', 'Now! Offer ends soon', 'ابھی! پیشکش ختم ہونے والی ہے'), local('الاستعجال يمنعك من التحقق', 'Time pressure discourages checking', 'جلدی کا دباؤ تصدیق روکتا ہے'));
const otp = flag('otp', local('أرسل رمز OTP', 'Send your OTP', 'OTP بھیجیں'), local('لا تشارك رمز التحقق مع أحد', 'Never share your verification code', 'تصدیقی کوڈ کسی کو نہ دیں'));
const friend = local('محادثة مع صديق', 'Chat with a friend', 'دوست سے گفتگو');
const game = local('دردشة اللعبة', 'Game chat', 'کھیل کی چیٹ');
const secret = flag('secret', local('لا تخبر والديك', 'Don’t tell your parents', 'والدین کو مت بتانا'), local('طلب السرية عن أهلك علامة خطر', 'Keeping this from family is a danger sign', 'خاندان سے چھپانے کو کہنا خطرہ ہے'));

// Fictional, non-clickable .example addresses. Nothing here initiates a request.
const ADULT: Scene[] = [
  { kind: 'card', title: local('عالمنا الرقمي', 'Our digital world', 'ہماری ڈیجیٹل دنیا'), flags: [
    flag('device', local('💻 تقنية وشبكات', '💻 Technology & networks', '💻 ٹیکنالوجی اور نیٹ ورک'), local('قد تُستخدم التقنية لارتكاب جريمة', 'Technology can be used to commit a crime', 'ٹیکنالوجی جرم میں استعمال ہو سکتی ہے')),
    flag('identity', local('🪪 حسابات وبيانات', '🪪 Accounts & data', '🪪 اکاؤنٹ اور معلومات'), local('سرقة البيانات وانتحال الهوية من الجرائم الإلكترونية', 'Data theft and impersonation are cybercrimes', 'معلومات کی چوری اور نقالی سائبر جرائم ہیں')),
  ] },
  { kind: 'whatsapp', title: friend, flags: [password, flag('trust', local('أنت تثق بي، صحيح؟', 'You trust me, right?', 'مجھ پر بھروسہ ہے نا؟'), local('الثقة لا تبرر مشاركة الأسرار', 'Trust is no reason to share secrets', 'بھروسے پر بھی راز نہ دیں'))] },
  { kind: 'whatsapp', title: friend, linkQuestion: true, flags: [flag('sender', local('من حساب صديقك', 'From your friend’s account', 'دوست کے اکاؤنٹ سے'), local('قد يكون حساب الصديق مخترقاً', 'A friend’s account may be compromised', 'دوست کا اکاؤنٹ ہیک ہو سکتا ہے')), link('gift.example/x')] },
  { kind: 'card', title: local('حماية الحساب', 'Account protection', 'اکاؤنٹ کی حفاظت'), flags: [
    flag('lock', local('🔐 تسجيل الدخول', '🔐 Sign-in', '🔐 لاگ ان'), local('استخدم كلمة مرور قوية وفريدة', 'Use a strong, unique password', 'مضبوط اور منفرد پاس ورڈ رکھیں')),
    flag('shield', local('🛡 إعدادات الأمان', '🛡 Security settings', '🛡 حفاظتی ترتیبات'), local('فعّل التحقق بخطوتين', 'Enable two-step verification', 'دو مرحلوں والی تصدیق فعال کریں')),
  ] },
  { kind: 'email', title: local('إشعار الحساب', 'Account notice', 'اکاؤنٹ اطلاع'), linkQuestion: true, flags: [flag('identity', local('فريق دعم الحسابات', 'Account support team', 'اکاؤنٹ سپورٹ ٹیم'), local('الاسم الرسمي لا يثبت الهوية', 'An official-sounding name proves nothing', 'سرکاری سا نام شناخت کا ثبوت نہیں')), link('verify.example/login'), password] },
  { kind: 'sms', title: local('تحديث حسابك البنكي', 'Bank account update', 'بینک اکاؤنٹ اپ ڈیٹ'), linkQuestion: true, flags: [flag('urgent', local('فوراً', 'immediately', 'فوراً'), urgency.label), link('bank-update.example'), flag('data', local('تحديث بيانات حسابك البنكي', 'update your bank account details', 'بینک اکاؤنٹ کی معلومات اپ ڈیٹ کریں'), local('طلب بيانات بنكية عبر رسالة', 'Bank details requested through a message', 'پیغام کے ذریعے بینک کی معلومات طلب کی گئیں'))] },
  { kind: 'call', title: local('اتصال وارد', 'Incoming call', 'آنے والی کال'), flags: [flag('identity', local('أنا موظف البنك', 'I work for your bank', 'میں بینک کا ملازم ہوں'), local('الادعاء ليس إثبات هوية', 'A claim is not proof of identity', 'دعویٰ شناخت کا ثبوت نہیں')), otp] },
  { kind: 'social', title: local('منشور عام', 'Public post', 'عوامی پوسٹ'), flags: [flag('phone', local('رقمي: 05X XXX XXXX', 'My number: 05X XXX XXXX', 'میرا نمبر: 05X XXX XXXX'), local('الرقم العلني قد يُستغل للاحتيال', 'A public number can be exploited by scammers', 'عام نمبر دھوکے میں استعمال ہو سکتا ہے')), flag('data', local('اسمي وعنواني للجميع', 'My name and address, for everyone', 'میرا نام اور پتہ سب کے لیے'), local('البيانات الشخصية تساعد على انتحال هويتك', 'Personal details can enable impersonation', 'ذاتی معلومات سے آپ کی نقالی ہو سکتی ہے'))] },
  { kind: 'sms', title: local('رسالة جديدة', 'New message', 'نیا پیغام'), linkQuestion: true, flags: [unknown, link('short.example/a7')] },
  { kind: 'whatsapp', title: friend, linkQuestion: true, flags: [flag('style', local('عزيزي العميل العزيز، افتح فوراً', 'Dear valued customer, open immediately', 'محترم گاہک، فوراً کھولیں'), local('أسلوب لا يشبه صديقك', 'This does not sound like your friend', 'یہ دوست کا انداز نہیں')), link('reward.example/claim')] },
  { kind: 'wifi', title: local('الشبكات المتاحة', 'Available networks', 'دستیاب نیٹ ورک'), flags: [flag('open', local('📶 Free_WiFi — مفتوحة', '📶 Free_WiFi — open', '📶 Free_WiFi — کھلا'), local('الشبكة المفتوحة لا تضمن الخصوصية', 'An open network does not guarantee privacy', 'کھلا نیٹ ورک رازداری کی ضمانت نہیں')), flag('copy', local('📶 Free_WiFi_2 — مفتوحة', '📶 Free_WiFi_2 — open', '📶 Free_WiFi_2 — کھلا'), local('الاسم المألوف قد يخفي شبكة مزيّفة', 'A familiar name can hide a fake network', 'مانوس نام جعلی نیٹ ورک ہو سکتا ہے'))] },
  { kind: 'web', title: local('نشاط الحساب', 'Account activity', 'اکاؤنٹ کی سرگرمی'), flags: [flag('device', local('دخول من جهاز لا تعرفه', 'Sign-in from an unfamiliar device', 'اجنبی آلے سے لاگ ان'), local('راجع الجلسات وأمّن حسابك', 'Review sessions and secure your account', 'سیشن دیکھیں اور اکاؤنٹ محفوظ کریں')), flag('message', local('رسائل لم ترسلها أنت', 'Messages you did not send', 'پیغامات جو آپ نے نہیں بھیجے'), local('نشاط غير مصرح به؛ غيّر كلمة المرور', 'Unauthorized activity: change your password', 'غیر مجاز سرگرمی؛ پاس ورڈ بدلیں'))] },
  { kind: 'ad', title: local('فرصة استثمار', 'Investment offer', 'سرمایہ کاری کی پیشکش'), flags: [flag('profit', local('أرباح ضخمة مضمونة!', 'Huge guaranteed profits!', 'بڑے یقینی منافع!'), local('ضمان الأرباح الكبيرة علامة احتيال', 'Guaranteed high returns are a scam signal', 'بڑے یقینی منافع دھوکے کی علامت ہیں')), flag('speed', local('ضاعف مالك خلال أيام', 'Double your money in days', 'چند دن میں رقم دوگنی'), local('وعد غير واقعي خلال فترة قصيرة', 'An unrealistic promise in a short time', 'کم وقت میں غیر حقیقی وعدہ'))] },
  { kind: 'ad', title: local('عرض خاص', 'Special offer', 'خاص پیشکش'), flags: [urgency, flag('payment', local('حوّل الآن واربح عشرة أضعاف', 'Transfer now, get ten times back', 'اب رقم بھیجیں، دس گنا پائیں'), local('طلب تحويل مع وعد غير واقعي', 'Transfer request with an unrealistic promise', 'غیر حقیقی وعدے کے ساتھ رقم طلب کرنا'))] },
  { kind: 'receipt', title: local('إيصال تحويل', 'Transfer receipt', 'رقم منتقلی کی رسید'), flags: [flag('reference', local('مرجع العملية: DEMO-148', 'Reference: DEMO-148', 'حوالہ: DEMO-148'), local('احتفظ بمرجع التحويل وأبلغ البنك فوراً', 'Keep the reference and contact the bank immediately', 'حوالہ محفوظ کریں اور بینک کو فوراً بتائیں')), flag('seller', local('البائع لم يعد يرد', 'The seller no longer replies', 'فروخت کنندہ جواب نہیں دیتا'), local('احتفظ بالمحادثة وأبلغ الجهات المختصة', 'Keep the conversation and report to authorities', 'گفتگو محفوظ کریں اور حکام کو اطلاع دیں'))] },
  { kind: 'whatsapp', title: local('سجل المحادثة', 'Conversation history', 'گفتگو کا ریکارڈ'), flags: [flag('reference', local('تم التحويل • DEMO-148', 'Transfer sent • DEMO-148', 'رقم بھیجی گئی • DEMO-148'), local('مرجع العملية دليل مهم', 'The transaction reference is evidence', 'لین دین کا حوالہ اہم ثبوت ہے')), flag('delete', local('احذف محادثتنا', 'Delete our conversation', 'ہماری گفتگو مٹا دو'), local('لا تحذف الأدلة؛ احتفظ بالرسائل', 'Do not delete evidence; keep the messages', 'ثبوت نہ مٹائیں؛ پیغامات محفوظ رکھیں'))] },
  { kind: 'qr', title: local('امسح واربح', 'Scan to win', 'اسکین کریں اور جیتیں'), linkQuestion: true, flags: [flag('code', local('▦ رمز الجائزة', '▦ Prize code', '▦ انعام کا کوڈ'), local('وجهة الرمز مخفية؛ افحص العنوان أولاً', 'The destination is hidden; check the address first', 'منزل پوشیدہ ہے؛ پہلے پتہ دیکھیں')), flag('prize', local('جائزة تنتظرك!', 'A prize is waiting!', 'انعام آپ کا منتظر ہے!'), local('وعد بجائزة بلا مشاركة', 'A prize you never entered for', 'بغیر شرکت کے انعام'))] },
  { kind: 'call', title: local('اتصال للعائلة', 'Family call', 'خاندان کی کال'), flags: [flag('identity', local('أنا قريبك، هذا رقمي الجديد', 'I’m your relative, this is my new number', 'میں رشتہ دار ہوں، یہ نیا نمبر ہے'), local('تحقق باتصال مستقل بالرقم المعروف', 'Verify independently using their known number', 'معلوم نمبر پر خود تصدیق کریں')), flag('money', local('أحتاج تحويل مال فوراً', 'I need money transferred immediately', 'فوراً رقم بھیجیں'), local('استغلال العاطفة والاستعجال', 'Emotional pressure and urgency', 'جذباتی دباؤ اور جلدی'))] },
  { kind: 'card', title: local('لحظة قرار', 'A moment to decide', 'فیصلے کا لمحہ'), flags: [flag('message', local('✉ رسالة • رابط • طلب مالي', '✉ Message • link • money request', '✉ پیغام • لنک • رقم کا مطالبہ'), local('توقف قبل اتخاذ أي إجراء', 'Pause before taking any action', 'عمل سے پہلے رکیں')), flag('source', local('🛡 المصدر والهوية', '🛡 Source & identity', '🛡 ذریعہ اور شناخت'), local('تحقق عبر قناة رسمية تصل إليها بنفسك', 'Verify through an official channel you reach yourself', 'سرکاری ذریعے سے خود تصدیق کریں'))] },
  { kind: 'sms', title: local('تهانينا! جائزة مالية', 'Congratulations! Cash prize', 'مبارک ہو! نقد انعام'), linkQuestion: true, flags: [link('prize.example/win'), flag('deadline', local('خلال 10 دقائق وإلا تخسر', 'Within 10 minutes or you lose', 'دس منٹ میں ورنہ انعام ختم'), local('مهلة قصيرة تضغط عليك', 'A short deadline pressures you', 'کم وقت کا دباؤ')), flag('bank', local('أدخل بيانات البنك ورمز OTP', 'Enter bank details and OTP', 'بینک کی معلومات اور OTP دیں'), local('طلب أسرار بنكية لاستلام جائزة', 'Bank secrets requested to claim a prize', 'انعام کے لیے بینک کے راز مانگنا'))] },
  { kind: 'ad', title: local('توفير العمالة المساعدة', 'Domestic-worker recruitment', 'گھریلو ملازمین کی بھرتی'), flags: [flag('company', local('شركة خدمات منزلية معتمدة', 'Licensed home services company', 'منظور شدہ گھریلو خدمات کی کمپنی'), local('يمكن انتحال اسم شركة حقيقية', 'A real company’s name can be impersonated', 'اصلی کمپنی کے نام کی نقالی ہو سکتی ہے')), flag('advance', local('ادفع مقدماً لإتمام الإجراءات', 'Pay upfront to complete the process', 'کارروائی کے لیے پیشگی ادائیگی'), local('تحقق من الشركة والإعلان قبل الدفع', 'Verify the company and ad before paying', 'ادائیگی سے پہلے کمپنی اور اشتہار چیک کریں'))] },
  { kind: 'ad', title: local('تأمين المركبات', 'Vehicle insurance', 'گاڑی کا بیمہ'), flags: [flag('price', local('تأمين بسعر أقل بكثير!', 'Insurance at a far lower price!', 'بہت کم قیمت پر بیمہ!'), local('السعر المنخفض جداً قد يكون طُعماً', 'An unusually low price can be bait', 'بہت کم قیمت لالچ ہو سکتی ہے')), flag('company', local('شركة تأمين • عرض خاص', 'Insurance company • special offer', 'بیمہ کمپنی • خاص پیشکش'), local('تحقق من اعتماد الشركة والعرض رسمياً', 'Confirm the company and offer through official channels', 'کمپنی اور پیشکش کی سرکاری تصدیق کریں'))] },
];

const KIDS: Scene[] = [
  { kind: 'whatsapp', title: game, flags: [unknown, flag('address', local('ما اسمك وأين بيتك؟', 'What’s your name and home address?', 'نام اور گھر کا پتہ کیا ہے؟'), local('اسمك وعنوانك معلومات خاصة', 'Your name and address are private', 'نام اور پتہ نجی معلومات ہیں'))] },
  { kind: 'whatsapp', title: friend, flags: [password, flag('account', local('سألعب بحسابك', 'I’ll play using your account', 'تمہارے اکاؤنٹ سے کھیلوں گا'), local('من يدخل حسابك يتصرف باسمك', 'Someone using your account acts as you', 'اکاؤنٹ استعمال کرنے والا آپ کے نام سے کام کرتا ہے'))] },
  { kind: 'sms', title: local('لقد ربحت جائزة!', 'You won a prize!', 'آپ انعام جیت گئے!'), linkQuestion: true, flags: [flag('prize', local('جائزتك جاهزة', 'Your prize is ready', 'آپ کا انعام تیار ہے'), local('لم تشترك في مسابقة', 'You did not enter a contest', 'آپ نے مقابلے میں حصہ نہیں لیا')), link('gift.example/tap')] },
  { kind: 'social', title: local('مجموعة المدرسة', 'School group', 'اسکول گروپ'), flags: [flag('photo', local('▧ صورتك منشورة دون إذن', '▧ Your photo posted without permission', '▧ اجازت کے بغیر آپ کی تصویر'), local('نشر الصور دون إذن مؤذٍ', 'Posting photos without permission is harmful', 'بغیر اجازت تصویر ڈالنا نقصان دہ ہے')), flag('bullying', local('تعليقات تضحك عليك', 'Comments making fun of you', 'آپ کا مذاق اڑانے والے تبصرے'), local('هذا تنمّر؛ أخبر أهلك أو معلمك', 'This is bullying; tell family or a teacher', 'یہ بُلیئنگ ہے؛ خاندان یا استاد کو بتائیں'))] },
  { kind: 'whatsapp', title: local('رسالة خاصة', 'Private message', 'نجی پیغام'), flags: [flag('photo', local('أرسل صورتك', 'Send your photo', 'اپنی تصویر بھیجیں'), local('لا ترسل صورتك لغريب', 'Do not send your photo to a stranger', 'اجنبی کو تصویر نہ دیں')), secret] },
  { kind: 'social', title: game, flags: [unknown, flag('request', local('طلب صداقة من لاعب جديد', 'Friend request from a new player', 'نئے کھلاڑی کی دوستی کی درخواست'), local('لا تعرفه في الحياة؛ أخبر عائلتك', 'You do not know them offline; tell family', 'اصل زندگی میں نہیں جانتے؛ خاندان کو بتائیں'))] },
  { kind: 'whatsapp', title: game, flags: [flag('school', local('ما اسم مدرستك؟', 'What is your school called?', 'اسکول کا نام کیا ہے؟'), local('اسم المدرسة يكشف مكانك', 'Your school name can reveal your location', 'اسکول کا نام جگہ بتا سکتا ہے')), flag('time', local('متى تخرج من المدرسة؟', 'What time do you leave school?', 'اسکول سے کب نکلتے ہو؟'), local('لا يحتاج اللاعب معرفة جدولك', 'A player does not need your schedule', 'کھلاڑی کو آپ کا وقت جاننے کی ضرورت نہیں'))] },
  { kind: 'sms', title: local('رسالة مزعجة', 'An upsetting message', 'پریشان کن پیغام'), flags: [flag('threat', local('رسالة تجعلك خائفاً', 'A message that makes you afraid', 'پیغام جس سے ڈر لگے'), local('الخوف إشارة لطلب المساعدة', 'Feeling afraid is a reason to seek help', 'ڈر لگے تو مدد لیں')), secret] },
  { kind: 'whatsapp', title: local('مجموعة اللعب', 'Gaming group', 'کھیل کا گروپ'), flags: [unknown, flag('alone', local('تعال نتحدث وحدنا بعيداً عن المجموعة', 'Let’s talk alone, away from the group', 'گروپ سے الگ اکیلے بات کریں'), local('العزل عن المجموعة علامة خطر؛ أخبر عائلتك', 'Isolation is a danger sign; tell family', 'اکیلا کرنا خطرے کی علامت ہے؛ خاندان کو بتائیں'))] },
  { kind: 'card', title: local('درعي الرقمي', 'My digital shield', 'میری ڈیجیٹل ڈھال'), flags: [flag('privacy', local('🔒 معلوماتي', '🔒 My information', '🔒 میری معلومات'), local('احتفظ بمعلوماتك لنفسك', 'Keep your information private', 'معلومات خفیہ رکھیں')), flag('family', local('🏠 عائلتي', '🏠 My family', '🏠 میرا خاندان'), local('أخبر عائلتك عن أي شيء غريب', 'Tell your family about anything unusual', 'غیر معمولی بات خاندان کو بتائیں'))] },
];

// Braces reference real inline elements; they are inert until inspection is unlocked.
const ADULT_CONTENT: Partial<Scene>[] = [
  { artwork: '🌐' },
  { body: local('{password}. {trust}', '{password}. {trust}', '{password}۔ {trust}') },
  { sender: 'Noor', body: local('شوف الهدية التي وصلتنا: {link}', 'Look at the gift we received: {link}', 'یہ تحفہ دیکھیں: {link}') },
  { artwork: '🔑' },
  { sender: 'support@accounts.example', body: local('لتأكيد حسابك، {password} ثم افتح صفحة التحقق.', 'To confirm your account, {password}, then open the verification page.', 'اکاؤنٹ کی تصدیق کے لیے {password}، پھر تصدیقی صفحہ کھولیں۔') },
  { sender: 'AD-BANK-UPD', body: local('يرجى {data} {urgent} من خلال الرابط التالي: {link}', 'Please {data} {urgent} through the following link: {link}', '{urgent} اس لنک سے {data}: {link}') },
  { body: local('«{identity}. لتأكيد العملية، {otp}»', '“{identity}. To confirm the transaction, {otp}.”', '«{identity}۔ تصدیق کے لیے {otp}»') },
  { sender: 'Community_User', artwork: '📍', body: local('أشارك معكم {phone}، و{data}.', 'I am sharing {phone}, and {data}.', 'میں شیئر کر رہا ہوں {phone}، اور {data}۔') },
  { body: local('افتح الرابط لمشاهدة التفاصيل: {link}', 'Open this link to see the details: {link}', 'تفصیلات کے لیے لنک کھولیں: {link}') },
  { body: local('{style}: {link}', '{style}: {link}', '{style}: {link}') },
  {}, {},
  { sender: 'Investment_Offers', artwork: '📈', body: local('{profit} {speed}.', '{profit} {speed}.', '{profit} {speed}۔') },
  { sender: 'Daily_Offers', artwork: '🎁', body: local('{urgent} {payment}.', '{urgent} {payment}.', '{urgent} {payment}۔') },
  {},
  { body: local('{reference}. {delete}', '{reference}. {delete}', '{reference}۔ {delete}') },
  {},
  { body: local('«{identity}. {money}»', '“{identity}. {money}.”', '«{identity}۔ {money}»') },
  { artwork: '💭' },
  { sender: 'AD-PRIZE', body: local('تهانينا! تم اختيارك للفوز بجائزة مالية كبيرة. لاستلام الجائزة، اضغط على {link} ثم {bank} {deadline}.', 'Congratulations! You have been selected to win a large cash prize. To claim it, open {link}. {bank}. {deadline}.', 'مبارک ہو! بڑا نقد انعام جیت گئے۔ لینے کے لیے {link} کھولیں۔ {bank}۔ {deadline}۔') },
  { sender: 'Home_Services', artwork: '🏠', body: local('{company}. {advance}.', '{company}. {advance}.', '{company}۔ {advance}۔') },
  { sender: 'Auto_Deals', artwork: '🚙', body: local('{company}: {price}', '{company}: {price}', '{company}: {price}') },
];
const KIDS_CONTENT: Partial<Scene>[] = [
  { sender: 'Player_07', body: local('مرحباً، {address}', 'Hi! {address}', 'سلام! {address}') },
  { body: local('{password}، {account}.', '{password}, {account}.', '{password}، {account}۔') },
  { sender: 'AD-GIFT', body: local('لقد ربحت! {prize}. اضغط هنا: {link}', 'You won! {prize}. Tap here: {link}', 'آپ جیت گئے! {prize}۔ یہاں دبائیں: {link}') },
  { sender: 'School_Group', artwork: '🖼️', body: local('{photo}. ظهرت أيضاً {bullying}.', '{photo}. There are also {bullying}.', '{photo}۔ ساتھ میں {bullying}۔') },
  { body: local('{photo}. {secret}.', '{photo}. {secret}.', '{photo}۔ {secret}۔') },
  { sender: 'Player_07', artwork: '🎮', body: local('أرسل إليك {request}.', 'You received a {request}.', 'آپ کو {request} ملا۔') },
  { body: local('{school} {time}', '{school} {time}', '{school} {time}') },
  { body: local('{threat}… {secret}.', '{threat}… {secret}.', '{threat}… {secret}۔') },
  { sender: 'Player_07', body: local('{alone}.', '{alone}.', '{alone}۔') },
  { artwork: '🛡️' },
];

export function getScene(quizType: QuizType, questionNumber: number): Scene {
  const scene = (quizType === 'kids' ? KIDS : ADULT)[questionNumber - 1];
  if (!scene) throw new RangeError(`No scene for ${quizType} question ${questionNumber}`);
  return { ...scene, ...(quizType === 'kids' ? KIDS_CONTENT : ADULT_CONTENT)[questionNumber - 1] };
}
