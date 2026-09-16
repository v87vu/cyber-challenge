/**
 * محتوى المسابقة.
 * النص العربي وإجاباته الصحيحة كما وردت من الجهة المنظمة — دون أي تعديل.
 * الحقل `en` ترجمة مضافة، والحقل `explanation` شرح تعليمي يظهر بعد الإجابة فقط.
 */

export type Lang = 'ar' | 'en';

export type Copy = {
  text: string;
  options: [string, string, string, string];
  explanation: string;
};

export type Question = {
  n: number;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  correct: 0 | 1 | 2 | 3; // 0=أ 1=ب 2=ج 3=د
  ar: Copy;
  en: Copy;
};

export type Level = {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  from: number;
  to: number;
  color: string;
  glow: string;
  ar: string;
  en: string;
};

export const LEVELS: Level[] = [
  { id: 1, from: 1, to: 5, color: '#22c55e', glow: '34,197,94', ar: 'مبتدئ', en: 'Beginner' },
  { id: 2, from: 6, to: 10, color: '#3b82f6', glow: '59,130,246', ar: 'واعٍ', en: 'Aware' },
  { id: 3, from: 11, to: 15, color: '#f59e0b', glow: '245,158,11', ar: 'متقدم', en: 'Advanced' },
  { id: 4, from: 16, to: 19, color: '#ef4444', glow: '239,68,68', ar: 'خبير', en: 'Expert' },
  { id: 5, from: 20, to: 20, color: '#a855f7', glow: '168,85,247', ar: 'بطل الوعي الرقمي', en: 'Digital Awareness Champion' },
  { id: 6, from: 21, to: 22, color: '#0f766e', glow: '15,118,110', ar: 'مستوى الخبير الرقمي', en: 'Digital Expert' },
];

