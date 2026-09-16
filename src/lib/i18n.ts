import type { Gender, Lang } from '@/lib/prefs';

/**
 * نصوص الواجهة بالعربية والإنجليزية، مع صيغة مؤنّثة للعربية.
 * نصوص المقدّم في وضع العرض المباشر تبقى كما وردت من الجهة المنظمة (المذكّر).
 */

const AR = (g: Gender) => {
  const f = g === 'female';
  return {
    dir: 'rtl' as const,
    appTitle: 'تحدي الوعي الرقمي',
    appSubtitle: 'مواجهة الجرائم الإلكترونية',

    // الإعداد الأولي
    onbGenderTitle: 'من أنت؟',
    onbGenderHint: 'نستخدم هذا لمخاطبتك بالصيغة الصحيحة فقط.',
    pickCharacter: 'اضغط على شخصيتك للاختيار',
    onbAgeTitle: f ? 'كم عمركِ؟' : 'كم عمرك؟',
    onbAgeHint: 'يساعدنا هذا في تحسين التجربة وإعداد التقارير.',
    ageGroups: [
      '12–17 سنة',
      '18–24 سنة',
      '25–34 سنة',
      '35–44 سنة',
      '45–54 سنة',
      '55–64 سنة',
      '65–70 سنة',
      'أكثر من 70 سنة',
    ],
    male: 'ذكر',
    female: 'أنثى',
    onbLangTitle: 'اختر اللغة',
    onbLangHint: 'يمكنك تغييرها في أي وقت.',
    arabic: 'العربية',
    english: 'English',
    next: 'التالي',
    back: 'رجوع',

    // القائمة
    play: 'ابدأ التحدي',
    playSub: 'تحدٍّ متدرّج · حياة واحدة',
    presenter: 'وضع العرض المباشر',
    presenterSub: 'شاشة كبيرة للمقدّم',
    levels: 'المستويات',
    prizes: 'نظام الجوائز',
    correctAnswers: 'إجابة صحيحة',
    settings: 'الإعدادات',
    changeChoices: 'تغيير اللغة أو النوع',

    // اللعب
    ready: f ? 'هل أنتِ مستعدة؟' : 'هل أنت مستعد؟',
    rule1: f
      ? 'حياة واحدة — إجابة خاطئة واحدة تنهي محاولتكِ.'
      : 'حياة واحدة — إجابة خاطئة واحدة تنهي محاولتك.',
    rule2: f ? 'يمكنكِ إعادة المحاولة بقدر ما تشائين.' : 'يمكنك إعادة المحاولة بقدر ما تشاء.',
    rule3: f ? 'عند الخروج سترين الإجابة الصحيحة وشرحها.' : 'عند الخروج سترى الإجابة الصحيحة وشرحها.',
    timer: 'مؤقّت السؤال',
    timerSub: '45 ثانية لكل سؤال',
    on: 'مفعّل',
    off: 'متوقف',
    start: 'ابدأ',
    getReady: f ? 'استعدي…' : 'استعد…',
    question: 'السؤال',
    of: 'من',
    pick: f ? 'اختاري إجابة' : 'اختر إجابة',
    confirm: 'تأكيد الإجابة',
    oneLife: f
      ? 'تنبيه: لديكِ حياة واحدة — الإجابة الخاطئة تنهي المحاولة.'
      : 'تنبيه: لديك حياة واحدة — الإجابة الخاطئة تنهي المحاولة.',
    correct: 'إجابة صحيحة!',
    wellDone: f ? 'أحسنتِ، انتقلتِ إلى المستوى التالي.' : 'أحسنت، انتقلت إلى المستوى التالي.',
    nextQuestion: 'السؤال التالي',
    showResult: 'إعلان النتيجة',
    streak: 'سلسلة',
    stageClear: 'أنجزتِ المرحلة!',
    stageClearM: 'أنجزت المرحلة!',
    continue: 'متابعة',
    goldenQuestion: 'السؤال الذهبي',
    goldenHint: f
      ? 'اجتازيه لتدخلي مستوى الخبير الرقمي — التحدي الأخير.'
      : 'اجتزه لتدخل مستوى الخبير الرقمي — التحدي الأخير.',
    goldenHintKids: f
      ? 'السؤال الأخير! أجيبي صح لتصبحي بطلة الوعي الرقمي.'
      : 'السؤال الأخير! أجب صح لتصبح بطل الوعي الرقمي.',
    expertStage: 'مرحلة الخبراء — لم يتبقَّ سوى السؤال الذهبي!',

    // النتائج
    gameOver: 'انتهت المحاولة',
    wrongAnswer: 'إجابة غير صحيحة',
    timeUp: 'انتهى الوقت',
    keepLearning: f
      ? 'تذكّري أن الهدف ليس الفوز فقط، بل أن تتعلّمي كيف تحمين نفسكِ.'
      : 'تذكر أن الهدف ليس الفوز فقط، بل أن تتعلم كيف تحمي نفسك.',
    yourScore: 'نتيجتك',
    reached: f ? 'وصلتِ إلى' : 'وصلت إلى',
    youPicked: f ? 'اخترتِ هذه' : 'اخترت هذه',
    correctAnswer: 'الإجابة الصحيحة',
    earned: f ? 'استحققتِ' : 'استحققت',
    newRecord: 'رقم قياسي جديد!',
    bestScore: 'أفضل نتيجة',
    retry: 'إعادة المحاولة',
    reviewMode: 'وضع المراجعة',
    reviewHint: 'جميع الأسئلة مع إجاباتها وشرحها — خارج المسابقة ولا تُحتسب.',
    reviewAll: 'مراجعة كل الأسئلة',
    finish: 'إنهاء',
    menu: 'القائمة الرئيسية',
    youWin: f ? 'فزتِ!' : 'فزت!',
    champion: 'بطل الوعي الرقمي',
    winLine: f
      ? 'أثبتِّ أن الوعي الرقمي هو خط الدفاع الأول ضد الجرائم الإلكترونية.'
      : 'أثبتَّ أن الوعي الرقمي هو خط الدفاع الأول ضد الجرائم الإلكترونية.',
    rank: 'اللقب',

    // المشاركة
    shareResult: 'مشاركة النتيجة',
    shareTextWin:
      'حصلت على لقب «بطل الوعي الرقمي» بالعلامة الكاملة في تحدي الوعي الرقمي! جرّبه بنفسك:',
    copied: 'تم نسخ الرابط ✓',

    // الشهادة
    getCertificate: 'استلام الشهادة',
    yourCertificate: 'شهادة تقدير',
    nameLabel: 'الاسم كما تريده على الشهادة',
    namePlaceholder: 'اكتب اسمك هنا',
    download: 'تنزيل الشهادة',
    close: 'إغلاق',
    certNote: 'شهادة رقمية — لا تُستخدم كإثبات رسمي.',
    certAwarded: 'تشهد الجهة المنظمة بأن',
    certBody: 'قد شارك في تحدي الوعي الرقمي، وأجاب إجابةً صحيحة عن',
    certBodyF: 'قد شاركت في تحدي الوعي الرقمي، وأجابت إجابةً صحيحة عن',
    certTail: 'من أسئلة المسابقة، ومُنح',
    certTailF: 'من أسئلة المسابقة، ومُنحت',

    // الرسالة الختامية
    slogan: 'توقف .. تحقق .. ثم تصرف',
    closing: [
      'لا تشارك بياناتك السرية.',
      'لا تثق بالروابط المجهولة.',
      'لا تحول الأموال قبل التحقق.',
      'واحتفظ بالأدلة وأبلغ عن محاولات الاحتيال.',
    ],
    tagline: '«وعي يحمي .. ومجتمع مسؤول»',
    sound: 'الصوت',
  };
};

