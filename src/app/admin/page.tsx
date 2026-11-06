'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { getQuiz, questionCopy } from '@/lib/questions';

type Summary = {
  total_players: number;
  total_games: number;
  total_wrong_attempts: number;
  average_duration_seconds: number;
  arabic_games: number;
  english_games: number;
  urdu_games: number;
  kids_games: number;
  adult_games: number;
};

type QuestionStat = {
  quiz_type: 'kids' | 'adult';
  question_number: number;
  players_answered: number;
  wrong_attempts: number;
  first_try_correct_players: number;
  first_try_success_rate: number;
};

type RecentGame = {
  played_at: string;
  lang: 'ar' | 'en' | 'ur';
  age_group: string;
  gender: 'male' | 'female' | null;
  quiz_type: 'kids' | 'adult';
  wrong_attempts: number;
  score?: number | null;
  total?: number | null;
  duration_seconds: number;
  player_name?: string | null;
  player_email?: string | null;
  player_phone?: string | null;
  completed?: boolean | null;
  certificate_requested?: boolean | null;
  certificate_sent?: boolean | null;
  fraud_experience?: boolean | string | null;
  fraud_details?: string | null;
  extortion_experience?: boolean | string | null;
  extortion_details?: string | null;
};

type ReportRow = RecentGame & {
  reportId: string;
};

type StatsData = {
  summary: Summary;
  journey: {
    completed: number;
    incomplete: number;
    certificateRequested: number;
    certificateSent: number;
    fraudYes: number;
    extortionYes: number;
  };
  questions: QuestionStat[];
  recentGames: RecentGame[];
};

function questionText(stat: QuestionStat, lang: 'ar' | 'en' = 'ar') {
  const quiz = getQuiz(stat.quiz_type === 'kids');
  const question = quiz.questions.find((item) => item.n === stat.question_number);
  return question ? questionCopy(question, lang).text : 'Question ' + stat.question_number;
}

function minutes(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + String(secs).padStart(2, '0');
}

function reportId(game: RecentGame, index: number) {
  return [
    game.played_at,
    game.lang,
    game.age_group,
    game.quiz_type,
    game.wrong_attempts,
    game.duration_seconds,
    index,
  ].join('|');
}

function languageLabel(lang: RecentGame['lang']) {
  return lang === 'ar' ? 'العربية' : lang === 'ur' ? 'الأردو' : 'الإنجليزية';
}

function yesNo(value: unknown) {
  return value === true ||
    String(value ?? '').trim().toLowerCase() === 'yes' ||
    String(value ?? '').trim().toLowerCase() === 'true'
    ? 'نعم'
    : 'لا';
}

function trueFlag(value: unknown) {
  return (
    value === true ||
    String(value ?? '').trim().toLowerCase() === 'true' ||
    String(value ?? '').trim().toLowerCase() === 'yes' ||
    String(value ?? '').trim() === '1'
  );
}

function falseFlag(value: unknown) {
  return (
    value === false ||
    String(value ?? '').trim().toLowerCase() === 'false' ||
    String(value ?? '').trim().toLowerCase() === 'no' ||
    String(value ?? '').trim() === '0'
  );
}

function ltrPdfValue(value: string | number) {
  return `\u200E${String(value)}\u200E`;
}

function pdfDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
}

function completionLabel(game: RecentGame) {
  if (game.completed === true) return 'مكتملة';
  if (game.completed === false) return 'لم تكتمل';
  return 'غير محدد';
}

