'use client';

import { useState } from 'react';
import { getQuiz, questionCopy } from '@/lib/questions';
import type { AdminLanguage, QuestionStat } from './types';
import { questionLabel, rankQuestions } from './data';
import { Card, Chip, EmptyState, SectionTitle } from './ui';

export function questionText(stat: QuestionStat, language: AdminLanguage) {
  const quiz = getQuiz(stat.quiz_type === 'kids');
  const question = quiz.questions.find((item) => item.n === stat.question_number);
  return question ? questionCopy(question, language).text : `${language === 'ar' ? 'السؤال' : 'Question'} ${stat.question_number}`;
}

export function GapList({ questions, language, limit, minimumPlayers = 1 }: { questions: QuestionStat[]; language: AdminLanguage; limit?: number; minimumPlayers?: number }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const ar = language === 'ar';
  const eligible = rankQuestions(questions.filter((question) => question.players_answered >= minimumPlayers));
  const rows = typeof limit === 'number' ? eligible.slice(0, limit) : eligible;
  if (!rows.length) return <EmptyState>{minimumPlayers > 1 ? (ar ? 'لا توجد بيانات كافية بعد' : 'Not enough data yet') : (ar ? 'لا توجد إجابات مسجلة بعد.' : 'No answers recorded yet.')}</EmptyState>;
  return <div className="mt-4 divide-y divide-[#e7efed]">{rows.map((stat) => {
    const id = `${stat.quiz_type}-${stat.question_number}`;
    const isExpanded = expanded === id;
    const success = Math.max(0, Math.min(100, Number(stat.first_try_success_rate) || 0));
    return <div key={id} className="py-4 first:pt-0 last:pb-0">
      <button type="button" onClick={() => setExpanded(isExpanded ? null : id)} aria-expanded={isExpanded} className="grid w-full grid-cols-[auto_1fr] items-start gap-3 text-start">
        <span className="mt-0.5 grid h-8 min-w-8 place-items-center rounded-lg bg-[#edf5f3] px-1 text-[11px] font-black text-[#0f766e]">{questionLabel(stat, language)}</span>
        <span className={`min-w-0 text-sm font-bold leading-6 text-[#294b48] ${isExpanded ? '' : 'line-clamp-2'}`}>{questionText(stat, language)}</span>
      </button>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-[#657c7a]">
        <span>{ar ? 'اللاعبون' : 'Players'} <b className="tnum block text-sm text-[#294b48]">{stat.players_answered}</b></span>
        <span>{ar ? 'نجاح من أول محاولة' : 'First-try success'} <b className="tnum block text-sm text-[#0f766e]">{success.toFixed(1)}%</b></span>
        <span>{ar ? 'محاولات خاطئة' : 'Wrong attempts'} <b className="tnum block text-sm text-[#294b48]">{stat.wrong_attempts}</b></span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf3f2]"><div className={`h-full rounded-full ${success < 50 ? 'bg-[#d8a33d]' : 'bg-[#0f766e]'}`} style={{ width: `${success}%` }}/></div>
    </div>;
  })}</div>;
}

export default function AwarenessGaps({ questions, language }: { questions: QuestionStat[]; language: AdminLanguage }) {
  const ar = language === 'ar';
  const [group, setGroup] = useState<'adult' | 'kids'>('adult');
  return <div>
    <div className="mb-5"><h1 className="text-2xl font-black">{ar ? 'فجوات الوعي' : 'Awareness gaps'}</h1><p className="mt-1 text-sm font-semibold text-[#657c7a]">{ar ? 'الأسئلة الأقل نجاحًا من المحاولة الأولى، مرتبة من الأصعب.' : 'Questions with the lowest first-try success, hardest first.'}</p></div>
    <Card className="p-4 md:p-6">
      <SectionTitle title={ar ? 'أداء الأسئلة' : 'Question performance'} action={<div className="flex gap-2"><Chip active={group === 'adult'} onClick={() => setGroup('adult')}>{ar ? 'البالغون' : 'Adults'}</Chip><Chip active={group === 'kids'} onClick={() => setGroup('kids')}>{ar ? 'الأطفال' : 'Kids'}</Chip></div>}/>
      <GapList questions={questions.filter((question) => question.quiz_type === group)} language={language}/>
    </Card>
  </div>;
}