export const QUESTIONS: Question[] = [
  {
    n: 1, level: 1, correct: 1,
    ar: {
      text: 'ما المقصود بالجريمة الإلكترونية؟',
      options: [
        'استخدام الإنترنت للترفيه',
        'جريمة تُرتكب باستخدام التقنية أو شبكة الإنترنت',
        'شراء المنتجات عبر الإنترنت',
        'استخدام وسائل التواصل الاجتماعي',
      ],
      explanation:
        'الجريمة الإلكترونية هي أي فعل مُجرَّم يُرتكب باستخدام التقنية أو الشبكة، مثل الاحتيال والتصيد وانتحال الشخصية وسرقة البيانات.',
    },
    en: {
      text: 'What is meant by cybercrime?',
      options: [
        'Using the internet for entertainment',
        'A crime committed using technology or the internet',
        'Buying products online',
        'Using social media',
      ],
      explanation:
        'Cybercrime is any criminal act committed using technology or a network — fraud, phishing, impersonation, data theft. Using the internet is not itself a crime.',
    },
  },
  {
    n: 2, level: 1, correct: 2,
    ar: {
      text: 'هل من الآمن مشاركة كلمة المرور الخاصة بحسابك مع الآخرين؟',
      options: ['نعم', 'نعم مع الأصدقاء فقط', 'لا', 'نعم إذا كان الشخص معروفاً'],
      explanation:
        'كلمة المرور مسؤولية شخصية لا تُشارك مع أحد، مهما كانت الثقة. أي تصرف يقع من حسابك يُنسب إليك أنت.',
    },
    en: {
      text: 'Is it safe to share your account password with others?',
      options: ['Yes', 'Yes, with friends only', 'No', 'Yes, if the person is known to me'],
      explanation:
        'A password is a personal responsibility — never share it, no matter how much you trust someone. Anything done from your account is attributed to you.',
    },
  },
  {
    n: 3, level: 1, correct: 1,
    ar: {
      text: 'هل يمكن أن يكون الرابط المرسل إليك من شخص تعرفه خطيراً؟',
      options: ['لا', 'نعم', 'فقط إذا كان مجهولاً', 'فقط في البريد الإلكتروني'],
      explanation:
        'نعم. الحسابات المخترقة تُستخدم لإرسال روابط ضارة إلى قائمة الأصدقاء، لأن الرسالة من شخص معروف تبدو موثوقة أكثر.',
    },
    en: {
      text: 'Can a link sent to you by someone you know be dangerous?',
      options: ['No', 'Yes', 'Only if it is from a stranger', 'Only in email'],
      explanation:
        'Yes. Compromised accounts are used to send malicious links to the friend list, precisely because a message from someone familiar looks more trustworthy.',
    },
  },
  {
    n: 4, level: 1, correct: 2,
    ar: {
      text: 'ما إحدى أفضل الطرق لحماية حساباتك؟',
      options: [
        'استخدام كلمة مرور واحدة لجميع الحسابات',
        'كتابة كلمة المرور في الهاتف',
        'استخدام كلمة مرور قوية وتفعيل التحقق بخطوتين',
        'مشاركة كلمة المرور مع شخص تثق به',
      ],
      explanation:
        'التحقق بخطوتين يجعل كلمة المرور وحدها غير كافية للدخول إلى حسابك، وهو أقوى إجراء حماية يمكنك تفعيله اليوم.',
    },
    en: {
      text: 'What is one of the best ways to protect your accounts?',
      options: [
        'Using one password for all accounts',
        'Writing the password down in your phone',
        'Using a strong password and enabling two-step verification',
        'Sharing the password with someone you trust',
      ],
      explanation:
        'Two-step verification means a stolen password alone is not enough to get in. It is the single strongest protection you can switch on today.',
    },
  },
  {
    n: 5, level: 1, correct: 1,
    ar: {
      text: 'ما المقصود بالتصيد الإلكتروني؟',
      options: [
        'شراء المنتجات عبر الإنترنت',
        'محاولة خداع الشخص للحصول على بياناته أو أمواله',
        'حماية الحسابات',
        'تحديث التطبيقات',
      ],
      explanation:
        'التصيّد هو خداع الضحية عبر رسالة أو رابط أو مكالمة تبدو رسمية، بهدف الحصول على بياناته أو أمواله.',
    },
    en: {
      text: 'What is meant by phishing?',
      options: [
        'Buying products online',
        'Trying to deceive a person to obtain their data or money',
        'Protecting accounts',
        'Updating applications',
      ],
      explanation:
        'Phishing deceives the victim through a message, link or call that looks official, in order to obtain their data or their money.',
    },
  },
  {
    n: 6, level: 2, correct: 2,
    ar: {
      text: 'وصلتك رسالة تقول: «يرجى تحديث بيانات حسابك البنكي فوراً من خلال الرابط التالي». ماذا تفعل؟',
      options: [
        'أضغط على الرابط مباشرة',
        'أرسل الرسالة لصديقي',
        'لا أضغط على الرابط وأتحقق من البنك عبر قنواته الرسمية',
        'أدخل بياناتي ثم أتأكد',
      ],
      explanation:
        'البنوك لا تطلب تحديث البيانات عبر روابط في الرسائل. تحقّق دائماً عبر التطبيق الرسمي أو الرقم المطبوع على بطاقتك، لا عبر الرابط نفسه.',
    },
    en: {
      text: 'You receive a message: “Please update your bank account details immediately through the following link.” What do you do?',
      options: [
        'Click the link straight away',
        'Forward the message to a friend',
        'Do not click the link, and verify with the bank through its official channels',
        'Enter my details, then check afterwards',
      ],
      explanation:
        'Banks do not ask you to update details through links in messages. Always verify through the official app or the number printed on your card — never through the link itself.',
    },
  },
  {
    n: 7, level: 2, correct: 2,
    ar: {
      text: 'شخص اتصل بك وادعى أنه موظف في البنك وطلب منك رمز OTP. ماذا تفعل؟',
      options: [
        'أعطيه الرمز',
        'أعطيه الرمز إذا كان يعرف اسمي',
        'أرفض مشاركة الرمز وأنهي الاتصال وأتواصل مع البنك رسمياً',
        'أرسل له صورة البطاقة',
      ],
      explanation:
        'لا يوجد موظف بنك حقيقي يطلب رمز OTP. معرفة المحتال لاسمك أو بعض بياناتك ليست دليل مصداقية — هذه معلومات يسهل الحصول عليها.',
    },
    en: {
      text: 'Someone calls claiming to be a bank employee and asks for your OTP. What do you do?',
      options: [
        'Give them the code',
        'Give them the code if they know my name',
        'Refuse to share the code, end the call, and contact the bank officially',
        'Send them a photo of my card',
      ],
      explanation:
        'No genuine bank employee asks for an OTP. A fraudster knowing your name or some of your details is not proof of legitimacy — that information is easy to obtain.',
    },
  },
  {
    n: 8, level: 2, correct: 1,
    ar: {
      text: 'لماذا قد يكون نشر رقم هاتفك وبياناتك الشخصية بشكل علني خطراً؟',
      options: [
        'لا توجد أي خطورة',
        'يمكن استغلالها في الاحتيال أو انتحال الشخصية',
        'لأنها تجعل الإنترنت أبطأ',
        'لأنها تمنع وصول الرسائل',
      ],
      explanation:
        'بياناتك المنشورة هي مادة خام للمحتال: يستخدمها ليبدو مقنعاً عند الاتصال بك، أو لانتحال شخصيتك أمام غيرك.',
    },
    en: {
      text: 'Why might publicly posting your phone number and personal details be dangerous?',
      options: [
        'There is no danger at all',
        'They can be exploited for fraud or impersonation',
        'Because it makes the internet slower',
        'Because it blocks messages from arriving',
      ],
      explanation:
        'Your published details are raw material for a fraudster: used to sound convincing when they call you, or to impersonate you to others.',
    },
  },
  {
    n: 9, level: 2, correct: 2,
    ar: {
      text: 'وصلتك رسالة من رقم مجهول تحتوي على رابط. ما التصرف الأفضل؟',
      options: [
        'فتح الرابط لمعرفة محتواه',
        'إعادة إرسال الرابط لصديق',
        'عدم فتحه والتحقق من مصدر الرسالة',
        'إدخال رقم الهاتف فقط',
      ],
      explanation:
        'مجرد فتح الرابط قد يكفي لتسجيل بياناتك أو تنفيذ برمجية ضارة. الفضول هو ما يعتمد عليه المحتال.',
    },
    en: {
      text: 'You receive a message from an unknown number containing a link. What is the best action?',
      options: [
        'Open the link to see what it contains',
        'Forward the link to a friend',
        'Do not open it, and verify the source of the message',
        'Enter only my phone number',
      ],
      explanation:
        'Merely opening the link can be enough to log your data or run malicious code. Curiosity is exactly what the fraudster is counting on.',
    },
  },
  {
    n: 10, level: 2, correct: 2,
    ar: {
      text: 'أرسل لك صديقك رسالة تحتوي على رابط غريب، وأنت متأكد أن أسلوب الكتابة ليس أسلوبه. ماذا تفعل؟',
      options: [
        'أفتح الرابط',
        'أطلب منه إرسال الرابط مرة أخرى',
        'أتواصل معه بطريقة أخرى للتأكد من أن حسابه لم يُخترق',
        'أرسل الرابط إلى الآخرين',
      ],
      explanation:
        'تغيّر أسلوب الكتابة مؤشر اختراق. تواصل معه عبر قناة مختلفة — لأن الرد داخل الحساب المخترق قد يأتي من المحتال نفسه.',
    },
    en: {
      text: 'A friend sends you a message with a strange link, and you are certain the writing style is not theirs. What do you do?',
      options: [
        'Open the link',
        'Ask them to send the link again',
        'Contact them another way to confirm their account has not been hacked',
        'Send the link on to others',
      ],
      explanation:
        'A change in writing style is a hack indicator. Reach them through a different channel — a reply inside the compromised account may come from the fraudster.',
    },
  },
  {
    n: 11, level: 3, correct: 1,
    ar: {
      text: 'هل استخدام شبكة Wi‑Fi عامة يعني أن بياناتك آمنة؟',
      options: [
        'نعم دائماً',
        'لا، يجب الحذر خصوصاً عند إجراء معاملات حساسة',
        'نعم إذا كانت مجانية',
        'نعم إذا كانت الشبكة سريعة',
      ],
      explanation:
        'الشبكة العامة قد تكون مراقَبة أو مزيّفة بالكامل. أجّل المعاملات البنكية وتسجيل الدخول الحساس حتى تعود إلى شبكة تثق بها.',
    },
    en: {
      text: 'Does using a public Wi‑Fi network mean your data is safe?',
      options: [
        'Yes, always',
        'No — be careful, especially with sensitive transactions',
        'Yes, if it is free',
        'Yes, if the network is fast',
      ],
      explanation:
        'A public network may be monitored, or entirely fake. Postpone banking and sensitive logins until you are back on a network you trust.',
    },
  },
  {
    n: 12, level: 3, correct: 1,
    ar: {
      text: 'اكتشفت أن حسابك على وسائل التواصل الاجتماعي تعرض للاختراق. ما أول إجراء مناسب؟',
      options: [
        'تجاهل الموضوع',
        'تغيير كلمة المرور وتأمين الحساب وتفعيل التحقق بخطوتين',
        'حذف الهاتف',
        'إرسال كلمة المرور لصديق',
      ],
      explanation:
        'السرعة مهمة: استعِد السيطرة أولاً بتغيير كلمة المرور وتفعيل التحقق بخطوتين، ثم أخرِج الأجهزة غير المعروفة ونبّه من تواصل معهم المحتال باسمك.',
    },
    en: {
      text: 'You discover your social media account has been hacked. What is the first appropriate action?',
      options: [
        'Ignore it',
        'Change the password, secure the account, and enable two-step verification',
        'Delete the phone',
        'Send the password to a friend',
      ],
      explanation:
        'Speed matters: regain control first by changing the password and enabling two-step verification, then sign out unknown devices and warn anyone the fraudster contacted in your name.',
    },
  },
  {
    n: 13, level: 3, correct: 2,
    ar: {
      text: 'شخص يعرض عليك استثماراً ويعدك بأرباح كبيرة ومضمونة خلال فترة قصيرة. ماذا تفعل؟',
      options: [
        'أحول المال فوراً',
        'أطلب منه رقم حسابه',
        'أتحقق من الجهة والترخيص والمعلومات قبل اتخاذ أي قرار',
        'أرسل العرض لأصدقائي',
      ],
      explanation:
        '«أرباح مضمونة» عبارة لا وجود لها في الاستثمار الحقيقي. تحقّق من ترخيص الجهة لدى الجهة الرقابية المختصة قبل أي تحويل.',
    },
    en: {
      text: 'Someone offers you an investment promising large, guaranteed profits within a short period. What do you do?',
      options: [
        'Transfer the money immediately',
        'Ask them for their account number',
        'Verify the entity, its licence and the information before making any decision',
        'Send the offer to my friends',
      ],
      explanation:
        '“Guaranteed profits” does not exist in real investing. Verify the entity’s licence with the competent regulator before transferring anything.',
    },
  },
  {
    n: 14, level: 3, correct: 1,
    ar: {
      text: 'أي من التالي يعتبر مؤشراً على احتمال وجود إعلان احتيالي؟',
      options: [
        'معلومات واضحة عن الجهة',
        'طلب تحويل مبلغ بشكل عاجل مع وعود غير منطقية',
        'وجود عنوان رسمي',
        'وجود معلومات يمكن التحقق منها',
      ],
      explanation:
        'الاستعجال + وعد غير منطقي = تركيبة الاحتيال الكلاسيكية. الضغط الزمني هدفه منعك من التفكير والتحقق.',
    },
    en: {
      text: 'Which of the following indicates a possibly fraudulent advertisement?',
      options: [
        'Clear information about the entity',
        'An urgent transfer request with unrealistic promises',
        'The presence of an official address',
        'The presence of verifiable information',
      ],
      explanation:
        'Urgency plus an unrealistic promise is the classic fraud combination. The time pressure exists to stop you thinking and verifying.',
    },
  },
  {
    n: 15, level: 3, correct: 2,
    ar: {
      text: 'حولت مبلغاً مالياً إلى شخص واكتشفت لاحقاً أنك تعرضت للاحتيال. ماذا تفعل؟',
      options: [
        'أنتظر عدة أيام',
        'أحذف المحادثة',
        'أتواصل فوراً مع البنك وأحتفظ بالأدلة وأبلغ الجهات المختصة',
        'أتواصل مع المحتال مرة أخرى',
      ],
      explanation:
        'الدقائق الأولى هي الأهم — التبليغ السريع للبنك قد يوقف الحوالة. احتفظ بكل الرسائل وأرقام العمليات وبلّغ الجهات المختصة.',
    },
    en: {
      text: 'You transferred money to someone and later discovered you were defrauded. What do you do?',
      options: [
        'Wait a few days',
        'Delete the conversation',
        'Contact the bank immediately, keep the evidence, and report to the authorities',
        'Contact the fraudster again',
      ],
      explanation:
        'The first minutes matter most — reporting quickly to the bank can stop the transfer. Keep every message and transaction reference, and report to the authorities.',
    },
  },
  {
    n: 16, level: 4, correct: 1,
    ar: {
      text: 'لماذا لا يُنصح بحذف المحادثات والرسائل المتعلقة بعملية الاحتيال؟',
      options: [
        'لأنها تستهلك مساحة الهاتف',
        'لأنها قد تحتوي على أدلة ومعلومات مهمة للتحقيق',
        'لأنها تمنع وصول الرسائل',
        'لا يوجد سبب',
      ],
      explanation:
        'المحادثة دليل. حذفها يضعف التحقيق ويقلّل فرص استرداد المبلغ أو الوصول إلى المحتال. صوّرها واحتفظ بها كما هي.',
    },
    en: {
      text: 'Why is deleting conversations and messages related to a fraud not advisable?',
      options: [
        'Because they take up phone storage',
        'Because they may contain evidence and information important to the investigation',
        'Because they block messages from arriving',
        'There is no reason',
      ],
      explanation:
        'The conversation is evidence. Deleting it weakens the investigation and reduces the chance of recovering the money or identifying the fraudster. Screenshot it and keep it intact.',
    },
  },
  {
    n: 17, level: 4, correct: 1,
    ar: {
      text: 'شاهدت رمز QR في إعلان يدعوك إلى الحصول على جائزة. هل مسحه آمن دائماً؟',
      options: [
        'نعم',
        'لا، فقد يقود إلى موقع أو صفحة احتيالية',
        'نعم إذا كان الإعلان ملوناً',
        'نعم إذا كان بجانب شعار شركة',
      ],
      explanation:
        'رمز QR يخفي وجهته عنك تماماً، ويمكن لصق ملصق مزيّف فوق رمز حقيقي. تحقّق من العنوان الذي يظهر قبل فتحه.',
    },
    en: {
      text: 'You see a QR code in an advertisement inviting you to claim a prize. Is scanning it always safe?',
      options: [
        'Yes',
        'No — it may lead to a fraudulent website or page',
        'Yes, if the advertisement is colourful',
        'Yes, if it is next to a company logo',
      ],
      explanation:
        'A QR code hides its destination completely, and a fake sticker can be placed over a genuine code. Check the address that appears before opening it.',
    },
  },
  {
    n: 18, level: 4, correct: 1,
    ar: {
      text: 'تلقى أحد أصدقائك اتصالاً من شخص يدعي أنه أحد أفراد أسرته ويطلب تحويل مبلغ مالي بشكل عاجل. ما التصرف الصحيح؟',
      options: [
        'يحول المبلغ فوراً',
        'يتواصل معه عبر وسيلة أخرى للتأكد من هويته أولاً',
        'يرسل صورة بطاقته',
        'ينشر الرسالة على وسائل التواصل',
      ],
      explanation:
        'انتحال صفة قريب يعتمد على العاطفة والاستعجال. أغلِق واتصل بالشخص على رقمه المعروف لديك — الاتصال المستقل يكشف الحيلة فوراً.',
    },
    en: {
      text: 'A friend receives a call from someone claiming to be a family member, urgently asking for a money transfer. What is the correct action?',
      options: [
        'Transfer the amount immediately',
        'Contact the relative through another channel to verify their identity first',
        'Send a photo of their ID',
        'Post the message on social media',
      ],
      explanation:
        'Impersonating a relative relies on emotion and urgency. Hang up and call the person on the number you already have — an independent call exposes the trick immediately.',
    },
  },
  {
    n: 19, level: 4, correct: 2,
    ar: {
      text: 'ما التصرف الأكثر أماناً عند الشك في رسالة أو رابط أو طلب مالي؟',
      options: [
        'التصرف بسرعة قبل انتهاء العرض',
        'مشاركة الرسالة مع الآخرين',
        'التوقف والتحقق من المصدر عبر قناة رسمية قبل اتخاذ أي إجراء',
        'تجربة الرابط لمعرفة ما بداخله',
      ],
      explanation:
        'هذه هي القاعدة التي تختصر المسابقة كلها: توقف .. تحقق .. ثم تصرف. القناة الرسمية تعني قناة تصل إليها أنت، لا قناة يعطيها لك الطرف الآخر.',
    },
    en: {
      text: 'What is the safest action when you are suspicious of a message, a link, or a financial request?',
      options: [
        'Act quickly before the offer expires',
        'Share the message with others',
        'Stop and verify the source through an official channel before taking any action',
        'Try the link to see what is inside',
      ],
      explanation:
        'This is the rule the whole challenge comes down to: Stop, Verify, then Act. An official channel means one you reach yourself — not one the other party hands you.',
    },
  },
  {
    n: 20, level: 5, correct: 2,
    ar: {
      text: 'وصلتك رسالة تقول: «تهانينا! تم اختيارك للفوز بجائزة مالية كبيرة. لاستلام الجائزة، اضغط على الرابط وأدخل بياناتك البنكية ورمز التحقق OTP خلال 10 دقائق، وإلا ستفقد الجائزة». ماذا ستفعل؟',
      options: [
        'أضغط على الرابط بسرعة حتى لا أخسر الجائزة.',
        'أدخل بياناتي لكن لا أعطي رمز OTP.',
        'أتجاهل الرسالة، وأتحقق من الجهة عبر وسائلها الرسمية، ولا أشارك أي بيانات أو رموز سرية.',
        'أرسل الرسالة إلى أصدقائي للتأكد منها.',
      ],
      explanation:
        'اجتمعت في رسالة واحدة كل مؤشرات الاحتيال: جائزة لم تشترك فيها، رابط، طلب بيانات بنكية، رمز OTP، ومهلة عشر دقائق. الاستعجال نفسه هو الدليل.',
    },
    en: {
      text: 'You receive a message: “Congratulations! You have been selected to win a large cash prize. To claim it, click the link and enter your bank details and OTP within 10 minutes, or you will lose the prize.” What will you do?',
      options: [
        'Click the link quickly so I don’t lose the prize.',
        'Enter my details but not give the OTP.',
        'Ignore the message, verify with the entity through its official channels, and share no data or secret codes.',
        'Forward the message to my friends to check it.',
      ],
      explanation:
        'Every fraud indicator lands in one message: a prize you never entered, a link, a request for bank details, an OTP, and a ten-minute deadline. The urgency itself is the tell.',
    },
  },
  {
    n: 21, level: 6, correct: 2,
    ar: {
      text: 'رأيت إعلانًا على وسائل التواصل الاجتماعي يدّعي أنه تابع لشركة رسمية لتوفير العمالة المساعدة، ويطلب دفع مبلغ مقدمًا لإتمام الإجراءات، ثم تكتشف أن الإعلان يستخدم اسم الشركة للاحتيال. ماذا تفعل؟',
      options: [
        'أدفع المبلغ فورًا لأن الإعلان يدّعي أنه تابع لشركة رسمية',
        'أرسل بياناتي الشخصية لإتمام الإجراءات',
        'أتحقق من الشركة عبر قنواتها الرسمية وأتأكد من صحة الإعلان قبل الدفع',
        'أشارك الإعلان مع الآخرين للاستفادة من العرض',
      ],
      explanation:
        'المحتالون ينتحلون أسماء شركات حقيقية موثوقة. ذكر الاسم الرسمي في الإعلان ليس دليلاً — تحقق عبر قناة تصل إليها أنت بنفسك (الموقع الرسمي أو الرقم المعتمد) قبل أي دفع.',
    },
    en: {
      text: 'You see a social media ad claiming to belong to an official domestic-workers recruitment company, asking for an upfront payment to complete the procedures — then you discover the ad is using the company’s name fraudulently. What do you do?',
      options: [
        'Pay the amount immediately because the ad claims to be from an official company',
        'Send my personal details to complete the procedures',
        'Verify with the company through its official channels and confirm the ad is genuine before paying',
        'Share the ad with others so they can benefit from the offer',
      ],
      explanation:
        'Fraudsters impersonate real, trusted companies. An official name in an ad proves nothing — verify through a channel you reach yourself (the official website or approved number) before paying anything.',
    },
  },
  {
    n: 22, level: 6, correct: 1,
    ar: {
      text: 'رأيت إعلانًا على وسائل التواصل الاجتماعي عن شركة لتأمين المركبات، ويعرض سعرًا منخفضًا جدًا مقارنةً بالأسعار المعتادة. ما التصرف الصحيح؟',
      options: [
        'أشتري التأمين مباشرة للاستفادة من العرض',
        'أتأكد من أن الشركة والعرض معتمدان من خلال القنوات الرسمية قبل الدفع',
        'أتواصل مع المعلن وأرسل له بياناتي الشخصية',
        'أشارك الإعلان مع أصدقائي للاستفادة من العرض.',
      ],
      explanation:
        'السعر المنخفض جداً طُعم كلاسيكي، ووثيقة التأمين المزوّرة تعني أنك تقود بلا تأمين حقيقي. تحقق من اعتماد الشركة والعرض عبر القنوات الرسمية قبل الدفع.',
    },
    en: {
      text: 'You see a social media ad for a vehicle-insurance company offering a price far lower than usual. What is the correct action?',
      options: [
        'Buy the insurance right away to benefit from the offer',
        'Confirm the company and the offer are approved through official channels before paying',
        'Contact the advertiser and send them my personal details',
        'Share the ad with my friends to benefit from the offer.',
      ],
      explanation:
        'A far-too-low price is classic bait — and a forged insurance policy means driving with no real cover. Confirm the company and the offer through official channels before paying.',
    },
  },
];