const EN = () => ({
  dir: 'ltr' as const,
  appTitle: 'Digital Awareness Challenge',
  appSubtitle: 'Confronting Cybercrime',

  onbGenderTitle: 'Who are you?',
  onbGenderHint: 'Used only to address you correctly.',
  pickCharacter: 'Tap your character to choose',
  onbAgeTitle: 'How old are you?',
  onbAgeHint: 'This helps us improve the experience and reporting.',
  ageGroups: [
    '12–17 years',
    '18–24 years',
    '25–34 years',
    '35–44 years',
    '45–54 years',
    '55–64 years',
    '65–70 years',
    'Over 70 years',
  ],
  male: 'Male',
  female: 'Female',
  onbLangTitle: 'Choose your language',
  onbLangHint: 'You can change this at any time.',
  arabic: 'العربية',
  english: 'English',
  next: 'Next',
  back: 'Back',

  play: 'Start the Challenge',
  playSub: 'A leveled challenge · one life',
  presenter: 'Presenter Mode',
  presenterSub: 'Big screen for the host',
  levels: 'Levels',
  prizes: 'Rewards',
  correctAnswers: 'correct answers',
  settings: 'Settings',
  changeChoices: 'Change language or gender',

  ready: 'Are you ready?',
  rule1: 'One life — a single wrong answer ends your run.',
  rule2: 'You can retry as many times as you like.',
  rule3: 'When you are out, you will see the correct answer and why.',
  timer: 'Question timer',
  timerSub: '45 seconds per question',
  on: 'On',
  off: 'Off',
  start: 'Start',
  getReady: 'Get ready…',
  question: 'Question',
  of: 'of',
  pick: 'Choose an answer',
  confirm: 'Confirm answer',
  oneLife: 'Careful: you have one life — a wrong answer ends the run.',
  correct: 'Correct!',
  wellDone: 'Well done — on to the next level.',
  nextQuestion: 'Next question',
  showResult: 'See result',
  streak: 'Streak',
  stageClear: 'Stage clear!',
  stageClearM: 'Stage clear!',
  continue: 'Continue',
  goldenQuestion: 'The Golden Question',
  goldenHint: 'Clear it to enter the Digital Expert level — the final challenge.',
  goldenHintKids: 'The final question! Answer right to become the Digital Awareness Champion.',
  expertStage: 'Expert stage — only the Golden Question remains!',

  gameOver: 'Run over',
  wrongAnswer: 'Wrong answer',
  timeUp: 'Time is up',
  keepLearning: 'Remember, the goal is not only to win — it is to learn how to protect yourself.',
  yourScore: 'Your score',
  reached: 'You reached',
  youPicked: 'You picked',
  correctAnswer: 'Correct answer',
  earned: 'You earned',
  newRecord: 'New record!',
  bestScore: 'Best score',
  retry: 'Try again',
  reviewMode: 'Review mode',
  reviewHint: 'Every question with its answer and explanation — outside the competition, not scored.',
  reviewAll: 'Review all questions',
  finish: 'Finish',
  menu: 'Main menu',
  youWin: 'You win!',
  champion: 'Digital Awareness Champion',
  winLine: 'You proved that digital awareness is the first line of defence against cybercrime.',
  rank: 'Title',

  shareResult: 'Share result',
  shareTextWin:
    'I got a perfect score and earned the “Digital Awareness Champion” title! Try it yourself:',
  copied: 'Link copied ✓',

  getCertificate: 'Get your certificate',
  yourCertificate: 'Certificate of Appreciation',
  nameLabel: 'Name as it should appear',
  namePlaceholder: 'Type your name',
  download: 'Download certificate',
  close: 'Close',
  certNote: 'Digital certificate — not for official use.',
  certAwarded: 'This is to certify that',
  certBody: 'took part in the Digital Awareness Challenge and answered correctly',
  certBodyF: 'took part in the Digital Awareness Challenge and answered correctly',
  certTail: 'of the challenge questions, and is awarded',
  certTailF: 'of the challenge questions, and is awarded',

  slogan: 'Stop .. Verify .. Then Act',
  closing: [
    'Never share your confidential data.',
    'Never trust unknown links.',
    'Never transfer money before verifying.',
    'Keep the evidence and report fraud attempts.',
  ],
  tagline: '“Awareness protects — a responsible community”',
  sound: 'Sound',
});

