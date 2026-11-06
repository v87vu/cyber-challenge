'use client';

import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import type { AdminLanguage, RecentGame } from './types';
import { dateKey, formatDate, formatDuration, playerName, trueFlag } from './data';
import { Card, EmptyState, Icon, SectionTitle } from './ui';

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function saveCsv(rows: RecentGame[], language: AdminLanguage) {
  const ar = language === 'ar';
  const headers = ['Game ID', 'Played at', 'Name', 'Email', 'Phone', 'Language', 'Age group', 'Gender', 'Quiz type', 'Score', 'Total', 'Wrong attempts', 'Duration seconds', 'Completed', 'Certificate requested', 'Certificate sent', 'Fraud', 'Fraud details', 'Extortion', 'Extortion details'];
  const lines = rows.map((game) => [game.game_id, game.played_at, playerName(game, language), game.player_email, game.player_phone, game.lang, game.age_group, game.gender, game.quiz_type, game.score, game.total, game.wrong_attempts, game.duration_seconds, trueFlag(game.completed) ? 'Yes' : 'No', trueFlag(game.certificate_requested) ? 'Yes' : 'No', trueFlag(game.certificate_sent) ? 'Yes' : 'No', trueFlag(game.fraud_experience) ? 'Yes' : 'No', game.fraud_details, trueFlag(game.extortion_experience) ? 'Yes' : 'No', game.extortion_details].map(csvCell).join(','));
  const blob = new Blob([`﻿${headers.map(csvCell).join(',')}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${ar ? 'تقارير-الوعي-الرقمي' : 'digital-awareness-report'}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportExport({ games, language }: { games: RecentGame[]; language: AdminLanguage }) {
  const ar = language === 'ar';
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lang, setLang] = useState('all');
  const [age, setAge] = useState('all');
  const [quiz, setQuiz] = useState('all');
  const [reportLanguage, setReportLanguage] = useState<AdminLanguage>(language);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const ages = useMemo(() => [...new Set(games.map((game) => game.age_group))].sort(), [games]);
  const filtered = useMemo(() => games.filter((game) => {
    const day = dateKey(game.played_at);
    return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo) && (lang === 'all' || game.lang === lang) && (age === 'all' || game.age_group === age) && (quiz === 'all' || game.quiz_type === quiz);
  }), [games, dateFrom, dateTo, lang, age, quiz]);
  const chosen = games.filter((game) => selected.has(game.game_id));
  const allSelected = filtered.length > 0 && filtered.every((game) => selected.has(game.game_id));

  function toggle(id: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleAll() {
    setSelected((current) => { const next = new Set(current); filtered.forEach((game) => allSelected ? next.delete(game.game_id) : next.add(game.game_id)); return next; });
  }
  function clearFilters() { setDateFrom(''); setDateTo(''); setLang('all'); setAge('all'); setQuiz('all'); }

  async function downloadPdf() {
    if (!chosen.length || generating) return;
    setGenerating(true); setError('');
    try {
      const pdfAr = reportLanguage === 'ar';
      const t = (arabic: string, english: string) => pdfAr ? arabic : english;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      if (pdfAr) {
        const response = await fetch('/fonts/NotoSansArabic-Regular.ttf', { cache: 'no-store' });
        if (!response.ok) throw new Error('ARABIC_FONT_MISSING');
        const bytes = new Uint8Array(await response.arrayBuffer());
        let binary = '';
        for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
        pdf.addFileToVFS('NotoArabic.ttf', btoa(binary));
        pdf.addFont('NotoArabic.ttf', 'NotoArabic', 'normal');
        pdf.setFont('NotoArabic', 'normal');
      } else pdf.setFont('helvetica', 'normal');
      const shape = (value: string) => {
        if (!pdfAr) return value;
        const candidate = pdf as jsPDF & { processArabic?: (text: string) => string };
        return candidate.processArabic ? candidate.processArabic(value) : value;
      };
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const width = pageWidth - margin * 2;
      const text = (value: unknown, x: number, y: number, options: { size?: number; color?: [number, number, number]; maxWidth?: number } = {}) => {
        pdf.setFontSize(options.size ?? 10);
        const color = options.color ?? [24, 59, 58];
        pdf.setTextColor(...color);
        const content = shape(String(value ?? '—'));
        const lines = options.maxWidth ? pdf.splitTextToSize(content, options.maxWidth) : content;
        pdf.text(lines, x, y, { align: pdfAr ? 'right' : 'left' });
        return Array.isArray(lines) ? lines.length : 1;
      };
      const header = (title: string, subtitle = '') => {
        pdf.setFillColor(15, 118, 110); pdf.rect(0, 0, pageWidth, 6, 'F');
        text(title, pdfAr ? pageWidth - margin : margin, 18, { size: 17, color: [15, 118, 110] });
        if (subtitle) text(subtitle, pdfAr ? pageWidth - margin : margin, 25, { size: 8, color: [101, 124, 122] });
      };
      header(t('تقرير تحليلات الوعي الرقمي', 'Digital Awareness Analytics Report'), `${t('تاريخ الإنشاء', 'Generated')}: ${formatDate(new Date().toISOString(), reportLanguage)}`);
      const completed = chosen.filter((game) => trueFlag(game.completed)).length;
      const requested = chosen.filter((game) => trueFlag(game.certificate_requested)).length;
      const sent = chosen.filter((game) => trueFlag(game.certificate_sent)).length;
      const fraud = chosen.filter((game) => trueFlag(game.fraud_experience)).length;
      const extortion = chosen.filter((game) => trueFlag(game.extortion_experience)).length;
      const wrong = chosen.reduce((sum, game) => sum + game.wrong_attempts, 0);
      const avg = Math.round(chosen.reduce((sum, game) => sum + game.duration_seconds, 0) / chosen.length);
      const stats = [
        [t('الجولات المحددة', 'Selected rounds'), chosen.length], [t('المكتملة', 'Completed'), completed],
        [t('طلبات الشهادة', 'Certificate requested'), requested], [t('الشهادات المرسلة', 'Certificate sent'), sent],
        [t('بلاغات الاحتيال', 'Fraud reports'), fraud], [t('بلاغات الابتزاز', 'Extortion reports'), extortion],
        [t('المحاولات الخاطئة', 'Wrong attempts'), wrong], [t('متوسط المدة', 'Average duration'), formatDuration(avg)],
      ] as const;
      stats.forEach(([label, value], index) => {
        const col = index % 2, row = Math.floor(index / 2);
        const x = margin + col * (width / 2 + 2), y = 35 + row * 22;
        pdf.setFillColor(244, 248, 247); pdf.roundedRect(x, y, width / 2 - 2, 17, 2, 2, 'F');
        text(label, pdfAr ? x + width / 2 - 6 : x + 4, y + 6, { size: 8, color: [101, 124, 122] });
        text(value, pdfAr ? x + width / 2 - 6 : x + 4, y + 13, { size: 12, color: [15, 118, 110] });
      });
      text(t('تفاصيل الجولات المحددة', 'Selected round details'), pdfAr ? pageWidth - margin : margin, 132, { size: 13, color: [15, 118, 110] });
      let y = 142;
      chosen.forEach((game, index) => {
        if (y > pageHeight - 48) { pdf.addPage(); header(t('تفاصيل الجولات', 'Round details'), `${index + 1} / ${chosen.length}`); y = 35; }
        pdf.setDrawColor(223, 233, 231); pdf.setFillColor(index % 2 ? 255 : 248, index % 2 ? 255 : 251, index % 2 ? 255 : 250); pdf.roundedRect(margin, y, width, 38, 2, 2, 'FD');
        const right = pdfAr ? pageWidth - margin - 4 : margin + 4;
        text(`${index + 1}. ${playerName(game, reportLanguage)}`, right, y + 7, { size: 10 });
        text(`${game.player_email || '—'}   ${game.player_phone || '—'}`, right, y + 13, { size: 7.5, color: [101, 124, 122], maxWidth: width - 8 });
        text(`${formatDate(game.played_at, reportLanguage)} · ${game.lang} · ${game.age_group} · ${game.quiz_type}`, right, y + 20, { size: 7.5, maxWidth: width - 8 });
        text(`${t('الحالة', 'Status')}: ${trueFlag(game.completed) ? t('مكتملة', 'Completed') : t('لم تكتمل', 'Incomplete')} · ${t('النتيجة', 'Score')}: ${game.score ?? '—'}/${game.total ?? '—'} · ${t('المدة', 'Duration')}: ${formatDuration(game.duration_seconds)}`, right, y + 27, { size: 7.5, maxWidth: width - 8 });
        text(`${t('احتيال', 'Fraud')}: ${trueFlag(game.fraud_experience) ? t('نعم', 'Yes') : t('لا', 'No')} · ${t('ابتزاز', 'Extortion')}: ${trueFlag(game.extortion_experience) ? t('نعم', 'Yes') : t('لا', 'No')} · ${t('الشهادة', 'Certificate')}: ${trueFlag(game.certificate_sent) ? t('أُرسلت', 'Sent') : trueFlag(game.certificate_requested) ? t('طُلبت', 'Requested') : '—'}`, right, y + 34, { size: 7.5, maxWidth: width - 8 });
        y += 42;
      });
      pdf.save(`${pdfAr ? 'تقرير-تحليلات-الوعي-الرقمي' : 'digital-awareness-analytics-report'}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (caught) {
      console.error('PDF generation failed:', caught);
      setError(caught instanceof Error && caught.message === 'ARABIC_FONT_MISSING' ? (ar ? 'تعذر تحميل الخط العربي. حاول مرة أخرى.' : 'Unable to load the Arabic font. Try again.') : (ar ? 'تعذر إنشاء ملف PDF. حاول مرة أخرى.' : 'Unable to create the PDF. Try again.'));
    } finally { setGenerating(false); }
  }

  const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-[#d8e4e2] bg-white px-3 text-xs font-bold';
  return <div>
    <div className="mb-5"><h1 className="text-2xl font-black">{ar ? 'التقارير' : 'Reports'}</h1><p className="mt-1 text-sm font-semibold text-[#657c7a]">{ar ? 'حدد الجولات ثم نزّل تقرير PDF أو ملف Excel.' : 'Select rounds, then download a PDF or Excel report.'}</p></div>
    <Card className="p-4 md:p-6">
      <SectionTitle title={ar ? 'تصدير التقارير' : 'Export reports'} hint={ar ? 'فلاتر التصدير مستقلة عن فلاتر نظرة عامة.' : 'Export filters are independent from Overview filters.'}/>
      <div className="mt-5 grid gap-3 rounded-xl bg-[#f5f9f8] p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-[11px] font-black text-[#657c7a]">{ar ? 'من تاريخ' : 'From date'}<input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className={inputClass} dir="ltr"/></label>
        <label className="text-[11px] font-black text-[#657c7a]">{ar ? 'إلى تاريخ' : 'To date'}<input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className={inputClass} dir="ltr"/></label>
        <label className="text-[11px] font-black text-[#657c7a]">{ar ? 'اللغة' : 'Language'}<select value={lang} onChange={(event) => setLang(event.target.value)} className={inputClass}><option value="all">{ar ? 'كل اللغات' : 'All languages'}</option><option value="ar">{ar ? 'العربية' : 'Arabic'}</option><option value="en">{ar ? 'الإنجليزية' : 'English'}</option><option value="ur">{ar ? 'الأردية' : 'Urdu'}</option></select></label>
        <label className="text-[11px] font-black text-[#657c7a]">{ar ? 'الفئة العمرية' : 'Age group'}<select value={age} onChange={(event) => setAge(event.target.value)} className={inputClass}><option value="all">{ar ? 'كل الأعمار' : 'All ages'}</option>{ages.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-[11px] font-black text-[#657c7a]">{ar ? 'فئة اللعبة' : 'Quiz type'}<select value={quiz} onChange={(event) => setQuiz(event.target.value)} className={inputClass}><option value="all">{ar ? 'الكل' : 'All'}</option><option value="adult">{ar ? 'بالغون' : 'Adults'}</option><option value="kids">{ar ? 'أطفال' : 'Kids'}</option></select></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={toggleAll} disabled={!filtered.length} className="min-h-10 rounded-xl border border-[#cbdcd9] px-3 text-xs font-black text-[#0f766e] disabled:opacity-40">{allSelected ? (ar ? 'إلغاء تحديد الظاهر' : 'Unselect visible') : (ar ? 'تحديد كل الظاهر' : 'Select all visible')}</button><button type="button" onClick={() => setSelected(new Set())} disabled={!selected.size} className="min-h-10 rounded-xl border border-[#cbdcd9] px-3 text-xs font-black disabled:opacity-40">{ar ? 'مسح التحديد' : 'Clear selection'}</button><button type="button" onClick={clearFilters} className="min-h-10 rounded-xl px-3 text-xs font-black text-[#657c7a]">{ar ? 'مسح الفلاتر' : 'Clear filters'}</button><span className="text-[11px] font-bold text-[#718683]">{ar ? `${filtered.length} ظاهر · ${chosen.length} محدد` : `${filtered.length} visible · ${chosen.length} selected`}</span></div>
      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-[#dfe9e7] p-4"><label className="min-w-48 flex-1 text-[11px] font-black text-[#657c7a]">{ar ? 'لغة التقرير' : 'Report language'}<select value={reportLanguage} onChange={(event) => setReportLanguage(event.target.value as AdminLanguage)} className={inputClass}><option value="ar">العربية</option><option value="en">English</option></select></label><button type="button" onClick={() => void downloadPdf()} disabled={!chosen.length || generating} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-5 text-xs font-black text-white disabled:opacity-40"><Icon name="download" size={17}/>{generating ? (ar ? 'جاري تجهيز PDF…' : 'Preparing PDF…') : (ar ? `تنزيل PDF (${chosen.length})` : `Download PDF (${chosen.length})`)}</button><button type="button" onClick={() => saveCsv(chosen, reportLanguage)} disabled={!chosen.length} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0f766e] px-5 text-xs font-black text-[#0f766e] disabled:opacity-40"><Icon name="download" size={17}/>{ar ? `تنزيل Excel (${chosen.length})` : `Download Excel (${chosen.length})`}</button></div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-[#fff1f0] p-3 text-xs font-bold text-[#a52822]">{error}</p>}
      <div className="mt-5">{filtered.length ? <div className="grid gap-2">{filtered.map((game) => <label key={game.game_id} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-[#e1eae8] px-3 py-2 hover:bg-[#f8fbfa]"><input type="checkbox" checked={selected.has(game.game_id)} onChange={() => toggle(game.game_id)} className="h-5 w-5 shrink-0 accent-[#0f766e]"/><span className="min-w-0 flex-1"><span className="block truncate text-xs font-black">{playerName(game, language)}</span><span className="mt-1 block truncate text-[10px] font-semibold text-[#718683]">{formatDate(game.played_at, language)} · {game.lang} · {game.age_group}</span></span><span className="tnum text-xs font-black text-[#0f766e]">{game.score ?? '—'} / {game.total ?? '—'}</span></label>)}</div> : <EmptyState>{ar ? 'لا توجد جولات تطابق الفلاتر المختارة.' : 'No rounds match the selected filters.'}</EmptyState>}</div>
    </Card>
  </div>;
}