export const LETTERS = { ar: ['أ', 'ب', 'ج', 'د'], en: ['A', 'B', 'C', 'D'] } as const;

export function levelOf(n: number): Level {
  return LEVELS.find((l) => n >= l.from && n <= l.to)!;
}

export const REWARDS = [
  { at: 5, ar: 'شهادة مشاركة', en: 'Certificate of Participation' },
  { at: 10, ar: 'دخول مرحلة متقدمة', en: 'Advance to a higher stage' },
  { at: 15, ar: 'شهادة تقدير', en: 'Certificate of Appreciation' },
  { at: 19, ar: 'التأهل للسؤال الذهبي', en: 'Qualify for the Golden Question' },
  { at: 22, ar: 'الجائزة الكبرى – بطل الوعي الرقمي', en: 'Grand Prize — Digital Awareness Champion' },
];

export function rewardFor(score: number) {
  let earned: { at: number; ar: string; en: string } | null = null;
  for (const r of REWARDS) if (score >= r.at) earned = r;
  return earned;
}

export const TOTAL = QUESTIONS.length;

/** لقب الشهادة: تقدير من 15 فأعلى، ومشاركة دون ذلك */
export function certificateTitle(score: number) {
  if (score >= TOTAL) return { ar: 'بطل الوعي الرقمي', en: 'Digital Awareness Champion' };
  if (score >= 15) return { ar: 'شهادة تقدير', en: 'Certificate of Appreciation' };
  return { ar: 'شهادة مشاركة', en: 'Certificate of Participation' };
}

