import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
// Compile the actual small TS modules in memory; no extra test dependency or generated files.
function modules(globals = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const loadedModule = { exports: {} };
    cache.set(absolute, loadedModule);
    const output = ts.transpileModule(readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = (specifier) => {
      if (specifier.endsWith('.module.css')) return { arriving: 'arriving' };
      if (!specifier.startsWith('.')) return require(specifier);
      const resolved = path.resolve(path.dirname(absolute), specifier);
      return load(resolved + (existsSync(resolved + '.tsx') ? '.tsx' : '.ts'));
    };
    vm.runInNewContext(output, { module: loadedModule, exports: loadedModule.exports, require: localRequire, ...globals }, { filename: absolute });
    return loadedModule.exports;
  }
  return load;
}
const load = modules();
const { summarizeStars } = load('src/lib/stars.ts');
const { getQuiz } = load('src/lib/questions.ts');
const ShieldMap = load('src/components/ShieldMap.tsx').default;
const Background = load('src/components/Background.tsx').default;
const { levelLocation, locationImage } = load('src/lib/locations.ts');
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const completeRun = (mode, seconds = 5) => {
  const quiz = getQuiz(mode === 'kids');
  return quiz.questions.map((q) => ({ questionNumber: q.n, isCorrect: true, timeSpentSeconds: seconds }));
};