export default function AdminPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && key ? createClient(url, key) : null;
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'all' | RecentGame['lang']>('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [quizFilter, setQuizFilter] = useState<'all' | RecentGame['quiz_type']>('all');
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [reportLanguage, setReportLanguage] = useState<'ar' | 'en'>('ar');
  const [adminLanguage, setAdminLanguage] = useState<'ar' | 'en'>('ar');
  const [explicitlySignedIn, setExplicitlySignedIn] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const ranked = useMemo(() => {
    if (!data) return { mostWrong: null, mostCorrect: null };
    const mostWrong = [...data.questions].sort(
      (a, b) => b.wrong_attempts - a.wrong_attempts,
    )[0] ?? null;
    const mostCorrect = [...data.questions].sort(
      (a, b) =>
        Number(b.first_try_success_rate) - Number(a.first_try_success_rate) ||
        b.first_try_correct_players - a.first_try_correct_players,
    )[0] ?? null;
    return { mostWrong, mostCorrect };
  }, [data]);

  const reportRows = useMemo<ReportRow[]>(
    () =>
      (data?.recentGames ?? []).map((game, index) => ({
        ...game,
        reportId: reportId(game, index),
      })),
    [data],
  );

  const ageOptions = useMemo(
    () => [...new Set(reportRows.map((game) => game.age_group))].sort(),
    [reportRows],
  );

  const filteredReports = useMemo(() => {
    return reportRows.filter((game) => {
      const playedAt = new Date(game.played_at);
      const playedDay = [
        playedAt.getFullYear(),
        String(playedAt.getMonth() + 1).padStart(2, '0'),
        String(playedAt.getDate()).padStart(2, '0'),
      ].join('-');
      return (
        (!dateFrom || playedDay >= dateFrom) &&
        (!dateTo || playedDay <= dateTo) &&
        (languageFilter === 'all' || game.lang === languageFilter) &&
        (ageFilter === 'all' || game.age_group === ageFilter) &&
        (quizFilter === 'all' || game.quiz_type === quizFilter)
      );
    });
  }, [ageFilter, dateFrom, dateTo, languageFilter, quizFilter, reportRows]);

  const selectedReports = useMemo(
    () => reportRows.filter((game) => selectedReportIds.has(game.reportId)),
    [reportRows, selectedReportIds],
  );

  const allVisibleSelected =
    filteredReports.length > 0 &&
    filteredReports.every((game) => selectedReportIds.has(game.reportId));

  const fetchStats = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed');
      setData(result);
      setSelectedReportIds(new Set());
    } catch {
      setData(null);
      setError(adminLanguage === 'ar' ? 'تعذر تحميل الإحصائيات. تأكدي أن هذا الحساب هو حساب الأدمن.' : 'Unable to load analytics. Make sure this is the admin account.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setError(
        adminLanguage === 'ar'
          ? 'إعدادات Supabase العامة غير موجودة في ملف .env.local.'
          : 'Supabase public settings are missing from .env.local.',
      );
      return;
    }

    let alive = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive && !session) {
        setData(null);
        setExplicitlySignedIn(false);
      }
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [adminLanguage, supabase]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !email.trim() || !password || loading) return;
    setLoading(true);
    setError('');
    setNotice('');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData.session) {
      setLoading(false);
      setError(adminLanguage === 'ar' ? 'الإيميل أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.');
      return;
    }

    setExplicitlySignedIn(true);
    await fetchStats(authData.session.access_token);
  }

  async function sendResetLink(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !email.trim() || loading) return;
    setLoading(true);
    setError('');
    setNotice('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(adminLanguage === 'ar' ? 'تعذر إرسال رابط الاسترجاع. تأكدي من الإيميل وإعدادات Supabase.' : 'Unable to send the reset link. Check the email and Supabase settings.');
      return;
    }
    setNotice(adminLanguage === 'ar' ? 'إذا كان الإيميل مسجلاً، سيصلك رابط لتعيين كلمة مرور جديدة.' : 'If the email is registered, a password reset link will be sent.');
  }

  async function refreshStats() {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setData(null);
      setError(adminLanguage === 'ar' ? 'انتهت جلسة الدخول. سجّلي الدخول مرة أخرى.' : 'Your session has expired. Please sign in again.');
      return;
    }
    await fetchStats(token);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setData(null);
    setExplicitlySignedIn(false);
    setPassword('');
    setError('');
    setNotice(adminLanguage === 'ar' ? 'تم تسجيل الخروج.' : 'Signed out successfully.');
  }

  useEffect(() => {
    if (!supabase || !explicitlySignedIn || !data) return;

    const timer = window.setInterval(() => {
      void (async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;

        try {
          const response = await fetch('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (!response.ok) return;
          const result = await response.json();
          setData(result);
        } catch {
          // Keep the current dashboard visible if a background refresh fails.
        }
      })();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [data, explicitlySignedIn, supabase]);

  function toggleReport(id: string) {
    setSelectedReportIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedReportIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        filteredReports.forEach((game) => next.delete(game.reportId));
      } else {
        filteredReports.forEach((game) => next.add(game.reportId));
      }
      return next;
    });
  }

  function clearFilters() {
    setDateFrom('');
    setDateTo('');
    setLanguageFilter('all');
    setAgeFilter('all');
    setQuizFilter('all');
  }

  async function downloadPdf() {
    if (!data || selectedReports.length === 0 || pdfGenerating) return;

    setPdfGenerating(true);
    try {
      const isArabic = reportLanguage === 'ar';
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      // Arabic PDF text needs a Unicode Arabic font.
      // Put NotoSansArabic-Regular.ttf here: public/fonts/NotoSansArabic-Regular.ttf
      if (isArabic) {
        const fontCandidates = [
          '/fonts/NotoSansArabic-Regular.ttf',
          '/fonts/NotoSansArabic%5Bwdth,wght%5D.ttf',
          '/fonts/NotoSansArabic[wdth,wght].ttf',
        ];

        let fontBuffer: ArrayBuffer | null = null;

        for (const fontPath of fontCandidates) {
          try {
            const fontResponse = await fetch(fontPath, { cache: 'no-store' });
            if (!fontResponse.ok) continue;

            const buffer = await fontResponse.arrayBuffer();
            if (buffer.byteLength > 1000) {
              fontBuffer = buffer;
              break;
            }
          } catch {
            // Try the next supported filename.
          }
        }

        if (!fontBuffer) {
          throw new Error('ARABIC_FONT_MISSING');
        }

        const bytes = new Uint8Array(fontBuffer);
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }
        const base64Font = btoa(binary);

        pdf.addFileToVFS('NotoArabic.ttf', base64Font);
        pdf.addFont('NotoArabic.ttf', 'NotoArabic', 'normal');
        pdf.setFont('NotoArabic', 'normal');
      } else {
        pdf.setFont('helvetica', 'normal');
      }

      const shapeArabic = (value: string) => {
        if (!isArabic) return value;
        const candidate = pdf as jsPDF & { processArabic?: (text: string) => string };
        return candidate.processArabic ? candidate.processArabic(value) : value;
      };

      const t = (ar: string, en: string) => (isArabic ? ar : en);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      const navy: [number, number, number] = [16, 43, 76];
      const gold: [number, number, number] = [230, 145, 0];
      const green: [number, number, number] = [46, 125, 50];
      const red: [number, number, number] = [211, 47, 47];
      const blue: [number, number, number] = [30, 136, 229];
      const purple: [number, number, number] = [123, 31, 162];
      const teal: [number, number, number] = [0, 137, 123];
      const orange: [number, number, number] = [194, 65, 12];
      const gray: [number, number, number] = [102, 112, 133];
      const light: [number, number, number] = [244, 247, 250];
      const line: [number, number, number] = [218, 225, 232];

      const drawText = (
        value: string,
        x: number,
        y: number,
        options: {
          size?: number;
          color?: [number, number, number];
          align?: 'left' | 'center' | 'right';
          maxWidth?: number;
        } = {},
      ) => {
        pdf.setFontSize(options.size ?? 10);
        const color = options.color ?? navy;
        pdf.setTextColor(color[0], color[1], color[2]);
        const align = options.align ?? (isArabic ? 'right' : 'left');
        const shaped = shapeArabic(value);

        if (options.maxWidth) {
          const lines = pdf.splitTextToSize(shaped, options.maxWidth);
          pdf.text(lines, x, y, { align });
          return Array.isArray(lines) ? lines.length : 1;
        }

        pdf.text(shaped, x, y, { align });
        return 1;
      };

      const addHeader = (title: string, subtitle?: string) => {
        pdf.setFillColor(navy[0], navy[1], navy[2]);
        pdf.rect(0, 0, pageWidth, 7, 'F');
        pdf.setFillColor(gold[0], gold[1], gold[2]);
        pdf.rect(0, 7, pageWidth, 1.5, 'F');

        drawText(
          title,
          isArabic ? pageWidth - margin : margin,
          18,
          { size: 18, color: navy, align: isArabic ? 'right' : 'left' },
        );

        if (subtitle) {
          drawText(
            subtitle,
            isArabic ? pageWidth - margin : margin,
            25,
            { size: 8.5, color: gray, align: isArabic ? 'right' : 'left' },
          );
        }
      };

      const drawCard = (
        x: number,
        y: number,
        w: number,
        h: number,
        label: string,
        value: string | number,
        accent: [number, number, number],
      ) => {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(line[0], line[1], line[2]);
        pdf.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');

        pdf.setFillColor(accent[0], accent[1], accent[2]);
        if (isArabic) pdf.rect(x + w - 2, y, 2, h, 'F');
        else pdf.rect(x, y, 2, h, 'F');

        drawText(
          label,
          isArabic ? x + w - 5 : x + 5,
          y + 7,
          { size: 8.2, color: gray, align: isArabic ? 'right' : 'left', maxWidth: w - 10 },
        );

        drawText(
          String(value),
          isArabic ? x + w - 5 : x + 5,
          y + h - 5,
          { size: 16, color: accent, align: isArabic ? 'right' : 'left' },
        );
      };

      const completed = selectedReports.filter((game) => trueFlag(game.completed)).length;
      const incomplete = selectedReports.filter((game) => falseFlag(game.completed)).length;
      const certificateRequested = selectedReports.filter((game) => trueFlag(game.certificate_requested)).length;
      const certificateSent = selectedReports.filter((game) => trueFlag(game.certificate_sent)).length;
      const fraudYes = selectedReports.filter((game) => yesNo(game.fraud_experience) === 'نعم').length;
      const extortionYes = selectedReports.filter((game) => yesNo(game.extortion_experience) === 'نعم').length;
      const wrongAttempts = selectedReports.reduce((sum, game) => sum + game.wrong_attempts, 0);
      const averageDuration = Math.round(
        selectedReports.reduce((sum, game) => sum + game.duration_seconds, 0) /
          selectedReports.length,
      );

      const languageCounts = selectedReports.reduce(
        (counts, game) => ({ ...counts, [game.lang]: counts[game.lang] + 1 }),
        { ar: 0, en: 0, ur: 0 },
      );
      const kidsGames = selectedReports.filter((game) => game.quiz_type === 'kids').length;

      // ---------------- PAGE 1: SUMMARY ----------------
      addHeader(
        t('تقرير تحليلات الوعي الرقمي', 'Digital Awareness Analytics Report'),
        isArabic
          ? `تاريخ إنشاء التقرير: ${ltrPdfValue(pdfDate(new Date().toISOString()))}`
          : `Report generated: ${new Date().toLocaleString('en-GB')}`,
      );

      const cards = [
        [t('عدد التقارير المحددة', 'Selected reports'), selectedReports.length, navy],
        [t('أكملوا اللعبة', 'Completed'), completed, green],
        [t('دخلوا ولم يكملوا', 'Incomplete'), incomplete, red],
        [t('طلبوا الشهادة', 'Certificate requested'), certificateRequested, gold],
        [t('تم إرسال الشهادة', 'Certificate sent'), certificateSent, blue],
        [t('احتيال إلكتروني', 'Online fraud'), fraudYes, purple],
        [t('ابتزاز إلكتروني', 'Online blackmail'), extortionYes, teal],
        [t('المحاولات الخاطئة', 'Wrong attempts'), wrongAttempts, orange],
      ] as const;

      const cardGap = 4;
      const cardW = (contentWidth - cardGap * 3) / 4;
      const cardH = 27;
      cards.forEach(([label, value, accent], index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = margin + col * (cardW + cardGap);
        const y = 35 + row * (cardH + 5);
        drawCard(x, y, cardW, cardH, label, value, accent);
      });

      pdf.setFillColor(light[0], light[1], light[2]);
      pdf.roundedRect(margin, 98, contentWidth, 23, 3, 3, 'F');

      drawText(
        t(
          `متوسط مدة اللعب: ${ltrPdfValue(minutes(averageDuration))}   |   العربية: ${ltrPdfValue(languageCounts.ar)}   |   الإنجليزية: ${ltrPdfValue(languageCounts.en)}   |   الأردو: ${ltrPdfValue(languageCounts.ur)}`,
          `Average duration: ${minutes(averageDuration)}   |   Arabic: ${languageCounts.ar}   |   English: ${languageCounts.en}   |   Urdu: ${languageCounts.ur}`,
        ),
        isArabic ? pageWidth - margin - 4 : margin + 4,
        107,
        { size: 9, color: navy, align: isArabic ? 'right' : 'left' },
      );

      drawText(
        t(
          `فئة الأطفال: ${ltrPdfValue(kidsGames)}   |   فئة البالغين: ${ltrPdfValue(selectedReports.length - kidsGames)}`,
          `Children: ${kidsGames}   |   Adults: ${selectedReports.length - kidsGames}`,
        ),
        isArabic ? pageWidth - margin - 4 : margin + 4,
        116,
        { size: 9, color: navy, align: isArabic ? 'right' : 'left' },
      );

      drawText(
        t('الرسم البياني لمسار اللاعبين', 'Player journey'),
        isArabic ? pageWidth - margin : margin,
        136,
        { size: 13, color: navy, align: isArabic ? 'right' : 'left' },
      );

      const chartRows = [
        { label: t('أكملوا اللعبة', 'Completed'), value: completed, color: green },
        { label: t('لم يكملوا', 'Incomplete'), value: incomplete, color: red },
        { label: t('طلبوا الشهادة', 'Certificate requested'), value: certificateRequested, color: gold },
        { label: t('تم إرسال الشهادة', 'Certificate sent'), value: certificateSent, color: blue },
        { label: t('احتيال إلكتروني', 'Online fraud'), value: fraudYes, color: purple },
        { label: t('ابتزاز إلكتروني', 'Online blackmail'), value: extortionYes, color: teal },
      ];

      const maxChartValue = Math.max(1, ...chartRows.map((row) => row.value));
      const chartLabelW = 46;
      const chartBarW = contentWidth - chartLabelW - 18;
      let chartY = 146;

      chartRows.forEach((row) => {
        drawText(
          row.label,
          isArabic ? pageWidth - margin : margin,
          chartY + 4.2,
          { size: 8.5, color: navy, align: isArabic ? 'right' : 'left' },
        );

        const barX = isArabic ? margin + 12 : margin + chartLabelW;
        pdf.setFillColor(235, 240, 245);
        pdf.roundedRect(barX, chartY, chartBarW, 5, 2.5, 2.5, 'F');

        const fillW = (row.value / maxChartValue) * chartBarW;
        if (fillW > 0) {
          pdf.setFillColor(row.color[0], row.color[1], row.color[2]);
          pdf.roundedRect(barX, chartY, fillW, 5, 2.5, 2.5, 'F');
        }

        drawText(
          String(row.value),
          isArabic ? margin + 7 : pageWidth - margin,
          chartY + 4.2,
          { size: 8.5, color: navy, align: isArabic ? 'left' : 'right' },
        );

        chartY += 16;
      });

      // ---------------- DETAILS PAGES ----------------
      const rowsPerPage = 8;

      for (let startIndex = 0; startIndex < selectedReports.length; startIndex += rowsPerPage) {
        pdf.addPage();
        const pageRows = selectedReports.slice(startIndex, startIndex + rowsPerPage);

        addHeader(
          t('تفاصيل اللاعبين', 'Player Details'),
          t(
            `السجلات ${ltrPdfValue(startIndex + 1)} - ${ltrPdfValue(Math.min(startIndex + rowsPerPage, selectedReports.length))} من ${ltrPdfValue(selectedReports.length)}`,
            `Records ${startIndex + 1} - ${Math.min(startIndex + rowsPerPage, selectedReports.length)} of ${selectedReports.length}`,
          ),
        );

        let y = 34;

        pageRows.forEach((game, localIndex) => {
          const index = startIndex + localIndex + 1;
          const rowH = 29;

          pdf.setFillColor(localIndex % 2 === 0 ? 248 : 252, localIndex % 2 === 0 ? 250 : 253, 255);
          pdf.setDrawColor(line[0], line[1], line[2]);
          pdf.roundedRect(margin, y, contentWidth, rowH, 2.5, 2.5, 'FD');

          drawText(
            isArabic
              ? `${game.player_name || 'غير مسجل'}  ${ltrPdfValue(index)}`
              : `${index}. ${game.player_name || 'Not recorded'}`,
            isArabic ? pageWidth - margin - 4 : margin + 4,
            y + 6,
            { size: 9.5, color: navy, align: isArabic ? 'right' : 'left' },
          );

          // Email is always LTR.
          pdf.setFont(isArabic ? 'NotoArabic' : 'helvetica', 'normal');
          pdf.setFontSize(7.7);
          pdf.setTextColor(blue[0], blue[1], blue[2]);
          pdf.text(
            [
              game.player_email || t('غير مسجل', 'Not recorded'),
              game.player_phone ? ` | ${t('هاتف', 'Phone')}: ${game.player_phone}` : '',
            ].join(''),
            isArabic ? margin + 4 : pageWidth - margin - 4,
            y + 6,
            { align: isArabic ? 'left' : 'right' },
          );

          const dateText = isArabic
            ? `التاريخ: ${ltrPdfValue(pdfDate(game.played_at))}   |   العمر: ${ltrPdfValue(game.age_group)}   |   اللغة: ${game.lang === 'ar' ? ui.arabic : game.lang === 'ur' ? ui.urdu : ui.english}`
            : `Date: ${new Date(game.played_at).toLocaleString('en-GB')}   |   Age: ${game.age_group}   |   Language: ${
                game.lang === 'ar' ? 'Arabic' : game.lang === 'ur' ? 'Urdu' : 'English'
              }`;

          const statusText = isArabic
            ? `الفئة: ${game.quiz_type === 'kids' ? ui.kids : ui.adults}   |   الحالة: ${
                trueFlag(game.completed)
                  ? ui.completedStatus
                  : falseFlag(game.completed)
                    ? ui.incompleteStatus
                    : ui.unspecified
              }   |   الشهادة: ${
                trueFlag(game.certificate_requested)
                  ? trueFlag(game.certificate_sent)
                    ? 'تم الإرسال'
                    : 'طُلبت'
                  : 'لم تُطلب'
              }`
            : `Group: ${game.quiz_type === 'kids' ? 'Children' : 'Adults'}   |   Status: ${
                trueFlag(game.completed) ? 'Completed' : falseFlag(game.completed) ? 'Incomplete' : 'Not specified'
              }   |   Certificate: ${
                trueFlag(game.certificate_requested)
                  ? trueFlag(game.certificate_sent)
                    ? 'Sent'
                    : 'Requested'
                  : 'Not requested'
              }`;

          const securityText = isArabic
            ? `احتيال إلكتروني: ${yesNo(game.fraud_experience) === 'نعم' ? ui.yes : ui.no}   |   ابتزاز إلكتروني: ${yesNo(game.extortion_experience) === 'نعم' ? ui.yes : ui.no}   |   الأخطاء: ${ltrPdfValue(game.wrong_attempts)}   |   المدة: ${ltrPdfValue(minutes(game.duration_seconds))}`
            : `Online fraud: ${yesNo(game.fraud_experience) === 'نعم' ? 'Yes' : 'No'}   |   Online blackmail: ${
                yesNo(game.extortion_experience) === 'نعم' ? 'Yes' : 'No'
              }   |   Wrong answers: ${game.wrong_attempts}   |   Duration: ${minutes(game.duration_seconds)}`;

          drawText(
            dateText,
            isArabic ? pageWidth - margin - 4 : margin + 4,
            y + 13,
            { size: 7.6, color: gray, align: isArabic ? 'right' : 'left' },
          );

          drawText(
            statusText,
            isArabic ? pageWidth - margin - 4 : margin + 4,
            y + 19,
            { size: 7.6, color: gray, align: isArabic ? 'right' : 'left' },
          );

          drawText(
            securityText,
            isArabic ? pageWidth - margin - 4 : margin + 4,
            y + 25,
            { size: 7.6, color: gray, align: isArabic ? 'right' : 'left' },
          );

          y += rowH + 3;
        });
      }

      pdf.save(
        (isArabic ? 'تقرير-تحليلات-الوعي-الرقمي-' : 'digital-awareness-analytics-report-') +
          new Date().toISOString().slice(0, 10) +
          '.pdf',
      );
    } catch (error) {
      console.error('PDF generation failed:', error);
      if (error instanceof Error && error.message === 'ARABIC_FONT_MISSING') {
        setError(
          'تعذر العثور على الخط العربي داخل public/fonts. تأكدي أن ملف Noto Sans Arabic موجود ثم حاولي مرة أخرى.',
        );
      } else {
        setError('تعذر إنشاء ملف PDF. حاولي مرة أخرى.');
      }
    } finally {
      setPdfGenerating(false);
    }
  }

  const adminAr = adminLanguage === 'ar';
  const ui = {
    title: adminAr ? 'إحصائيات تحدي الوعي الرقمي' : 'Digital Awareness Challenge Analytics',
    subtitle: adminAr
      ? 'لوحة داخلية للأدمن تعرض حالة إكمال اللعبة والشهادات والبيانات المسجلة.'
      : 'Internal admin dashboard for game completion, certificates, and recorded player data.',
    loginTitle: adminAr ? 'لوحة إحصائيات الأدمن' : 'Admin Analytics',
    loginHelp: adminAr
      ? 'سجّلي الدخول بحساب الأدمن لعرض إحصائيات جميع اللاعبين.'
      : 'Sign in with the admin account to view all player analytics.',
    forgotHelp: adminAr
      ? 'أدخلي إيميل الأدمن وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.'
      : 'Enter the admin email and we will send you a password reset link.',
    adminEmail: adminAr ? 'إيميل الأدمن' : 'Admin email',
    password: adminAr ? 'كلمة المرور' : 'Password',
    hide: adminAr ? 'إخفاء' : 'Hide',
    show: adminAr ? 'إظهار' : 'Show',
    forgot: adminAr ? 'نسيت كلمة المرور؟' : 'Forgot password?',
    working: adminAr ? 'جاري التنفيذ…' : 'Working…',
    sendReset: adminAr ? 'إرسال رابط الاسترجاع' : 'Send reset link',
    login: adminAr ? 'دخول' : 'Sign in',
    backLogin: adminAr ? 'الرجوع لتسجيل الدخول' : 'Back to sign in',
    backGame: adminAr ? 'الرجوع للعبة' : 'Back to game',
    refresh: adminAr ? 'تحديث' : 'Refresh',
    logout: adminAr ? 'تسجيل الخروج' : 'Sign out',
    players: adminAr ? 'عدد اللاعبين' : 'Total players',
    completed: adminAr ? 'أكملوا اللعبة' : 'Completed',
    incomplete: adminAr ? 'دخلوا ولم يكملوا' : 'Incomplete',
    requested: adminAr ? 'طلبوا الشهادة' : 'Certificate requested',
    sent: adminAr ? 'تم إرسال الشهادة' : 'Certificate sent',
    fraud: adminAr ? 'ذكروا احتيالًا إلكترونيًا' : 'Reported online fraud',
    extortion: adminAr ? 'ذكروا ابتزازًا إلكترونيًا' : 'Reported online blackmail',
    avg: adminAr ? 'متوسط مدة الجولة' : 'Average duration',
    journey: adminAr ? 'مسار اللاعبين' : 'Player journey',
    journeySub: adminAr
      ? 'مقارنة سريعة بين إكمال اللعبة والوصول إلى الشهادة.'
      : 'Quick comparison of game completion and certificate progress.',
    mostWrong: adminAr ? 'أكثر سؤال كانت إجابته خاطئة' : 'Most-missed question',
    mostCorrect: adminAr ? 'أكثر سؤال أُجيب عنه صحيحًا من أول محاولة' : 'Best first-try question',
    wrongAttempt: adminAr ? 'محاولة خاطئة' : 'wrong attempts',
    noData: adminAr ? 'لا توجد بيانات' : 'No data',
    questionDetails: adminAr ? 'تفاصيل الأسئلة' : 'Question details',
    group: adminAr ? 'الفئة' : 'Group',
    question: adminAr ? 'السؤال' : 'Question',
    playersCol: adminAr ? 'اللاعبون' : 'Players',
    wrongCol: adminAr ? 'المحاولات الخاطئة' : 'Wrong attempts',
    firstTry: adminAr ? 'صحيح من أول محاولة' : 'First-try correct',
    success: adminAr ? 'نسبة النجاح' : 'Success rate',
    kids: adminAr ? 'أطفال' : 'Children',
    adults: adminAr ? 'بالغون' : 'Adults',
    reports: adminAr ? 'تقارير الجولات' : 'Game reports',
    reportsHint: adminAr
      ? 'فلّري النتائج، ثم حددي التقارير التي تريدين تنزيلها.'
      : 'Filter the results, then select the reports you want to download.',
    visible: adminAr ? 'الظاهر' : 'Visible',
    selected: adminAr ? 'المحدد' : 'Selected',
    reportLanguage: adminAr ? 'لغة التقرير' : 'Report language',
    reportArabic: adminAr ? 'التقرير بالعربي' : 'Report in Arabic',
    reportEnglish: adminAr ? 'التقرير بالإنجليزي' : 'Report in English',
    preparing: adminAr ? 'جاري تجهيز التقرير...' : 'Preparing report...',
    downloadPdf: adminAr ? 'تنزيل PDF' : 'Download PDF',
    from: adminAr ? 'من تاريخ' : 'From date',
    to: adminAr ? 'إلى تاريخ' : 'To date',
    language: adminAr ? 'اللغة' : 'Language',
    age: adminAr ? 'الفئة العمرية' : 'Age group',
    gameType: adminAr ? 'فئة اللعبة' : 'Game type',
    allLanguages: adminAr ? 'كل اللغات' : 'All languages',
    arabic: adminAr ? 'العربية' : 'Arabic',
    english: adminAr ? 'الإنجليزية' : 'English',
    urdu: adminAr ? 'الأردو' : 'Urdu',
    allAges: adminAr ? 'كل الأعمار' : 'All ages',
    all: adminAr ? 'الكل' : 'All',
    selectVisible: adminAr ? 'تحديد الكل الظاهر' : 'Select all visible',
    unselectVisible: adminAr ? 'إلغاء تحديد الظاهر' : 'Unselect visible',
    clearSelected: adminAr ? 'إلغاء كل التحديد' : 'Clear selection',
    clearFilters: adminAr ? 'مسح الفلاتر' : 'Clear filters',
    select: adminAr ? 'تحديد' : 'Select',
    name: adminAr ? 'الاسم' : 'Name',
    email: adminAr ? 'البريد الإلكتروني' : 'Email',
    phone: adminAr ? 'رقم الهاتف' : 'Phone',
    date: adminAr ? 'التاريخ' : 'Date',
    status: adminAr ? 'الحالة' : 'Status',
    certificate: adminAr ? 'الشهادة' : 'Certificate',
    fraudShort: adminAr ? 'احتيال' : 'Fraud',
    extortionShort: adminAr ? 'ابتزاز' : 'Blackmail',
    errors: adminAr ? 'الأخطاء' : 'Errors',
    correct: adminAr ? 'الإجابات الصحيحة' : 'Correct answers',
    totalQuestions: adminAr ? 'إجمالي الأسئلة' : 'Total questions',
    duration: adminAr ? 'المدة' : 'Duration',
    incidentsTitle: adminAr ? 'تفاصيل الاحتيال والابتزاز' : 'Fraud & Blackmail Details',
    incidentsHint: adminAr ? 'يظهر هنا اسم اللاعب وبياناته وتفاصيل الإجابة عن سؤالي الاحتيال والابتزاز بشكل مستقل عن تقرير الجولة.' : 'This section shows the player details and fraud/blackmail responses separately from the round report.',
    completedStatus: adminAr ? 'مكتملة' : 'Completed',
    incompleteStatus: adminAr ? 'لم تكتمل' : 'Incomplete',
    unspecified: adminAr ? 'غير محدد' : 'Not specified',
    sentStatus: adminAr ? 'تم الإرسال' : 'Sent',
    requestedStatus: adminAr ? 'طُلبت' : 'Requested',
    yes: adminAr ? 'نعم' : 'Yes',
    no: adminAr ? 'لا' : 'No',
    noReports: adminAr
      ? 'لا توجد تقارير مطابقة للفلاتر المختارة.'
      : 'No reports match the selected filters.',
  };

  if (!data || !explicitlySignedIn) {
    return (
      <main dir={adminAr ? 'rtl' : 'ltr'} className="mx-auto flex min-h-dvh max-w-md items-center px-4">
        <form onSubmit={forgotMode ? sendResetLink : signIn} className="pxl w-full bg-white p-6">
          <div className="mb-5 flex justify-end">
            <select
              value={adminLanguage}
              onChange={(event) => setAdminLanguage(event.target.value as 'ar' | 'en')}
              className="rounded-xl border-2 border-[var(--line)] bg-white px-3 py-2 text-sm font-black"
            >
              <option value="ar">{ui.arabic}</option>
              <option value="en">English</option>
            </select>
          </div>
          <h1 className="text-2xl font-black">{ui.loginTitle}</h1>
          <p className="mt-3 text-sm font-bold text-[var(--fg-muted)]">
            {forgotMode ? ui.forgotHelp : ui.loginHelp}
          </p>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={ui.adminEmail}
            autoComplete="email"
            dir="ltr"
            className="mt-5 w-full rounded-2xl border-2 border-[var(--line)] px-4 py-3 text-left outline-none"
          />
          {!forgotMode && <div className="relative mt-3">
            <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={ui.password}
            autoComplete="current-password"
            dir="ltr"
            className="w-full rounded-2xl border-2 border-[var(--line)] py-3 pl-20 pr-4 text-left outline-none"
          />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--fg-muted)]"
            >
              {showPassword ? ui.hide : ui.show}
            </button>
          </div>}
          {!forgotMode && <button
            type="button"
            onClick={() => {
              setForgotMode(true);
              setError('');
              setNotice('');
            }}
            className="mt-3 text-sm font-black text-blue-700 underline"
          >
            نسيت كلمة المرور؟
          </button>}
          {error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}
          {notice && <p className="mt-3 text-sm font-bold text-green-700">{notice}</p>}
          <button
            disabled={!email.trim() || (!forgotMode && !password) || loading || !supabase}
            className="mt-4 w-full rounded-2xl bg-[var(--green)] px-5 py-3 font-black text-white disabled:opacity-50"
          >
            {loading ? ui.working : forgotMode ? ui.sendReset : ui.login}
          </button>
          {forgotMode && <button
            type="button"
            onClick={() => {
              setForgotMode(false);
              setError('');
              setNotice('');
            }}
            className="mt-3 w-full rounded-2xl border-2 border-[var(--line)] px-5 py-3 font-black"
          >
            الرجوع لتسجيل الدخول
          </button>}
          <Link href="/" className="mt-4 block text-center text-sm font-bold text-[var(--fg-muted)]">
            الرجوع للعبة
          </Link>
        </form>
      </main>
    );
  }

  const summary = data.summary;
  const journey = data.journey ?? {
    completed: 0,
    incomplete: 0,
    certificateRequested: 0,
    certificateSent: 0,
    fraudYes: 0,
    extortionYes: 0,
  };

  return (
    <main dir={adminAr ? 'rtl' : 'ltr'} className="mx-auto min-h-dvh max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{ui.title}</h1>
          <p className="mt-2 text-sm font-bold text-[var(--fg-muted)]">
            {ui.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={adminLanguage}
            onChange={(event) => setAdminLanguage(event.target.value as 'ar' | 'en')}
            className="rounded-2xl border-2 border-[var(--line)] bg-white px-4 py-3 text-sm font-black"
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
          <button onClick={() => void refreshStats()} className="rounded-2xl bg-[var(--green)] px-4 py-3 font-black text-white">
            تحديث
          </button>
          <button onClick={() => void signOut()} className="rounded-2xl bg-slate-700 px-4 py-3 font-black text-white">
            تسجيل الخروج
          </button>
        </div>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label={ui.players} value={summary.total_players} />
        <Card label={ui.completed} value={journey.completed} />
        <Card label={ui.incomplete} value={journey.incomplete} />
        <Card label={ui.requested} value={journey.certificateRequested} />
        <Card label={ui.sent} value={journey.certificateSent} />
        <Card label={ui.fraud} value={journey.fraudYes} />
        <Card label={ui.extortion} value={journey.extortionYes} />
        <Card label={ui.avg} value={minutes(summary.average_duration_seconds)} />
      </section>

      <section className="pxl mt-6 bg-white p-5">
        <h2 className="text-xl font-black">{ui.journey}</h2>
        <p className="mt-1 text-xs font-bold text-[var(--fg-muted)]">
          {ui.journeySub}
        </p>
        <div className="mt-5 space-y-4">
          <ProgressBar label={ui.completed} value={journey.completed} total={Math.max(summary.total_players, 1)} />
          <ProgressBar label={ui.incomplete} value={journey.incomplete} total={Math.max(summary.total_players, 1)} />
          <ProgressBar label={ui.requested} value={journey.certificateRequested} total={Math.max(summary.total_players, 1)} />
          <ProgressBar label={ui.sent} value={journey.certificateSent} total={Math.max(summary.total_players, 1)} />
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <Highlight
          title={ui.mostWrong}
          stat={ranked.mostWrong}
          detail={ranked.mostWrong ? ranked.mostWrong.wrong_attempts + ' ' + ui.wrongAttempt : ui.noData}
          color="#b3261e"
        />
        <Highlight
          title={ui.mostCorrect}
          stat={ranked.mostCorrect}
          detail={ranked.mostCorrect ? Number(ranked.mostCorrect.first_try_success_rate).toFixed(1) + '%' : ui.noData}
          color="#1c7d4d"
        />
      </section>

      <section className="pxl mt-6 overflow-x-auto bg-white p-4">
        <h2 className="text-xl font-black">{ui.questionDetails}</h2>
        <table className="mt-4 w-full min-w-[760px] text-sm">
          <thead>
            <tr className={`border-b ${adminAr ? 'text-right' : 'text-left'}`}>
              <th className="p-2">{ui.group}</th>
              <th className="p-2">{ui.question}</th>
              <th className="p-2">{ui.playersCol}</th>
              <th className="p-2">{ui.wrongCol}</th>
              <th className="p-2">{ui.firstTry}</th>
              <th className="p-2">{ui.success}</th>
            </tr>
          </thead>
          <tbody>
            {data.questions.map((stat) => (
              <tr key={stat.quiz_type + '-' + stat.question_number} className="border-b border-[var(--line)]">
                <td className="p-2 font-bold">{stat.quiz_type === 'kids' ? ui.kids : ui.adults}</td>
                <td className="max-w-md p-2">{stat.question_number}. {questionText(stat, adminAr ? 'ar' : 'en')}</td>
                <td className="p-2">{stat.players_answered}</td>
                <td className="p-2 text-red-700">{stat.wrong_attempts}</td>
                <td className="p-2 text-green-700">{stat.first_try_correct_players}</td>
                <td className="p-2 font-black">{Number(stat.first_try_success_rate).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="pxl mt-6 overflow-x-auto bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">{ui.reports}</h2>
            <p className="mt-1 text-xs font-bold text-[var(--fg-muted)]">
              {ui.reportsHint}
            </p>
          </div>
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black">
            {ui.visible}: {filteredReports.length} — {ui.selected}: {selectedReports.length}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-[var(--line)] bg-white p-4">
          <div className="min-w-[220px] flex-1">
            <p className="mb-1 text-xs font-black text-[var(--fg-muted)]">{ui.reportLanguage}</p>
            <select
              value={reportLanguage}
              onChange={(event) => setReportLanguage(event.target.value as 'ar' | 'en')}
              className="w-full rounded-xl border-2 border-[var(--line)] bg-white px-3 py-2.5 text-sm font-black"
            >
              <option value="ar">{ui.reportArabic}</option>
              <option value="en">{ui.reportEnglish}</option>
            </select>
          </div>

          <button
            onClick={() => void downloadPdf()}
            disabled={selectedReports.length === 0 || pdfGenerating}
            className="mt-5 rounded-xl bg-[var(--gold)] px-5 py-2.5 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pdfGenerating
              ? reportLanguage === 'ar'
                ? 'جاري تجهيز التقرير...'
                : 'Preparing report...'
              : reportLanguage === 'ar'
                ? `${ui.downloadPdf} (${selectedReports.length})`
                : `${ui.downloadPdf} (${selectedReports.length})`}
          </button>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border-2 border-[var(--line)] bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-black text-[var(--fg-muted)]">
            {ui.from}
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-[var(--line)] bg-white px-3 py-2 text-sm"
              dir="ltr"
            />
          </label>
          <label className="text-xs font-black text-[var(--fg-muted)]">
            {ui.to}
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-[var(--line)] bg-white px-3 py-2 text-sm"
              dir="ltr"
            />
          </label>
          <label className="text-xs font-black text-[var(--fg-muted)]">
            {ui.language}
            <select
              value={languageFilter}
              onChange={(event) => setLanguageFilter(event.target.value as typeof languageFilter)}
              className="mt-1 w-full rounded-xl border-2 border-[var(--line)] bg-white px-3 py-2 text-sm"
            >
              <option value="all">{ui.allLanguages}</option>
              <option value="ar">{ui.arabic}</option>
              <option value="en">{ui.english}</option>
              <option value="ur">{ui.urdu}</option>
            </select>
          </label>
          <label className="text-xs font-black text-[var(--fg-muted)]">
            {ui.age}
            <select
              value={ageFilter}
              onChange={(event) => setAgeFilter(event.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-[var(--line)] bg-white px-3 py-2 text-sm"
            >
              <option value="all">{ui.allAges}</option>
              {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
            </select>
          </label>
          <label className="text-xs font-black text-[var(--fg-muted)]">
            {ui.gameType}
            <select
              value={quizFilter}
              onChange={(event) => setQuizFilter(event.target.value as typeof quizFilter)}
              className="mt-1 w-full rounded-xl border-2 border-[var(--line)] bg-white px-3 py-2 text-sm"
            >
              <option value="all">{ui.all}</option>
              <option value="kids">{ui.kids}</option>
              <option value="adult">{ui.adults}</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleAllVisible}
            disabled={filteredReports.length === 0}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white disabled:opacity-45"
          >
            {allVisibleSelected ? ui.unselectVisible : ui.selectVisible}
          </button>
          <button
            type="button"
            onClick={() => setSelectedReportIds(new Set())}
            disabled={selectedReports.length === 0}
            className="rounded-xl border-2 border-[var(--line)] bg-white px-4 py-2 text-sm font-black disabled:opacity-45"
          >
            {ui.clearSelected}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border-2 border-[var(--line)] bg-white px-4 py-2 text-sm font-black"
          >
            {ui.clearFilters}
          </button>
        </div>

        <table className="mt-4 w-full min-w-[1650px] text-sm">
          <thead>
            <tr className={`border-b ${adminAr ? 'text-right' : 'text-left'}`}>
              <th className="p-2">{ui.select}</th>
              <th className="p-2">{ui.name}</th>
              <th className="p-2">{ui.email}</th>
              <th className="p-2">{ui.phone}</th>
              <th className="p-2">{ui.date}</th>
              <th className="p-2">{ui.language}</th>
              <th className="p-2">{ui.age}</th>
              <th className="p-2">{ui.group}</th>
              <th className="p-2">{ui.status}</th>
              <th className="p-2">{ui.certificate}</th>
              <th className="p-2">{ui.errors}</th>
              <th className="p-2">{ui.correct}</th>
              <th className="p-2">{ui.totalQuestions}</th>
              <th className="p-2">{ui.duration}</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((game) => (
              <tr key={game.reportId} className="border-b border-[var(--line)]">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedReportIds.has(game.reportId)}
                    onChange={() => toggleReport(game.reportId)}
                    aria-label={
                      (adminAr ? 'تحديد تقرير ' : 'Select report ') +
                      new Date(game.played_at).toLocaleString(adminAr ? 'ar-AE' : 'en-GB')
                    }
                    className="h-5 w-5 accent-blue-700"
                  />
                </td>
                <td className="p-2 font-bold">{game.player_name || '—'}</td>
                <td className="p-2" dir="ltr">{game.player_email || '—'}</td>
                <td className="p-2" dir="ltr">{game.player_phone || '—'}</td>
                <td className="p-2" dir="ltr">{new Date(game.played_at).toLocaleString('en-GB')}</td>
                <td className="p-2">
                  {game.lang === 'ar' ? ui.arabic : game.lang === 'ur' ? ui.urdu : ui.english}
                </td>
                <td className="p-2">{game.age_group}</td>
                <td className="p-2">{game.quiz_type === 'kids' ? ui.kids : ui.adults}</td>
                <td className="p-2 font-black">
                  {trueFlag(game.completed)
                    ? ui.completedStatus
                    : falseFlag(game.completed)
                      ? ui.incompleteStatus
                      : ui.unspecified}
                </td>
                <td className="p-2">{trueFlag(game.certificate_requested) ? (trueFlag(game.certificate_sent) ? ui.sentStatus : ui.requestedStatus) : '—'}</td>
                <td className="p-2 font-black text-red-700">{game.wrong_attempts}</td>
                <td className="p-2 font-black text-green-700">
                  {typeof game.score === 'number' ? game.score : '—'}
                </td>
                <td className="p-2 font-black">
                  {typeof game.total === 'number' ? game.total : '—'}
                </td>
                <td className="p-2">{minutes(game.duration_seconds)}</td>
              </tr>
            ))}
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan={14} className="p-8 text-center font-bold text-[var(--fg-muted)]">
                  {ui.noReports}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="pxl mt-6 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">
              {adminAr ? 'تفاصيل بلاغات الاحتيال والابتزاز' : 'Fraud & Blackmail Reports'}
            </h2>
            <p className="mt-1 text-xs font-bold text-[var(--fg-muted)]">
              {adminAr
                ? 'يعرض هذا الجدول بيانات اللاعب وإجاباته على سؤالي الاحتيال والابتزاز مع التفاصيل المسجلة.'
                : 'This table shows player details and their fraud/blackmail responses with the recorded descriptions.'}
            </p>
          </div>
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black">
            {adminAr
              ? `السجلات: ${data.recentGames.length}`
              : `Records: ${data.recentGames.length}`}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1600px] text-sm">
            <thead>
              <tr className={`border-b ${adminAr ? 'text-right' : 'text-left'}`}>
                <th className="p-2">{ui.name}</th>
                <th className="p-2">{ui.email}</th>
                <th className="p-2">{ui.phone}</th>
                <th className="p-2">{ui.date}</th>
                <th className="p-2">
                  {adminAr ? 'تعرض لاحتيال؟' : 'Fraud experience?'}
                </th>
                <th className="p-2">
                  {adminAr ? 'تفاصيل الاحتيال' : 'Fraud details'}
                </th>
                <th className="p-2">
                  {adminAr ? 'تعرض لابتزاز؟' : 'Blackmail experience?'}
                </th>
                <th className="p-2">
                  {adminAr ? 'تفاصيل الابتزاز' : 'Blackmail details'}
                </th>
              </tr>
            </thead>

            <tbody>
              {data.recentGames
                .filter(
                  (game) =>
                    game.fraud_experience !== null ||
                    game.extortion_experience !== null ||
                    Boolean(game.fraud_details?.trim()) ||
                    Boolean(game.extortion_details?.trim()),
                )
                .map((game, index) => {
                const fraud =
                  game.fraud_experience === true ||
                  String(game.fraud_experience ?? '').trim().toLowerCase() === 'true' ||
                  String(game.fraud_experience ?? '').trim().toLowerCase() === 'yes';

                const extortion =
                  game.extortion_experience === true ||
                  String(game.extortion_experience ?? '').trim().toLowerCase() === 'true' ||
                  String(game.extortion_experience ?? '').trim().toLowerCase() === 'yes';

                return (
                  <tr
                    key={`${game.played_at}-${index}-incident`}
                    className="border-b border-[var(--line)] align-top"
                  >
                    <td className="p-2 font-bold">{game.player_name || '—'}</td>
                    <td className="p-2" dir="ltr">{game.player_email || '—'}</td>
                    <td className="p-2" dir="ltr">{game.player_phone || '—'}</td>
                    <td className="p-2" dir="ltr">
                      {new Date(game.played_at).toLocaleString(adminAr ? 'ar-AE' : 'en-GB')}
                    </td>
                    <td className="p-2 font-black">
                      {game.fraud_experience === null || game.fraud_experience === undefined
                        ? '—'
                        : fraud
                          ? ui.yes
                          : ui.no}
                    </td>
                    <td className="max-w-[360px] whitespace-normal break-words p-2 leading-6">
                      {game.fraud_details || '—'}
                    </td>
                    <td className="p-2 font-black">
                      {game.extortion_experience === null || game.extortion_experience === undefined
                        ? '—'
                        : extortion
                          ? ui.yes
                          : ui.no}
                    </td>
                    <td className="max-w-[360px] whitespace-normal break-words p-2 leading-6">
                      {game.extortion_details || '—'}
                    </td>
                  </tr>
                );
              })}

              {data.recentGames.filter(
                (game) =>
                  game.fraud_experience !== null ||
                  game.extortion_experience !== null ||
                  Boolean(game.fraud_details?.trim()) ||
                  Boolean(game.extortion_details?.trim()),
              ).length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center font-bold text-[var(--fg-muted)]">
                    {adminAr
                      ? 'لا توجد إجابات مسجلة لأسئلة الاحتيال أو الابتزاز حتى الآن.'
                      : 'No fraud or blackmail responses have been recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function ProgressBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = Math.max(0, Math.min(100, Math.round((value / Math.max(total, 1)) * 100)));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-black">
        <span>{label}</span>
        <span>{value} ({percent}%)</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[var(--green)] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pxl bg-white p-5">
      <p className="text-sm font-bold text-[var(--fg-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}

function Highlight({
  title,
  stat,
  detail,
  color,
}: {
  title: string;
  stat: QuestionStat | null;
  detail: string;
  color: string;
}) {
  return (
    <div className="pxl bg-white p-5" style={{ borderColor: color }}>
      <p className="text-sm font-black" style={{ color }}>{title}</p>
      <p className="mt-3 text-sm font-bold leading-7">
        {stat ? questionText(stat) : 'لا توجد بيانات بعد.'}
      </p>
      <p className="mt-2 text-2xl font-black" style={{ color }}>{detail}</p>
    </div>
  );
}