/* ============ نسخة الأطفال (12–17): أسئلة الجهة كما وردت حرفياً ============ */

export const KIDS_LEVELS: Level[] = [
  { id: 1, from: 1, to: 3, color: '#22c55e', glow: '34,197,94', ar: 'مبتدئ', en: 'Beginner' },
  { id: 2, from: 4, to: 6, color: '#3b82f6', glow: '59,130,246', ar: 'واعٍ', en: 'Aware' },
  { id: 3, from: 7, to: 9, color: '#f59e0b', glow: '245,158,11', ar: 'متقدم', en: 'Advanced' },
  { id: 5, from: 10, to: 10, color: '#a855f7', glow: '168,85,247', ar: 'بطل الوعي الرقمي', en: 'Digital Awareness Champion' },
];

export const KIDS_QUESTIONS: Question[] = [
  {
    n: 1, level: 1, correct: 3,
    ar: {
      text: 'وأنت تلعب لعبة إلكترونية، طلب منك شخص لا تعرفه اسمك وعنوان بيتك. ماذا تفعل؟',
      options: ['أعطيه المعلومات', 'أعطيه اسم مدرستي', 'أسأله عن اسمه', 'لا أعطيه المعلومات وأخبر عائلتي'],
      explanation: 'اسمك وعنوانك معلومات خاصة لا يحتاجها أي لاعب. الشخص الطيب في اللعبة لا يسأل عنها أبداً — أخبر عائلتك دائماً.',
    },
    en: {
      text: 'While playing an online game, someone you don’t know asks for your name and home address. What do you do?',
      options: ['Give them the information', 'Give them my school’s name', 'Ask them their name', 'Don’t give the information and tell my family'],
      explanation: 'Your name and address are private — no player ever needs them. A good player never asks. Always tell your family.',
    },
  },
  {
    n: 2, level: 1, correct: 1,
    ar: {
      text: 'طلب منك صديقك كلمة المرور الخاصة بحسابك. ماذا تفعل؟',
      options: ['أعطيه كلمة المرور', 'لا أعطي كلمة المرور لأي شخص', 'أرسلها له في رسالة', 'أعطيه إياها ثم أغيرها'],
      explanation: 'كلمة المرور سرّ لك وحدك — حتى أعز أصدقائك. من يدخل بحسابك يتصرف باسمك أنت.',
    },
    en: {
      text: 'Your friend asks for your account password. What do you do?',
      options: ['Give them the password', 'Never give my password to anyone', 'Send it in a message', 'Give it, then change it later'],
      explanation: 'A password is a secret for you alone — even from your best friend. Whoever uses your account acts in your name.',
    },
  },
  {
    n: 3, level: 1, correct: 2,
    ar: {
      text: 'وصلتك رسالة على هاتفك الذي تستخدمه تقول: «لقد ربحت جائزة! اضغط هنا». ماذا تفعل؟',
      options: ['أضغط على الرابط', 'أرسل الرابط لصديقي', 'أخبر والدي أو والدتي قبل أن أضغط', 'أدخل معلوماتي'],
      explanation: 'جائزة لم تشترك فيها = خدعة غالباً. لا تضغط — أرِ الرسالة لوالديك أولاً وهما سيعرفان الصح.',
    },
    en: {
      text: 'A message arrives on your phone saying: “You won a prize! Tap here.” What do you do?',
      options: ['Tap the link', 'Send the link to a friend', 'Tell my mum or dad before tapping', 'Enter my information'],
      explanation: 'A prize you never entered for is usually a trick. Don’t tap — show your parents first; they’ll know.',
    },
  },
  {
    n: 4, level: 2, correct: 0,
    ar: {
      text: 'نشر طالب صورتك في مجموعة المدرسة بدون إذنك، وبدأ بعض الطلاب يضحكون عليك. ماذا تفعل؟',
      options: ['أخبر والدي أو والدتي أو المعلم', 'أنشر صورته أيضًا', 'أكتب له كلامًا سيئًا', 'أتجاهل الأمر'],
      explanation: 'هذا تنمّر إلكتروني وليس مزاحاً. لا تردّ بالمثل — الكبار (أهلك أو معلمك) يستطيعون إيقافه وحمايتك.',
    },
    en: {
      text: 'A student posts your photo in the school group without permission, and some students start laughing at you. What do you do?',
      options: ['Tell my mum, dad, or my teacher', 'Post their photo too', 'Write mean words to them', 'Ignore it'],
      explanation: 'That is cyberbullying, not a joke. Don’t hit back — adults (your family or teacher) can stop it and protect you.',
    },
  },
  {
    n: 5, level: 2, correct: 3,
    ar: {
      text: 'طلب منك شخص على الإنترنت أن ترسل له صورتك وقال: «لا تخبر والديك». ماذا تفعل؟',
      options: ['أرسل الصورة', 'أطلب منه صورته أولًا', 'أحذف الرسالة فقط', 'لا أرسل الصورة وأخبر عائلتي'],
      explanation: 'أخطر جملة على الإنترنت هي «لا تخبر والديك» — من يقولها يعرف أنه يفعل شيئاً خاطئاً. أخبر عائلتك فوراً.',
    },
    en: {
      text: 'Someone online asks you to send your photo and says: “Don’t tell your parents.” What do you do?',
      options: ['Send the photo', 'Ask for their photo first', 'Just delete the message', 'Don’t send it and tell my family'],
      explanation: 'The most dangerous sentence online is “don’t tell your parents” — whoever says it knows they’re doing something wrong. Tell your family right away.',
    },
  },
  {
    n: 6, level: 2, correct: 2,
    ar: {
      text: 'أرسل لك شخص لا تعرفه طلب صداقة أثناء اللعب. ماذا تفعل؟',
      options: ['أقبل الطلب', 'أرسل له معلوماتي', 'لا أقبل الطلب وأخبر عائلتي', 'أرسل له صورتي'],
      explanation: 'الصديق الحقيقي تعرفه في الحياة، لا شخص مجهول خلف شاشة. لا تقبل، وأخبر عائلتك.',
    },
    en: {
      text: 'A stranger sends you a friend request while gaming. What do you do?',
      options: ['Accept the request', 'Send them my information', 'Don’t accept and tell my family', 'Send them my photo'],
      explanation: 'A real friend is someone you know in real life — not a stranger behind a screen. Don’t accept, and tell your family.',
    },
  },
  {
    n: 7, level: 3, correct: 3,
    ar: {
      text: 'سألك لاعب غريب وانت تلعب اللعبة الإلكترونية عن اسم مدرستك ووقت خروجك منها. ماذا تفعل؟',
      options: ['أخبره', 'أسأله عن مدرسته', 'أخبره باسم المدرسة فقط', 'لا أجيبه وأخبر عائلتي'],
      explanation: 'اسم مدرستك ووقت خروجك يدلّان عليك في الحقيقة — لا يحتاجهما أي لاعب أبداً. لا تجب وأخبر عائلتك فوراً.',
    },
    en: {
      text: 'While gaming, a strange player asks the name of your school and what time you leave it. What do you do?',
      options: ['Tell them', 'Ask about their school', 'Tell them only the school name', 'Don’t answer and tell my family'],
      explanation: 'Your school and your leaving time can locate you in real life — no player ever needs them. Don’t answer; tell your family immediately.',
    },
  },
  {
    n: 8, level: 3, correct: 1,
    ar: {
      text: 'أرسل لك شخص رسالة أخافتك أو أزعجتك. ماذا تفعل؟',
      options: ['أرد عليه بكلام سيئ', 'فوراً أخبر والدي او والدتي او احد افراد عائلتي', 'أرسل الرسالة لأصدقائي', 'أخفي الأمر'],
      explanation: 'الخوف ليس عيباً، وإخفاء الأمر يجعله أسوأ. عائلتك موجودة لحمايتك — أخبرهم فوراً.',
    },
    en: {
      text: 'Someone sends you a message that scares or upsets you. What do you do?',
      options: ['Reply with mean words', 'Immediately tell my mum, dad, or a family member', 'Forward it to my friends', 'Hide it'],
      explanation: 'Being scared is nothing to be ashamed of — hiding it makes it worse. Your family is there to protect you; tell them at once.',
    },
  },
  {
    n: 9, level: 3, correct: 3,
    ar: {
      text: 'كنت في مجموعة على الإنترنت، وطلب منك شخص لا تعرفه أن تتحدث معه وحدكما. ماذا تفعل؟',
      options: ['أتحدث معه', 'أرسل له صورتي', 'أعطيه اسم مدرستي', 'لا أتحدث معه وأخبر عائلتي'],
      explanation: 'من يطلب حديثاً «وحدكما» بعيداً عن المجموعة يريد ألا يراه أحد — وهذه إشارة خطر. ارفض وأخبر عائلتك.',
    },
    en: {
      text: 'In an online group, someone you don’t know asks to talk with you alone. What do you do?',
      options: ['Talk with them', 'Send them my photo', 'Give them my school’s name', 'Don’t talk with them and tell my family'],
      explanation: 'Someone who wants to talk “just the two of you” away from the group doesn’t want to be seen — that’s a danger sign. Refuse and tell your family.',
    },
  },
  {
    n: 10, level: 5, correct: 2,
    ar: {
      text: 'ما هي أفضل طريقة لحماية نفسك على الإنترنت؟',
      options: [
        'أشارك معلوماتي مع الجميع',
        'أفتح أي رابط يصلني',
        'أحافظ على معلوماتي وأخبر والدي وعائلتي عن أي أمر غريب يحدث لي على الانترنت',
        'أقبل طلبات الصداقة من الجميع',
      ],
      explanation: 'هذه هي القاعدة الذهبية: معلوماتك لك، وعائلتك خط دفاعك الأول. أي شيء غريب — أخبرهم فوراً.',
    },
    en: {
      text: 'What is the best way to protect yourself online?',
      options: [
        'Share my information with everyone',
        'Open any link I receive',
        'Keep my information private and tell my parents and family about anything strange that happens to me online',
        'Accept friend requests from everyone',
      ],
      explanation: 'This is the golden rule: your information is yours, and your family is your first line of defence. Anything strange — tell them right away.',
    },
  },
];

