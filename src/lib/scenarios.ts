export type ArtifactKind = 'sms' | 'chat' | 'call' | 'ad' | 'social' | 'email';
export type Seg = { text: string; flag?: string };
export type ScenarioCopy = {
  sender: string;
  meta?: string;
  lines: Seg[];
  cta?: Seg;
  flags: Record<string, string>;
};
export type Scenario = { kind: ArtifactKind; ar: ScenarioCopy; en: ScenarioCopy };

export const SCENARIOS: Record<number, Scenario> = {
  3: {
    kind: 'email',
    ar: {
      sender: 'مريم <mariam.k88@mymail.ae>',
      meta: 'الموضوع: صور اللقاء',
      lines: [
        { text: 'مرحباً، هذه الصور التي تحدثنا عنها.' },
        { text: 'افتحها من الرابط قبل أن أحذف الألبوم.' },
      ],
      cta: { text: 'photos-album.net/v/8271', flag: 'link' },
      flags: { link: 'رابط خارجي من حساب قد يكون مخترقاً' },
    },
    en: {
      sender: 'Mariam <mariam.k88@mymail.ae>',
      meta: 'Subject: Our gathering photos',
      lines: [
        { text: 'Hi, here are the photos we talked about.' },
        { text: 'Open them before I delete the album.' },
      ],
      cta: { text: 'photos-album.net/v/8271', flag: 'link' },
      flags: { link: 'External link; account may be hacked' },
    },
  },
  6: {
    kind: 'sms',
    ar: {
      sender: 'خدمة الحساب',
      meta: 'الآن',
      lines: [
        { text: 'يرجى تحديث بيانات حسابك البنكي فوراً.', flag: 'urgency' },
        { text: 'استخدم الرابط التالي لإكمال التحديث.' },
      ],
      cta: { text: 'secure-acc0unt-uae.info/verify', flag: 'link' },
      flags: {
        urgency: 'ضغط للتصرف فوراً',
        link: 'رابط يطلب تحديث بيانات بنكية',
      },
    },
    en: {
      sender: 'Account Service',
      meta: 'Now',
      lines: [
        { text: 'Please update your bank account details immediately.', flag: 'urgency' },
        { text: 'Use the link below to complete the update.' },
      ],
      cta: { text: 'secure-acc0unt-uae.info/verify', flag: 'link' },
      flags: {
        urgency: 'Pressure to act immediately',
        link: 'Link requesting bank details',
      },
    },
  },
  7: {
    kind: 'call',
    ar: {
      sender: 'خدمة الحساب',
      meta: 'مكالمة واردة',
      lines: [
        { text: 'المتصل: أنا من قسم الحسابات، وأعرف أن اسمك أحمد.' },
        { text: 'المتصل: اقرأ لي رمز OTP لإكمال التحقق.', flag: 'otp' },
      ],
      flags: { otp: 'طلب رمز OTP عبر الهاتف' },
    },
    en: {
      sender: 'Account Service',
      meta: 'Incoming call',
      lines: [
        { text: 'Caller: I am from accounts, and I know your name is Ahmed.' },
        { text: 'Caller: Read me the OTP to complete verification.', flag: 'otp' },
      ],
      flags: { otp: 'OTP requested over a call' },
    },
  },
  9: {
    kind: 'sms',
    ar: {
      sender: 'رقم غير محفوظ',
      meta: 'الآن',
      lines: [{ text: 'هذا هو الملف الذي طلبته. يمكنك فتحه من هنا.' }],
      cta: { text: 'quick-file.xyz/open/419', flag: 'unknown-link' },
      flags: { 'unknown-link': 'رابط من رقم مجهول' },
    },
    en: {
      sender: 'Unknown number',
      meta: 'Now',
      lines: [{ text: 'Here is the file you requested. You can open it here.' }],
      cta: { text: 'quick-file.xyz/open/419', flag: 'unknown-link' },
      flags: { 'unknown-link': 'Link from an unknown number' },
    },
  },
  10: {
    kind: 'chat',
    ar: {
      sender: 'عمر',
      meta: 'متصل الآن',
      lines: [
        { text: 'مرحبا صديقي العزيز جداً شاهد هذا بسرعة', flag: 'style' },
        { text: 'أرسل لي رأيك هنا.' },
      ],
      cta: { text: 'view-now.click/p/730', flag: 'link' },
      flags: {
        style: 'أسلوب كتابة غير معتاد',
        link: 'رابط غريب من حساب صديق',
      },
    },
    en: {
      sender: 'Omar',
      meta: 'Online now',
      lines: [
        { text: 'hello my very dear friend see this quickly', flag: 'style' },
        { text: 'Send me what you think here.' },
      ],
      cta: { text: 'view-now.click/p/730', flag: 'link' },
      flags: {
        style: 'Unusual writing style',
        link: 'Strange link from a friend’s account',
      },
    },
  },
  13: {
    kind: 'chat',
    ar: {
      sender: 'نورة | مجموعة النمو',
      meta: 'الآن',
      lines: [
        { text: 'لدينا فرصة استثمار خاصة هذا الأسبوع.' },
        { text: 'أرباح كبيرة ومضمونة خلال فترة قصيرة.', flag: 'guarantee' },
        { text: 'أرسل المبلغ اليوم لحجز مكانك.', flag: 'urgency' },
      ],
      flags: {
        guarantee: 'وعد بأرباح مضمونة',
        urgency: 'ضغط للتحويل سريعاً',
      },
    },
    en: {
      sender: 'Noura | Growth Circle',
      meta: 'Now',
      lines: [
        { text: 'We have a private investment opportunity this week.' },
        { text: 'Large, guaranteed profits in a short time.', flag: 'guarantee' },
        { text: 'Send the amount today to reserve your place.', flag: 'urgency' },
      ],
      flags: {
        guarantee: 'Promise of guaranteed profits',
        urgency: 'Pressure to transfer quickly',
      },
    },
  },
  17: {
    kind: 'ad',
    ar: {
      sender: 'مكافآت المدينة',
      meta: 'إعلان ممول',
      lines: [
        { text: 'قد تكون جائزتك بانتظارك.' },
        { text: 'امسح رمز QR لمعرفة تفاصيل الاستلام.', flag: 'qr' },
      ],
      cta: { text: 'مسح رمز QR', flag: 'prize' },
      flags: {
        qr: 'الرمز يخفي وجهة الرابط',
        prize: 'دعوة للحصول على جائزة',
      },
    },
    en: {
      sender: 'City Rewards',
      meta: 'Sponsored',
      lines: [
        { text: 'Your prize may be waiting.' },
        { text: 'Scan the QR code to see collection details.', flag: 'qr' },
      ],
      cta: { text: 'Scan QR code', flag: 'prize' },
      flags: {
        qr: 'The code hides the link destination',
        prize: 'Invitation to claim a prize',
      },
    },
  },
  18: {
    kind: 'call',
    ar: {
      sender: 'رقم غير محفوظ',
      meta: 'مكالمة جارية',
      lines: [
        { text: 'المتصل: أنا خالد، ابن عمك. هاتفي الآخر لا يعمل.' },
        { text: 'المتصل: أحتاج تحويلاً مالياً الآن، الأمر عاجل.', flag: 'urgency' },
      ],
      flags: { urgency: 'ادعاء قرابة مع طلب مالي عاجل' },
    },
    en: {
      sender: 'Unknown number',
      meta: 'Call in progress',
      lines: [
        { text: 'Caller: It’s Khalid, your cousin. My other phone is not working.' },
        { text: 'Caller: I need a money transfer now. It is urgent.', flag: 'urgency' },
      ],
      flags: { urgency: 'Family claim and urgent money request' },
    },
  },
  20: {
    kind: 'sms',
    ar: {
      sender: 'مركز الجوائز',
      meta: 'الآن',
      lines: [
        { text: 'تهانينا! تم اختيارك للفوز بجائزة مالية كبيرة.', flag: 'prize' },
        { text: 'أدخل بياناتك البنكية ورمز OTP خلال 10 دقائق.', flag: 'secrets' },
      ],
      cta: { text: 'claim-reward-uae.top/collect', flag: 'deadline' },
      flags: {
        prize: 'جائزة لم تشترك فيها',
        secrets: 'طلب بيانات بنكية ورمز OTP',
        deadline: 'مهلة قصيرة عبر رابط',
      },
    },
    en: {
      sender: 'Prize Centre',
      meta: 'Now',
      lines: [
        { text: 'Congratulations! You were selected to win a large cash prize.', flag: 'prize' },
        { text: 'Enter your bank details and OTP within 10 minutes.', flag: 'secrets' },
      ],
      cta: { text: 'claim-reward-uae.top/collect', flag: 'deadline' },
      flags: {
        prize: 'A prize you never entered',
        secrets: 'Request for bank details and OTP',
        deadline: 'Short deadline through a link',
      },
    },
  },
  21: {
    kind: 'social',
    ar: {
      sender: 'الكثبان لخدمات العمالة',
      meta: 'إعلان ممول',
      lines: [
        { text: 'خدمة رسمية لتوفير العمالة المساعدة.', flag: 'claim' },
        { text: 'ادفع المبلغ المقدم الآن لإتمام الإجراءات.', flag: 'payment' },
      ],
      cta: { text: 'dunes-hr-jobs.com/apply' },
      flags: {
        claim: 'ادعاء صفة شركة رسمية',
        payment: 'طلب دفعة مقدمة',
      },
    },
    en: {
      sender: 'Dunes Domestic Staffing',
      meta: 'Sponsored',
      lines: [
        { text: 'Official domestic-worker recruitment service.', flag: 'claim' },
        { text: 'Pay the upfront amount now to complete the procedures.', flag: 'payment' },
      ],
      cta: { text: 'dunes-hr-jobs.com/apply' },
      flags: {
        claim: 'Claim of official company status',
        payment: 'Request for upfront payment',
      },
    },
  },
  22: {
    kind: 'social',
    ar: {
      sender: 'عروض تأمين المركبات',
      meta: 'إعلان ممول',
      lines: [
        { text: 'أمّن مركبتك اليوم بسعر أقل بكثير من الأسعار المعتادة.', flag: 'price' },
        { text: 'أرسل بياناتك وأكمل الدفع للحصول على الوثيقة.' },
      ],
      cta: { text: 'motor-cover-uae.net/buy' },
      flags: { price: 'سعر منخفض جداً مقارنة بالمعتاد' },
    },
    en: {
      sender: 'Vehicle Cover Offers',
      meta: 'Sponsored',
      lines: [
        { text: 'Insure your vehicle today for far less than the usual price.', flag: 'price' },
        { text: 'Send your details and complete payment to receive the policy.' },
      ],
      cta: { text: 'motor-cover-uae.net/buy' },
      flags: { price: 'Price far below the usual cost' },
    },
  },
};

