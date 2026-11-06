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
const { getScene } = load('src/lib/scenes.ts');
const { summarizeStars } = load('src/lib/stars.ts');
const { getQuiz, questionCopy } = load('src/lib/questions.ts');
const ScamScene = load('src/components/ScamScene.tsx').default;
const ShieldMap = load('src/components/ShieldMap.tsx').default;
const Background = load('src/components/Background.tsx').default;
const { levelLocation, locationImage } = load('src/lib/locations.ts');
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const completeRun = (mode, seconds = 5) => {
  const quiz = getQuiz(mode === 'kids');
  return {
    attempts: quiz.questions.map((q) => ({ questionNumber: q.n, isCorrect: true, timeSpentSeconds: seconds })),
    found: Object.fromEntries(quiz.questions.map((q) => [q.n, getScene(mode, q.n).flags.map((f) => f.id)])),
  };
};

for (const mode of ['adult', 'kids']) {
  test(`${mode}: every question has localized scenes, two to four unique flags, and no early hints`, () => {
    const quiz = getQuiz(mode === 'kids');
    assert.equal(quiz.total, mode === 'kids' ? 10 : 22);
    for (const q of quiz.questions) {
      const scene = getScene(mode, q.n);
      assert.ok(scene.flags.length >= 2 && scene.flags.length <= 4);
      assert.equal(new Set(scene.flags.map((f) => f.id)).size, scene.flags.length);
      for (const lang of ['ar', 'en', 'ur']) {
        assert.ok(questionCopy(q, lang).text);
        assert.ok(scene.title[lang]);
        const html = renderToStaticMarkup(React.createElement(ScamScene, { scene, lang, inspect: false, found: [], onFind() {}, feedback: null, feedbackId: 0 }));
        assert.ok(!html.includes('data-testid="scene-hotspot"'));
        assert.ok(!html.includes('<a '));
        for (const flag of scene.flags) {
          assert.ok(flag.content[lang] && flag.label[lang]);
          assert.ok(html.includes(escape(flag.content[lang])));
          assert.ok(!html.includes(escape(flag.label[lang])), `hidden tip leaked on ${mode}/${q.n}/${lang}`);
        }
        const inspected = renderToStaticMarkup(React.createElement(ScamScene, { scene, lang, inspect: true, found: [], onFind() {}, feedback: 'correct', feedbackId: 1 }));
        assert.equal((inspected.match(/data-testid="scene-hotspot"/g) ?? []).length, scene.flags.length);
      }
    }
  });
  test(`${mode}: full completion awards two stars per question and five localized badges`, () => {
    const { attempts, found } = completeRun(mode);
    const result = summarizeStars(mode, attempts, found);
    assert.equal(result.stars, attempts.length * 2);
    assert.equal(result.badges.length, 5);
    for (const badge of result.badges) for (const lang of ['ar', 'en', 'ur']) assert.ok(badge.name[lang]);
    assert.equal(result.flagCount, result.totalFlags);
  });
  test(`${mode}: retries/timeouts lose first-try star, repeated flags cannot add stars`, () => {
    const { attempts, found } = completeRun(mode);
    attempts.unshift({ questionNumber: 1, isCorrect: false, timeSpentSeconds: 45 });
    found[1].push(found[1][0], 'invalid-flag');
    const result = summarizeStars(mode, attempts, found);
    assert.equal(result.stars, (attempts.length - 1) * 2 - 1);
    assert.ok(!result.badges.some((badge) => badge.id === 'flawless'));
    assert.equal(result.averageSeconds, (45 + (attempts.length - 1) * 5) / (attempts.length - 1));
  });
  test(`${mode}: inspection is optional and cannot award stars before correct answers`, () => {
    const { attempts, found } = completeRun(mode);
    assert.equal(summarizeStars(mode, [], found).stars, 0);
    assert.equal(summarizeStars(mode, attempts, {}).stars, attempts.length);
    assert.equal(summarizeStars(mode, attempts.slice(0, 1), found).stars, 2);
    assert.equal(summarizeStars(mode, attempts.slice(0, -1), found).badges.length, 0);
    assert.equal(summarizeStars(mode, [], {}).stars, 0);
  });
  test(`${mode}: badge conditions use all link questions, 80% of flags, and strict time threshold`, () => {
    const { attempts, found } = completeRun(mode, 10);
    assert.ok(!summarizeStars(mode, attempts, found).badges.some((b) => b.id === 'quick'));
    const linkQuestion = attempts.find((a) => getScene(mode, a.questionNumber).linkQuestion).questionNumber;
    const missingLink = { ...found, [linkQuestion]: [] };
    assert.ok(!summarizeStars(mode, attempts, missingLink).badges.some((b) => b.id === 'links'));
    const totalFlags = summarizeStars(mode, attempts, found).totalFlags;
    const threshold = Math.ceil(totalFlags * .8);
    const partial = {};
    let remaining = threshold;
    for (const [n, ids] of Object.entries(found)) { partial[n] = ids.slice(0, remaining); remaining -= partial[n].length; }
    assert.ok(summarizeStars(mode, attempts, partial).badges.some((b) => b.id === 'detective'));
    const last = Object.keys(partial).findLast((n) => partial[n].length);
    partial[last].pop();
    assert.ok(!summarizeStars(mode, attempts, partial).badges.some((b) => b.id === 'detective'));
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
  assert.equal(stars.recordStars(35, 'adult'), true);
  assert.equal(stars.recordStars(12, 'kids'), true);
  assert.equal(stars.recordStars(20, 'adult'), false);
  assert.equal(stars.recordStars(NaN, 'adult'), false);
  assert.equal(notifications, 2);
  assert.equal(stars.bestStarsSnapshot().adult, 35);
  assert.equal(stars.bestStarsSnapshot().kids, 12);
  assert.equal(stars.bestStarsServerSnapshot().adult, 0);
  const reloaded = modules(globals)('src/lib/stars.ts');
  assert.equal(reloaded.bestStarsSnapshot().adult, 35);
  data.set('dac-best-stars-kids', '18');
  storageListener({ key: 'dac-best-stars-kids' });
  assert.equal(stars.bestStarsSnapshot().kids, 18);
  assert.equal(stars.recordStars(100, 'kids'), true);
  assert.equal(stars.bestStarsSnapshot().kids, 20);
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
  test(`${mode}: every localized flag is attached once to a real scene element`, () => {
    for (const question of getQuiz(mode === 'kids').questions) {
      const scene = getScene(mode, question.n);
      for (const lang of ['ar', 'en', 'ur']) {
        const props = { scene, lang, found: [], onFind() {}, feedback: null, feedbackId: 0 };
        for (const inspect of [false, true]) {
          const html = renderToStaticMarkup(React.createElement(ScamScene, { ...props, inspect }));
          for (const flag of scene.flags) {
            assert.equal(html.split(`data-scene-element="${flag.id}"`).length - 1, 1, `${mode}/${question.n}/${lang}/${flag.id}`);
          }
          assert.ok(!/\{(link|sender|urgent|password|otp)\}/.test(html), 'unresolved template');
          assert.ok(!html.includes('scene-field'), 'must not render a list of chips');
          assert.ok(!/<(?:a|input|form)\b/.test(html), 'mock cannot navigate or collect credentials');
          assert.ok(!/(police|government|شرطة|حكومة|پولیس)/i.test(html), 'no government branding');
        }
        const complete = renderToStaticMarkup(React.createElement(ScamScene, { ...props, inspect: true, found: scene.flags.map((f) => f.id) }));
        assert.ok(complete.includes('scene-star-burst'));
        assert.ok(complete.includes(`${scene.flags.length}/${scene.flags.length}`));
      }
    }
  });

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

test('scene kinds have distinct device structures and bank SMS keeps its full sentence inline', () => {
  const cases = { 1: 'scene-orbit', 2: 'scene-chat-body', 5: 'scene-mail-body', 6: 'scene-message', 7: 'scene-call-actions', 8: 'scene-post-art', 11: 'scene-network-list', 12: 'scene-login', 13: 'scene-post-cta', 15: 'scene-receipt-body', 17: 'scene-qr-pattern' };
  for (const [n, expected] of Object.entries(cases)) {
    const scene = getScene('adult', Number(n));
    const html = renderToStaticMarkup(React.createElement(ScamScene, { scene, lang: 'ar', inspect: false, found: [], onFind() {}, feedback: null, feedbackId: 0 }));
    assert.ok(html.includes(expected));
  }
  const bank = getScene('adult', 6);
  const html = renderToStaticMarkup(React.createElement(ScamScene, { scene: bank, lang: 'ar', inspect: false, found: [], onFind() {}, feedback: null, feedbackId: 0 }));
  const plain = html.replace(/<[^>]*>/g, '');
  assert.ok(plain.includes('يرجى تحديث بيانات حسابك البنكي فوراً من خلال الرابط التالي: bank-update.example'));
  assert.ok(html.includes('AD-BANK-UPD'));
  assert.ok(html.includes('class="scene-link"'));
  assert.ok(html.includes('class="scene-urgent"'));
});
