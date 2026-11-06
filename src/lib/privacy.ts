import type { Lang } from './prefs';

const COPY = {
  ar: {
    survey: 'إجاباتك تُستخدم لأغراض التوعية والإحصاء فقط، ولا تُشارك مع أي جهة خارج القيادة العامة لشرطة أم القيوين.',
    certificate: 'نستخدم اسمك لإصدار الشهادة، وبريدك (اختياري) لإرسالها فقط. لن نستخدمهما لأي غرض آخر.',
    minor: 'إذا كان عمرك أقل من 18 سنة، يُرجى إدخال بياناتك بعلم أحد والديك.',
  },
  en: {
    survey: 'Your answers are used only for awareness and statistics, and are not shared with anyone outside the General Headquarters of Umm Al Quwain Police.',
    certificate: 'We use your name to issue the certificate and your email (optional) only to send it. We will not use them for any other purpose.',
    minor: 'If you are under 18, please enter your details with the knowledge of a parent or guardian.',
  },
  ur: {
    survey: 'آپ کے جوابات صرف آگاہی اور اعداد و شمار کے لیے استعمال ہوں گے اور ام القیوین پولیس کے صدر دفتر سے باہر کسی ساتھ شیئر نہیں کیے جائیں گے۔',
    certificate: 'ہم آپ کا نام سرٹیفکیٹ جاری کرنے اور آپ کی ای میل (اختیاری) صرف اسے بھیجنے کے لیے استعمال کرتے ہیں۔ انہیں کسی اور مقصد کے لیے استعمال نہیں کیا جائے گا۔',
    minor: 'اگر آپ کی عمر 18 سال سے کم ہے تو براہ کرم والدین میں سے کسی ایک کے علم میں اپنی تفصیلات درج کریں۔',
  },
} as const;

export function privacyCopy(lang: Lang) {
  return COPY[lang];
}