export type Strings = ReturnType<typeof EN>;

export function t(lang: Lang, gender: Gender | null): Strings {
  return lang === 'en' ? EN() : (AR(gender ?? 'male') as unknown as Strings);
}

/** نصوص المقدّم — كما وردت حرفياً من الجهة المنظمة */
export const HOST_SCRIPT = {
  intro:
    'أهلاً بكم في تحدي الوعي الرقمي. أمامكم 22 سؤالاً، وكل إجابة صحيحة تنقلكم إلى مستوى أصعب. هل أنتم مستعدون؟',
  correct: 'إجابة صحيحة! أحسنت، انتقلت إلى المستوى التالي.',
  wrong: 'إجابة غير صحيحة. تذكر أن الهدف ليس الفوز فقط، بل أن تتعلم كيف تحمي نفسك.',
  expertLevel: 'الآن وصلنا إلى مرحلة الخبراء… لم يتبقَّ سوى السؤال الذهبي!',
  beforeFinal: 'هذا هو السؤال الأخير. إجابة واحدة تفصلك عن لقب بطل الوعي الرقمي والجائزة الكبرى.',
  win: 'مبروك! أثبتَّ أن الوعي الرقمي هو خط الدفاع الأول ضد الجرائم الإلكترونية.',
};

export const KIDS_MILESTONES: Record<number, { ar: string; en: string }> = {
  3: { ar: '🎉 أحسنت! اجتزت المستوى الأول.', en: '🎉 Level one cleared!' },
  6: { ar: '🔥 رائع! اقتربت من السؤال الذهبي.', en: '🔥 Awesome! The Golden Question is near.' },
};

export const MILESTONES: Record<number, { ar: string; en: string }> = {
  5: { ar: '🎉 أحسنت! لقد اجتزت المستوى الأول.', en: '🎉 Level one cleared!' },
  10: { ar: '🏅 مبروك! وصلت إلى المستوى الثالث.', en: '🏅 You reached level three!' },
  15: { ar: '🏅 أحسنت! اجتزت المستوى المتقدم.', en: '🏅 Advanced level cleared!' },
  17: { ar: '🔥 أنت الآن على بُعد خمسة أسئلة فقط من الجائزة!', en: '🔥 Only five questions from the prize!' },
  20: {
    ar: '🏆 اجتزت السؤال الذهبي! بقي سؤالان في مستوى الخبير الرقمي.',
    en: '🏆 Golden Question cleared! Two questions left in the Digital Expert level.',
  },
  22: { ar: '🎉 مبروك! أنت الآن «بطل الوعي الرقمي».', en: '🎉 You are now the Digital Awareness Champion!' },
};
