export type Lesson = { trick: string; move: string; remember: string };
export type LessonPair = { ar: Lesson; en: Lesson };

export const LESSONS: Record<number, LessonPair> = {
  1: {
    ar: {
      trick: 'قد تُستخدم التقنية أو الشبكة في الاحتيال والتصيد وانتحال الشخصية وسرقة البيانات.',
      move: 'ميّز بين الاستخدام العادي والفعل المُجرَّم الذي يُرتكب بالتقنية أو عبر الشبكة.',
      remember: 'التقنية قد تكون أداة للجريمة',
    },
    en: {
      trick: 'Technology or a network can be used for fraud, phishing, impersonation, or data theft.',
      move: 'Distinguish ordinary internet use from a criminal act committed with technology or a network.',
      remember: 'Technology can also enable crime',
    },
  },
  2: {
    ar: {
      trick: 'قد يطلب شخص موثوق كلمة مرورك، لكن ما يحدث من حسابك يُنسب إليك.',
      move: 'احتفظ بكلمة المرور لنفسك ولا تشاركها مع أي شخص مهما كانت الثقة.',
      remember: 'كلمة المرور لك وحدك',
    },
    en: {
      trick: 'Someone you trust may ask for your password, but actions from your account are attributed to you.',
      move: 'Keep your password to yourself and never share it, regardless of trust.',
      remember: 'Passwords are yours alone',
    },
  },
  3: {
    ar: {
      trick: 'قد يرسل الحساب المخترق رابطاً ضاراً يبدو موثوقاً لأنه يحمل اسم شخص تعرفه.',
      move: 'تعامل بحذر مع الرابط حتى لو وصل من حساب مألوف.',
      remember: 'المعروف قد يكون حساباً مخترقاً',
    },
    en: {
      trick: 'A compromised account can send a harmful link that looks trustworthy because the name is familiar.',
      move: 'Treat links cautiously even when they arrive from a familiar account.',
      remember: 'Familiar senders can be compromised',
    },
  },
  4: {
    ar: {
      trick: 'إذا سُرقت كلمة المرور وحدها، قد يتمكن شخص آخر من دخول الحساب غير المحمي.',
      move: 'استخدم كلمة مرور قوية وفعّل التحقق بخطوتين حتى لا تكفي كلمة المرور وحدها.',
      remember: 'قوِّ كلمة المرور وأضف خطوة ثانية',
    },
    en: {
      trick: 'If a password is stolen, it may unlock an account that has no second verification step.',
      move: 'Use a strong password and enable two-step verification so the password alone is not enough.',
      remember: 'Strong password, then a second step',
    },
  },
  5: {
    ar: {
      trick: 'تبدو رسالة أو مكالمة أو صفحة رسمية، لكنها تحاول انتزاع بياناتك أو أموالك.',
      move: 'تعرّف إلى هذا الخداع بوصفه تصيداً ولا تمنحه بياناتك أو أموالك.',
      remember: 'المظهر الرسمي لا يثبت الحقيقة',
    },
    en: {
      trick: 'A message, link, or call looks official while trying to obtain your data or money.',
      move: 'Recognise this deception as phishing and do not give it your data or money.',
      remember: 'Official-looking does not mean genuine',
    },
  },
  6: {
    ar: {
      trick: 'رسالة عاجلة تطلب تحديث بياناتك البنكية عبر رابط مرفق.',
      move: 'لا تفتح الرابط؛ تحقق عبر تطبيق البنك الرسمي أو الرقم المطبوع على بطاقتك.',
      remember: 'لا تدخل البنك من رابط رسالة',
    },
    en: {
      trick: 'An urgent message asks you to update bank details through an included link.',
      move: 'Do not open it; verify through the official app or the number printed on your card.',
      remember: 'Never reach your bank through message links',
    },
  },
  7: {
    ar: {
      trick: 'متصل يدّعي أنه موظف بنك ويستخدم اسمك ليقنعك بطلب رمز OTP.',
      move: 'ارفض مشاركة الرمز، أنهِ الاتصال، وتواصل مع البنك عبر قناة رسمية.',
      remember: 'رمز OTP لا يخرج منك',
    },
    en: {
      trick: 'A caller claims to work for a bank and uses your name to make an OTP request sound credible.',
      move: 'Refuse to share the code, end the call, and contact the bank through an official channel.',
      remember: 'Your OTP stays with you',
    },
  },
  8: {
    ar: {
      trick: 'يستغل المحتال رقمك وبياناتك المنشورة ليبدو مقنعاً أو لينتحل شخصيتك.',
      move: 'لا تنشر رقم هاتفك وبياناتك الشخصية بشكل علني.',
      remember: 'ما تنشره قد يخدم المحتال',
    },
    en: {
      trick: 'A fraudster can use public details to sound convincing or impersonate you.',
      move: 'Do not post your phone number and personal details publicly.',
      remember: 'Public details can help fraudsters',
    },
  },
  9: {
    ar: {
      trick: 'رقم مجهول يرسل رابطاً ويعتمد على فضولك لفتحه.',
      move: 'لا تفتح الرابط وتحقق من مصدر الرسالة أولاً.',
      remember: 'لا تجعل الفضول يفتح الرابط',
    },
    en: {
      trick: 'An unknown number sends a link and relies on your curiosity to open it.',
      move: 'Do not open the link; verify the source of the message first.',
      remember: 'Do not let curiosity open links',
    },
  },
  10: {
    ar: {
      trick: 'رسالة من حساب صديق تحمل رابطاً غريباً وبأسلوب لا يشبهه.',
      move: 'تواصل مع صديقك بطريقة أخرى لتتأكد من أن حسابه لم يُخترق.',
      remember: 'غيّر القناة لتتأكد من المرسل',
    },
    en: {
      trick: 'A friend’s account sends a strange link in a writing style unlike theirs.',
      move: 'Contact your friend another way to check whether the account was compromised.',
      remember: 'Switch channels to verify the sender',
    },
  },
  11: {
    ar: {
      trick: 'قد تكون شبكة Wi-Fi العامة مراقَبة أو مزيّفة حتى لو كانت مجانية وسريعة.',
      move: 'أجّل المعاملات البنكية وتسجيل الدخول الحساس حتى تستخدم شبكة تثق بها.',
      remember: 'المجاني والسريع لا يعني آمناً',
    },
    en: {
      trick: 'A public Wi-Fi network may be monitored or fake, even when it is free and fast.',
      move: 'Postpone banking and sensitive logins until you are on a network you trust.',
      remember: 'Free and fast does not mean safe',
    },
  },
  12: {
    ar: {
      trick: 'يستغل المخترق حسابك للتصرف باسمك والتواصل مع الآخرين.',
      move: 'غيّر كلمة المرور، فعّل التحقق بخطوتين، ثم أخرج الأجهزة المجهولة ونبّه من تواصلوا معه.',
      remember: 'استعد حسابك بسرعة ثم أمّنه',
    },
    en: {
      trick: 'An intruder can use your account to act in your name and contact others.',
      move: 'Change the password, enable two-step verification, sign out unknown devices, and warn contacts.',
      remember: 'Regain control quickly, then secure it',
    },
  },
  13: {
    ar: {
      trick: 'عرض استثماري يعد بأرباح كبيرة ومضمونة خلال وقت قصير.',
      move: 'تحقق من الجهة وترخيصها ومعلوماتها لدى الجهة الرقابية المختصة قبل أي تحويل.',
      remember: 'الأرباح المضمونة إنذار وليست ضماناً',
    },
    en: {
      trick: 'An investment offer promises large, guaranteed profits in a short time.',
      move: 'Verify the entity, information, and licence with the competent regulator before transferring money.',
      remember: 'Guaranteed profits are a warning, not proof',
    },
  },
  14: {
    ar: {
      trick: 'يجمع الإعلان الاحتيالي بين طلب تحويل عاجل ووعود غير منطقية.',
      move: 'قاوم الضغط الزمني وتوقف لتفكر وتتحقق قبل أي تحويل.',
      remember: 'الاستعجال والوعود الخيالية إنذاران',
    },
    en: {
      trick: 'A fraudulent ad combines an urgent transfer request with unrealistic promises.',
      move: 'Resist the time pressure; stop, think, and verify before transferring anything.',
      remember: 'Urgency plus unrealistic promises signals fraud',
    },
  },
  15: {
    ar: {
      trick: 'بعد تحويل المال، قد يدفعك الارتباك إلى الانتظار أو حذف ما يثبت الاحتيال.',
      move: 'تواصل فوراً مع البنك، واحتفظ بالرسائل وأرقام العمليات، وبلّغ الجهات المختصة.',
      remember: 'بلّغ سريعاً واحتفظ بكل الأدلة',
    },
    en: {
      trick: 'After a fraudulent transfer, confusion may lead you to wait or delete evidence.',
      move: 'Contact the bank immediately, keep messages and transaction references, and report to the authorities.',
      remember: 'Report quickly and preserve every detail',
    },
  },
  16: {
    ar: {
      trick: 'حذف محادثات الاحتيال يمحو أدلة قد تساعد التحقيق والوصول إلى المحتال.',
      move: 'صوّر المحادثة واحتفظ بالرسائل كما هي.',
      remember: 'المحادثة دليل؛ لا تحذفها',
    },
    en: {
      trick: 'Deleting fraud conversations removes evidence that may help an investigation identify the fraudster.',
      move: 'Take screenshots and keep the messages intact.',
      remember: 'The conversation is evidence; keep it',
    },
  },
  17: {
    ar: {
      trick: 'رمز QR في إعلان جائزة يخفي وجهته وقد يكون ملصقاً مزيّفاً فوق رمز حقيقي.',
      move: 'تحقق من العنوان الذي يظهر قبل أن تفتحه.',
      remember: 'افحص وجهة الرمز قبل فتحها',
    },
    en: {
      trick: 'A prize-ad QR code hides its destination and may be a fake sticker over a genuine code.',
      move: 'Check the address that appears before opening it.',
      remember: 'Check a QR destination before opening it',
    },
  },
  18: {
    ar: {
      trick: 'متصل ينتحل صفة قريب ويضغط عاطفياً لتحويل المال بسرعة.',
      move: 'أنهِ المكالمة واتصل بقريبك على الرقم المعروف لديك للتحقق من هويته.',
      remember: 'أغلق واتصل بالرقم المعروف',
    },
    en: {
      trick: 'A caller impersonates a relative and uses emotion and urgency to request money.',
      move: 'Hang up and call your relative on the number you already know to verify their identity.',
      remember: 'Hang up; call the number you know',
    },
  },
  19: {
    ar: {
      trick: 'رسالة أو رابط أو طلب مالي مشبوه يحاول دفعك للتصرف قبل التحقق.',
      move: 'توقف وتحقق من المصدر عبر قناة رسمية تصل إليها بنفسك، ثم تصرف.',
      remember: 'توقف، تحقق، ثم تصرف',
    },
    en: {
      trick: 'A suspicious message, link, or money request pushes you to act before checking.',
      move: 'Stop and verify through an official channel you reach yourself, then act.',
      remember: 'Stop, verify, then act',
    },
  },
  20: {
    ar: {
      trick: 'جائزة لم تشترك فيها تطلب بيانات بنكية ورمز OTP عبر رابط خلال عشر دقائق.',
      move: 'تجاهل الرسالة، تحقق من الجهة رسمياً، ولا تشارك بيانات أو رموزاً سرية.',
      remember: 'الجائزة المستعجلة قد تكون طعماً',
    },
    en: {
      trick: 'A prize you never entered requests bank details and an OTP through a link within ten minutes.',
      move: 'Ignore it, verify through official channels, and share no data or secret codes.',
      remember: 'Urgent prizes can be bait',
    },
  },
  21: {
    ar: {
      trick: 'إعلان ينتحل اسم شركة موثوقة ويطلب دفعة مقدمة لإتمام الإجراءات.',
      move: 'تحقق من الشركة والإعلان عبر موقعها الرسمي أو رقمها المعتمد قبل الدفع.',
      remember: 'الاسم الرسمي لا يثبت الإعلان',
    },
    en: {
      trick: 'An ad impersonates a trusted company and requests an upfront payment to complete procedures.',
      move: 'Verify the company and ad through its official site or approved number before paying.',
      remember: 'An official name does not prove an ad',
    },
  },
  22: {
    ar: {
      trick: 'إعلان تأمين مركبات يستخدم سعراً منخفضاً جداً كطُعم لوثيقة قد تكون مزوّرة.',
      move: 'تأكد عبر القنوات الرسمية من اعتماد الشركة والعرض قبل الدفع.',
      remember: 'السعر المذهل يستحق تحققاً مستقلاً',
    },
    en: {
      trick: 'A vehicle-insurance ad uses a far-too-low price as bait for a possibly forged policy.',
      move: 'Confirm through official channels that the company and offer are approved before paying.',
      remember: 'An amazing price deserves independent verification',
    },
  },
};

