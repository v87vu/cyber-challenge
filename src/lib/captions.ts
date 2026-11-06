/* ترجمة الفيديوهات التوعوية — تظهر فقط عند اختيار الإنجليزية أو الأردية.
   التوقيتات مقيسة من صوت الفيديو نفسه (بالثواني). نص الكبار الإنجليزي هو النص الرسمي للرسالة كما في i18n. */

export type Cue = { start: number; end: number; text: string };
type CaptionLang = 'en' | 'ur';

const ADULT: Record<CaptionLang, Cue[]> = {
  en: [
    { start: 0.1, end: 4.7, text: 'Protecting the community is a shared responsibility —' },
    { start: 4.76, end: 10.96, text: 'it begins with awareness and grows through vigilance and accountability.' },
    { start: 10.96, end: 15.56, text: 'Together, we safeguard our digital community' },
    { start: 15.56, end: 20.3, text: 'and create a safer environment for everyone.' },
  ],
  ur: [
    { start: 0.1, end: 4.7, text: 'معاشرے کا تحفظ ایک مشترکہ ذمہ داری ہے،' },
    { start: 4.76, end: 10.96, text: 'جس کا آغاز آگاہی سے ہوتا ہے، اور چوکسی اور ذمہ داری اسے مضبوط بناتی ہیں۔' },
    { start: 10.96, end: 15.56, text: 'مل جل کر ہم اپنی ڈیجیٹل کمیونٹی کو محفوظ رکھتے ہیں' },
    { start: 15.56, end: 20.3, text: 'اور سب کے لیے ایک زیادہ محفوظ ماحول بناتے ہیں۔' },
  ],
};

const KIDS: Record<CaptionLang, Cue[]> = {
  en: [
    { start: 0.0, end: 5.9, text: "Hello, heroes! I'm Saif, your friend from the police." },
    { start: 5.9, end: 8.4, text: 'This message… is a scam!' },
    { start: 9.2, end: 13.3, text: "Let's learn three golden rules together that keep us safe online." },
    { start: 13.8, end: 17.2, text: "Rule number one: don't tap on strange links." },
    { start: 18.2, end: 22.0, text: 'A free prize that comes out of nowhere is usually a trap.' },
    { start: 22.6, end: 26.4, text: 'Rule number two: we never share our password with anyone —' },
    { start: 26.8, end: 29.8, text: 'not even a code that comes to you in a message.' },
    { start: 30.1, end: 32.6, text: 'Rule number three:' },
    { start: 37.0, end: 39.7, text: "don't tell strangers your full name," },
    { start: 39.7, end: 43.2, text: 'or your school, or where you live, or share your photos.' },
    { start: 43.2, end: 45.9, text: 'And if you ever see something strange or scary,' },
    { start: 45.9, end: 48.3, text: 'tell your parents or your teacher right away.' },
    { start: 48.8, end: 49.9, text: "You're not alone." },
    { start: 49.9, end: 53.2, text: 'You are now the guardians of digital safety!' },
  ],
  ur: [
    { start: 0.0, end: 5.9, text: 'ہیلو ہیروز! میں سیف ہوں، پولیس سے آپ کا دوست۔' },
    { start: 5.9, end: 8.4, text: 'یہ پیغام… ایک دھوکا ہے!' },
    { start: 9.2, end: 13.3, text: 'آئیے مل کر تین سنہری اصول سیکھیں جو انٹرنیٹ پر ہماری حفاظت کرتے ہیں۔' },
    { start: 13.8, end: 17.2, text: 'پہلا اصول: عجیب لنکس پر کلک نہ کریں۔' },
    { start: 18.2, end: 22.0, text: 'اچانک ملنے والا مفت انعام اکثر ایک جال ہوتا ہے۔' },
    { start: 22.6, end: 26.4, text: 'دوسرا اصول: ہم اپنا پاس ورڈ کسی کو نہیں بتاتے،' },
    { start: 26.8, end: 29.8, text: 'اور نہ ہی وہ کوڈ جو آپ کو پیغام میں ملتا ہے۔' },
    { start: 30.1, end: 32.6, text: 'تیسرا اصول:' },
    { start: 37.0, end: 39.7, text: 'اجنبیوں کو اپنا پورا نام نہ بتائیں،' },
    { start: 39.7, end: 43.2, text: 'نہ اپنا اسکول، نہ اپنے گھر کا پتا، اور نہ اپنی تصویریں۔' },
    { start: 43.2, end: 45.9, text: 'اور اگر آپ کوئی عجیب یا ڈراؤنی چیز دیکھیں،' },
    { start: 45.9, end: 48.3, text: 'تو فوراً اپنے والدین یا استاد کو بتائیں۔' },
    { start: 48.8, end: 49.9, text: 'آپ اکیلے نہیں ہیں۔' },
    { start: 49.9, end: 53.2, text: 'اب آپ ڈیجیٹل حفاظت کے محافظ ہیں!' },
  ],
};

/** null for Arabic (the videos are already in Arabic). */
export function introCaptions(kids: boolean, lang: string): Cue[] | null {
  if (lang !== 'en' && lang !== 'ur') return null;
  return (kids ? KIDS : ADULT)[lang];
}