export const KIDS_SCENARIOS: Record<number, Scenario> = {
  1: {
    kind: 'chat',
    ar: {
      sender: 'SkyFalcon27',
      meta: 'دردشة اللعبة',
      lines: [
        { text: 'ما اسمك الحقيقي؟' },
        { text: 'وفي أي بيت تسكن؟ أرسل لي عنوانك.', flag: 'private' },
      ],
      flags: { private: 'طلب الاسم وعنوان البيت' },
    },
    en: {
      sender: 'SkyFalcon27',
      meta: 'Game chat',
      lines: [
        { text: 'What is your real name?' },
        { text: 'Where do you live? Send me your address.', flag: 'private' },
      ],
      flags: { private: 'Request for your name and address' },
    },
  },
  2: {
    kind: 'chat',
    ar: {
      sender: 'سعيد',
      meta: 'الآن',
      lines: [
        { text: 'أريد أن أجرب حسابك قليلاً.' },
        { text: 'أرسل لي كلمة المرور، فنحن أصدقاء.', flag: 'password' },
      ],
      flags: { password: 'صديق يطلب كلمة مرورك' },
    },
    en: {
      sender: 'Saeed',
      meta: 'Now',
      lines: [
        { text: 'I want to try your account for a while.' },
        { text: 'Send me the password. We are friends.', flag: 'password' },
      ],
      flags: { password: 'A friend asking for your password' },
    },
  },
  3: {
    kind: 'sms',
    ar: {
      sender: 'نادي الجوائز',
      meta: 'الآن',
      lines: [{ text: 'لقد ربحت جائزة! اضغط هنا لاستلامها.', flag: 'prize' }],
      cta: { text: 'free-gems-prize.xyz/open', flag: 'link' },
      flags: {
        prize: 'جائزة لم تشترك فيها',
        link: 'رابط لاستلام الجائزة',
      },
    },
    en: {
      sender: 'Prize Club',
      meta: 'Now',
      lines: [{ text: 'You won a prize! Tap here to claim it.', flag: 'prize' }],
      cta: { text: 'free-gems-prize.xyz/open', flag: 'link' },
      flags: {
        prize: 'A prize you never entered',
        link: 'Link to claim the prize',
      },
    },
  },
  4: {
    kind: 'social',
    ar: {
      sender: 'مجموعة الصف | حمد',
      meta: 'منشور جديد',
      lines: [
        { text: 'نشر حمد صورتك دون أن يسألك.', flag: 'photo' },
        { text: 'بدأ بعض الطلاب يكتبون أنهم يضحكون عليك.', flag: 'bullying' },
      ],
      flags: {
        photo: 'نشر صورة دون إذن',
        bullying: 'ضحك وإساءة في المجموعة',
      },
    },
    en: {
      sender: 'Class Group | Hamad',
      meta: 'New post',
      lines: [
        { text: 'Hamad posted your photo without asking you.', flag: 'photo' },
        { text: 'Some students start writing that they are laughing at you.', flag: 'bullying' },
      ],
      flags: {
        photo: 'Photo posted without permission',
        bullying: 'Laughing and mean group comments',
      },
    },
  },
  5: {
    kind: 'chat',
    ar: {
      sender: 'MoonPlayer8',
      meta: 'دردشة خاصة',
      lines: [
        { text: 'أرسل لي صورتك.' },
        { text: 'ولا تخبر والديك عن حديثنا.', flag: 'secret' },
      ],
      flags: { secret: 'طلب صورة مع إخفاء الأمر' },
    },
    en: {
      sender: 'MoonPlayer8',
      meta: 'Private chat',
      lines: [
        { text: 'Send me your photo.' },
        { text: 'Do not tell your parents about our chat.', flag: 'secret' },
      ],
      flags: { secret: 'Photo request kept from family' },
    },
  },
  6: {
    kind: 'chat',
    ar: {
      sender: 'PixelFox44',
      meta: 'أثناء اللعب',
      lines: [{ text: 'يريد PixelFox44 إضافتك إلى قائمة الأصدقاء.', flag: 'stranger' }],
      cta: { text: 'قبول طلب الصداقة' },
      flags: { stranger: 'طلب صداقة من شخص مجهول' },
    },
    en: {
      sender: 'PixelFox44',
      meta: 'While gaming',
      lines: [{ text: 'PixelFox44 wants to add you as a friend.', flag: 'stranger' }],
      cta: { text: 'Accept friend request' },
      flags: { stranger: 'Friend request from a stranger' },
    },
  },
  7: {
    kind: 'chat',
    ar: {
      sender: 'DesertRacer19',
      meta: 'دردشة اللعبة',
      lines: [
        { text: 'ما اسم مدرستك؟' },
        { text: 'وفي أي وقت تخرج منها؟', flag: 'schedule' },
      ],
      flags: { schedule: 'طلب المدرسة ووقت الخروج' },
    },
    en: {
      sender: 'DesertRacer19',
      meta: 'Game chat',
      lines: [
        { text: 'What is the name of your school?' },
        { text: 'What time do you leave it?', flag: 'schedule' },
      ],
      flags: { schedule: 'Request for school and leaving time' },
    },
  },
  8: {
    kind: 'chat',
    ar: {
      sender: 'حساب غير معروف',
      meta: 'رسالة جديدة',
      lines: [
        { text: 'ستندم على ما فعلت.', flag: 'scary' },
        { text: 'لا تُرِ هذه الرسالة لأي شخص.', flag: 'hide' },
      ],
      flags: {
        scary: 'رسالة مخيفة أو مزعجة',
        hide: 'طلب إخفاء الرسالة',
      },
    },
    en: {
      sender: 'Unknown account',
      meta: 'New message',
      lines: [
        { text: 'You will regret what you did.', flag: 'scary' },
        { text: 'Do not show this message to anyone.', flag: 'hide' },
      ],
      flags: {
        scary: 'Scary or upsetting message',
        hide: 'Request to hide the message',
      },
    },
  },
  9: {
    kind: 'chat',
    ar: {
      sender: 'WaveKnight6',
      meta: 'مجموعة اللاعبين',
      lines: [
        { text: 'لنخرج من المجموعة.' },
        { text: 'أريد أن نتحدث وحدنا في محادثة خاصة.', flag: 'alone' },
      ],
      flags: { alone: 'طلب حديث منفرد بعيداً عن المجموعة' },
    },
    en: {
      sender: 'WaveKnight6',
      meta: 'Players group',
      lines: [
        { text: 'Let’s leave the group.' },
        { text: 'I want us to talk alone in a private chat.', flag: 'alone' },
      ],
      flags: { alone: 'Request to talk alone outside the group' },
    },
  },
};

export function scenarioFor(kids: boolean, n: number): Scenario | undefined {
  return (kids ? KIDS_SCENARIOS : SCENARIOS)[n];
}