export const KIDS_LESSONS: Record<number, LessonPair> = {
  1: {
    ar: {
      trick: 'لاعب لا تعرفه يطلب اسمك وعنوان بيتك، وهما معلومات خاصة لا يحتاجها أي لاعب.',
      move: 'لا تعطِه المعلومات وأخبر عائلتك.',
      remember: 'معلوماتك الخاصة ليست للغرباء',
    },
    en: {
      trick: 'A player you do not know asks for your name and address, which no player needs.',
      move: 'Do not share the information, and tell your family.',
      remember: 'Private details are not for strangers',
    },
  },
  2: {
    ar: {
      trick: 'حتى الصديق قد يطلب كلمة مرورك، ثم يستطيع التصرف من حسابك باسمك.',
      move: 'لا تعطِ كلمة المرور لأي شخص، حتى أعز أصدقائك.',
      remember: 'كلمة المرور سر لك وحدك',
    },
    en: {
      trick: 'Even a friend may ask for your password and then act from your account in your name.',
      move: 'Never give your password to anyone, even your best friend.',
      remember: 'Your password is yours alone',
    },
  },
  3: {
    ar: {
      trick: 'رسالة جائزة لم تشترك فيها تحاول دفعك إلى فتح رابط.',
      move: 'لا تضغط؛ أرِ الرسالة لوالدتك أو والدك أولاً.',
      remember: 'الجائزة المفاجئة قد تكون خدعة',
    },
    en: {
      trick: 'A message about a prize you never entered tries to make you tap a link.',
      move: 'Do not tap; show the message to your mum or dad first.',
      remember: 'A surprise prize may be a trick',
    },
  },
  4: {
    ar: {
      trick: 'نشر صورتك دون إذن والضحك عليك تنمّر إلكتروني، وليس مزاحاً.',
      move: 'لا ترد بالإساءة؛ أخبر أحد والديك أو معلمك ليوقف الأمر ويحميك.',
      remember: 'أخبر كبيراً؛ لا ترد بالإساءة',
    },
    en: {
      trick: 'Posting your photo without permission and laughing at you is cyberbullying, not a joke.',
      move: 'Do not strike back; tell a parent or teacher so they can stop it and protect you.',
      remember: 'Tell an adult; do not strike back',
    },
  },
  5: {
    ar: {
      trick: 'شخص يطلب صورتك ويقول: «لا تخبر والديك» ليُبقي طلبه سراً.',
      move: 'لا ترسل الصورة وأخبر عائلتك فوراً.',
      remember: 'السر عن العائلة إشارة خطر',
    },
    en: {
      trick: 'Someone asks for your photo and says “do not tell your parents” to keep the request secret.',
      move: 'Do not send the photo, and tell your family right away.',
      remember: 'Secrets from family are a danger sign',
    },
  },
  6: {
    ar: {
      trick: 'شخص مجهول خلف شاشة اللعبة يرسل طلب صداقة.',
      move: 'لا تقبل الطلب وأخبر عائلتك.',
      remember: 'قد يكون خلف الشاشة شخص مجهول',
    },
    en: {
      trick: 'A stranger behind a game screen sends you a friend request.',
      move: 'Do not accept the request, and tell your family.',
      remember: 'Behind the screen may be a stranger',
    },
  },
  7: {
    ar: {
      trick: 'لاعب غريب يسأل عن مدرستك ووقت خروجك، وهما قد يدلان عليك في الحقيقة.',
      move: 'لا تجبه وأخبر عائلتك فوراً.',
      remember: 'مدرستك ووقتك معلومات خاصة',
    },
    en: {
      trick: 'A strange player asks for your school and leaving time, which can locate you in real life.',
      move: 'Do not answer, and tell your family immediately.',
      remember: 'Your school and schedule stay private',
    },
  },
  8: {
    ar: {
      trick: 'رسالة مخيفة أو مزعجة قد تدفعك للرد بإساءة أو إخفاء الأمر.',
      move: 'أخبر والدتك أو والدك أو أحد أفراد عائلتك فوراً.',
      remember: 'الخوف ليس عيباً؛ أخبر عائلتك',
    },
    en: {
      trick: 'A scary or upsetting message may make you want to reply badly or hide it.',
      move: 'Tell your mum, dad, or another family member immediately.',
      remember: 'Feeling scared is okay; tell your family',
    },
  },
  9: {
    ar: {
      trick: 'شخص مجهول في مجموعة يطلب حديثاً منفرداً بعيداً عن الآخرين.',
      move: 'لا تتحدث معه وحدكما وأخبر عائلتك.',
      remember: 'طلب العزلة إشارة خطر',
    },
    en: {
      trick: 'A stranger in a group asks to talk alone, away from everyone else.',
      move: 'Do not talk with them alone, and tell your family.',
      remember: 'Requests for secrecy are a danger sign',
    },
  },
  10: {
    ar: {
      trick: 'مشاركة معلوماتك وفتح أي رابط وقبول الغرباء يعرّضك للخطر.',
      move: 'احمِ معلوماتك وأخبر عائلتك عن أي شيء غريب يحدث لك على الإنترنت.',
      remember: 'معلوماتك لك، وعائلتك معك',
    },
    en: {
      trick: 'Sharing details, opening every link, and accepting strangers can put you at risk.',
      move: 'Keep your information private and tell your family about anything strange online.',
      remember: 'Keep details private; keep family involved',
    },
  },
};

export function lessonFor(kids: boolean, n: number): LessonPair | undefined {
  return (kids ? KIDS_LESSONS : LESSONS)[n];
}
