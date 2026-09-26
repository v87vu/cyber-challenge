/* حارس المحتوى الثابت وبيانات الدروس والمواقف */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { KIDS_QUESTIONS, QUESTIONS } from '../src/lib/questions.ts';
import { KIDS_LESSONS, LESSONS } from '../src/lib/lessons.ts';
import { KIDS_SCENARIOS, SCENARIOS } from '../src/lib/scenarios.ts';

const failures = [];

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function frozenQuestion(question) {
  return {
    n: question.n,
    level: question.level,
    correct: question.correct,
    ar: { text: question.ar.text, options: question.ar.options },
    en: { text: question.en.text, options: question.en.options },
  };
}

async function checkFrozenQuestions() {
  const baselinePath = new URL('./frozen-hash.json', import.meta.url);
  let baseline;
  try {
    baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
  } catch (error) {
    failures.push(`تعذر قراءة e2e/frozen-hash.json: ${error.message}`);
    return;
  }

  const payload = {
    questions: QUESTIONS.map(frozenQuestion),
    kidsQuestions: KIDS_QUESTIONS.map(frozenQuestion),
  };
  const actual = createHash('sha256').update(canonicalJson(payload)).digest('hex');
  if (baseline.sha256 !== actual) {
    failures.push(`تغيّر المحتوى المجمّد للأسئلة: expected ${baseline.sha256}, received ${actual}`);
  }
}

function checkLessons(label, lessons, expectedCount) {
  for (let n = 1; n <= expectedCount; n += 1) {
    const pair = lessons[n];
    if (!pair) {
      failures.push(`${label}: الدرس رقم ${n} مفقود`);
      continue;
    }
    for (const lang of ['ar', 'en']) {
      for (const field of ['trick', 'move', 'remember']) {
        if (typeof pair[lang]?.[field] !== 'string' || !pair[lang][field].trim()) {
          failures.push(`${label}: ${n}.${lang}.${field} فارغ`);
        }
      }
    }
  }
}

function checkScenarios(label, scenarios, questions) {
  const validQuestions = new Set(questions.map((question) => question.n));
  for (const [rawNumber, scenario] of Object.entries(scenarios)) {
    const n = Number(rawNumber);
    if (!validQuestions.has(n)) {
      failures.push(`${label}: الموقف رقم ${rawNumber} لا يطابق سؤالاً حقيقياً`);
    }
    for (const lang of ['ar', 'en']) {
      const copy = scenario[lang];
      const segments = [...copy.lines, ...(copy.cta ? [copy.cta] : [])];
      for (const segment of segments) {
        if (segment.flag && !(segment.flag in copy.flags)) {
          failures.push(`${label}: ${rawNumber}.${lang} يشير إلى علامة مفقودة "${segment.flag}"`);
        }
      }
    }
  }
}

await checkFrozenQuestions();
checkLessons('دروس الكبار', LESSONS, 22);
checkLessons('دروس الأطفال', KIDS_LESSONS, 10);
checkScenarios('مواقف الكبار', SCENARIOS, QUESTIONS);
checkScenarios('مواقف الأطفال', KIDS_SCENARIOS, KIDS_QUESTIONS);

if (failures.length) {
  console.error(`Integrity check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Integrity check passed: frozen questions, lessons, and scenarios are valid.');
}