export const KIDS_TOTAL = KIDS_QUESTIONS.length;

export const KIDS_REWARDS = [
  { at: 4, ar: 'شهادة مشاركة', en: 'Certificate of Participation' },
  { at: 7, ar: 'شهادة تقدير', en: 'Certificate of Appreciation' },
  { at: 10, ar: 'الجائزة الكبرى – بطل الوعي الرقمي', en: 'Grand Prize — Digital Awareness Champion' },
];

/* واجهة موحّدة للوضعين */
export type Quiz = {
  kids: boolean;
  questions: Question[];
  levels: Level[];
  rewards: { at: number; ar: string; en: string }[];
  total: number;
  golden: number;
  certMin: number;
};

const KIDS_QUIZ: Quiz = { kids: true, questions: KIDS_QUESTIONS, levels: KIDS_LEVELS, rewards: KIDS_REWARDS, total: KIDS_TOTAL, golden: KIDS_TOTAL, certMin: 4 };
const ADULT_QUIZ: Quiz = { kids: false, questions: QUESTIONS, levels: LEVELS, rewards: REWARDS, total: TOTAL, golden: 20, certMin: 5 };

export function getQuiz(kids: boolean): Quiz {
  return kids ? KIDS_QUIZ : ADULT_QUIZ;
}

export function quizLevelOf(quiz: Quiz, n: number): Level {
  return quiz.levels.find((l) => n >= l.from && n <= l.to)!;
}

export function quizRewardFor(quiz: Quiz, score: number) {
  let earned: { at: number; ar: string; en: string } | null = null;
  for (const r of quiz.rewards) if (score >= r.at) earned = r;
  return earned;
}

export function quizCertificateTitle(quiz: Quiz, score: number) {
  if (score >= quiz.total) return { ar: 'بطل الوعي الرقمي', en: 'Digital Awareness Champion' };
  const mid = quiz.kids ? 7 : 15;
  if (score >= mid) return { ar: 'شهادة تقدير', en: 'Certificate of Appreciation' };
  return { ar: 'شهادة مشاركة', en: 'Certificate of Participation' };
}