for (const mode of ['adult', 'kids']) {
  test(`${mode}: full completion awards one first-try star per question and four localized badges`, () => {
    const attempts = completeRun(mode);
    const result = summarizeStars(mode, attempts);
    assert.equal(result.stars, attempts.length);
    assert.equal(result.firstTry, attempts.length);
    assert.equal(result.badges.length, 4);
    for (const badge of result.badges) for (const lang of ['ar', 'en', 'ur']) assert.ok(badge.name[lang]);
  });
  test(`${mode}: retries and timeouts lose only the affected first-try star`, () => {
    const attempts = completeRun(mode);
    attempts.unshift({ questionNumber: 1, isCorrect: false, timeSpentSeconds: 45 });
    const result = summarizeStars(mode, attempts);
    assert.equal(result.stars, attempts.length - 2);
    assert.equal(result.firstTry, attempts.length - 2);
    assert.ok(!result.badges.some((badge) => badge.id === 'flawless'));
    assert.equal(result.averageSeconds, (45 + (attempts.length - 1) * 5) / (attempts.length - 1));
  });
  test(`${mode}: badges use first-try accuracy, completion, and strict time threshold`, () => {
    const attempts = completeRun(mode, 10);
    assert.ok(!summarizeStars(mode, attempts).badges.some((b) => b.id === 'quick'));
    const total = attempts.length;
    const threshold = Math.ceil(total * 0.8);
    for (let n = threshold + 1; n <= total; n++) attempts.unshift({ questionNumber: n, isCorrect: false, timeSpentSeconds: 5 });
    assert.ok(summarizeStars(mode, attempts).badges.some((b) => b.id === 'detective'));
    attempts.unshift({ questionNumber: threshold, isCorrect: false, timeSpentSeconds: 5 });
    assert.ok(!summarizeStars(mode, attempts).badges.some((b) => b.id === 'detective'));
    assert.equal(summarizeStars(mode, []).stars, 0);
    assert.equal(summarizeStars(mode, completeRun(mode).slice(0, -1)).badges.length, 0);
  });
  test(`${mode}: map uses every real level and marks only finished levels complete`, () => {
    const quiz = getQuiz(mode === 'kids');
    for (const lang of ['ar', 'en', 'ur']) {
      const html = renderToStaticMarkup(React.createElement(ShieldMap, { levels: quiz.levels, completedThrough: quiz.levels[0].to, lang, mode }));
      assert.equal((html.match(/class="shield-station /g) ?? []).length, quiz.levels.length);
      assert.equal((html.match(/shield-complete/g) ?? []).length, 1);
      assert.equal((html.match(/aria-current="step"/g) ?? []).length, 1);
      for (const level of quiz.levels) assert.ok(html.includes(escape(level[lang])));
    }
  });
}

test('persistent bests are separate, monotonic, stable, bounded, and survive a reload', () => {
  const data = new Map();
  const localStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  let storageListener;
  const window = { addEventListener: (_, fn) => { storageListener = fn; }, removeEventListener: () => { storageListener = null; } };
  const globals = { window, localStorage };
  const stars = modules(globals)('src/lib/stars.ts');
  let notifications = 0;
  const unsubscribe = stars.subscribeBestStars(() => notifications++);
  assert.strictEqual(stars.bestStarsSnapshot(), stars.bestStarsSnapshot());
  assert.equal(stars.recordStars(22, 'adult'), true);
  assert.equal(stars.recordStars(6, 'kids'), true);
  assert.equal(stars.recordStars(20, 'adult'), false);
  assert.equal(stars.recordStars(NaN, 'adult'), false);
  assert.equal(notifications, 2);
  assert.equal(stars.bestStarsSnapshot().adult, 22);
  assert.equal(stars.bestStarsSnapshot().kids, 6);
  assert.equal(stars.bestStarsServerSnapshot().adult, 0);
  const reloaded = modules(globals)('src/lib/stars.ts');
  assert.equal(reloaded.bestStarsSnapshot().adult, 22);
  data.set('dac-best-stars-kids', '8');
  storageListener({ key: 'dac-best-stars-kids' });
  assert.equal(stars.bestStarsSnapshot().kids, 8);
  assert.equal(stars.recordStars(100, 'kids'), true);
  assert.equal(stars.bestStarsSnapshot().kids, 10);
  unsubscribe();
  assert.equal(storageListener, null);
});

test('storage failures and corrupt values do not break play', () => {
  const badStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const stars = modules({ window: {}, localStorage: badStorage })('src/lib/stars.ts');
  assert.equal(stars.recordStars(8, 'kids'), true);
  assert.equal(stars.bestStarsSnapshot().kids, 8);
  const corrupt = modules({ window: {}, localStorage: { getItem: () => 'Infinity' } })('src/lib/stars.ts');
  assert.equal(corrupt.bestStarsSnapshot().adult, 0);
});

for (const mode of ['adult', 'kids']) {
  test(`${mode}: locations, image files, next-level preloads and station thumbnails agree`, () => {
    const levels = getQuiz(mode === 'kids').levels;
    const expected = mode === 'kids' ? ['school', 'park', 'home', 'fort'] : ['home', 'park', 'souq', 'bank', 'fort', 'corniche'];
    const map = renderToStaticMarkup(React.createElement(ShieldMap, { levels, mode, lang: 'ar', completedThrough: levels[0].to }));
    for (const [i, level] of levels.entries()) {
      const location = levelLocation(mode, level.id);
      assert.equal(location, expected[i]);
      const src = locationImage(location);
      assert.ok(existsSync(path.join(root, 'public', src)));
      assert.ok(map.includes(`class="station-thumbnail" src="${src}"`));
      const html = renderToStaticMarkup(React.createElement(Background, { dim: .68, location, nextLocation: expected[i + 1] }));
      assert.ok(html.includes(`data-location="${location}"`));
      assert.ok(html.includes(`src="${src}"`));
      assert.ok(html.includes('rgba(248, 251, 255,'), 'readability overlay');
      if (expected[i + 1]) assert.ok(html.includes(`rel="preload" as="image" href="${locationImage(expected[i + 1])}"`));
    }
  });
}

function shareHarness(overrides = {}) {
  const operations = [];
  const context = {
    createLinearGradient() { return { addColorStop() {} }; },
    fillRect() {},
    fillText(text) { operations.push(`text:${text}`); },
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    toBlob(callback) { callback(new Blob(['png'], { type: 'image/png' })); },
  };
  const anchor = { click() { operations.push('download'); }, remove() {} };
  const document = {
    fonts: { load: async () => { operations.push('font-load'); }, ready: Promise.resolve() },
    createElement(tag) { return tag === 'canvas' ? canvas : anchor; },
    body: { appendChild() {}, removeChild() {} },
    documentElement: {},
  };
  const globals = {
    document,
    getComputedStyle: () => ({ getPropertyValue: () => 'Cairo' }),
    Blob,
    File: class File { constructor(parts, name, options) { this.parts = parts; this.name = name; this.type = options.type; } },
    URL: { createObjectURL: () => 'blob:share-card', revokeObjectURL() {} },
    navigator: {},
    ...overrides,
  };
  return { operations, canvas, anchor, document, load: modules(globals) };
}

test('share card loads Cairo and draws the required 1080×1350 Arabic content', async () => {
  const harness = shareHarness();
  const { createShareCard } = harness.load('src/lib/share-card.ts');
  const blob = await createShareCard({ title: 'بطل الوعي الرقمي', score: 22, total: 22, stars: 22, badges: ['🔎', '⚡', '✨', '🕵️'] });
  assert.equal(blob.type, 'image/png');
  assert.equal(harness.canvas.width, 1080);
  assert.equal(harness.canvas.height, 1350);
  assert.equal(harness.operations[0], 'font-load');
  const text = harness.operations.filter((op) => op.startsWith('text:')).join('\n');
  for (const expected of ['تحدي الوعي الرقمي', 'بطل الوعي الرقمي', '22 / 22', '★ 22', 'cyber-challenge-v2.vercel.app']) assert.ok(text.includes(expected), expected);
  assert.ok(text.includes('🔎 ⚡ ✨'));
  assert.ok(!text.includes('🕵️'), 'only three badge emojis');
});

test('share card uses Web Share with a PNG file when supported', async () => {
  let shared;
  const harness = shareHarness({ navigator: { canShare: () => true, share: async (data) => { shared = data; } } });
  const { shareAchievement } = harness.load('src/lib/share-card.ts');
  await shareAchievement({ title: 'بطل الوعي الرقمي', score: 10, total: 10, stars: 10, badges: ['🛡️'] });
  assert.equal(shared.files.length, 1);
  assert.equal(shared.files[0].type, 'image/png');
  assert.ok(!harness.operations.includes('download'));
});

test('share card downloads the PNG when file sharing is unavailable', async () => {
  const harness = shareHarness();
  const { shareAchievement } = harness.load('src/lib/share-card.ts');
  await shareAchievement({ title: 'بطل الوعي الرقمي', score: 10, total: 10, stars: 8, badges: ['🛡️'] });
  assert.equal(harness.anchor.download, 'digital-awareness-achievement.png');
  assert.ok(harness.operations.includes('download'));
});

test('privacy notices have concise Arabic, English, and Urdu copy', () => {
  const { privacyCopy } = load('src/lib/privacy.ts');
  for (const lang of ['ar', 'en', 'ur']) {
    const copy = privacyCopy(lang);
    assert.ok(copy.survey);
    assert.ok(copy.certificate);
    assert.ok(copy.minor);
  }
  assert.equal(privacyCopy('ar').survey, 'إجاباتك تُستخدم لأغراض التوعية والإحصاء فقط، ولا تُشارك مع أي جهة خارج القيادة العامة لشرطة أم القيوين.');
  assert.equal(privacyCopy('ar').certificate, 'نستخدم اسمك لإصدار الشهادة، وبريدك (اختياري) لإرسالها فقط. لن نستخدمهما لأي غرض آخر.');
  assert.equal(privacyCopy('ar').minor, 'إذا كان عمرك أقل من 18 سنة، يُرجى إدخال بياناتك بعلم أحد والديك.');
});
