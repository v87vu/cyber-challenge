import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '../../..');
function loadData() {
  const file = path.join(root, 'src/components/admin/data.ts');
  const output = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(output, { module: loadedModule, exports: loadedModule.exports }, { filename: file });
  return loadedModule.exports;
}

const game = (overrides = {}) => ({
  game_id: 'current-1', player_id: 'p1', played_at: '2026-11-06T10:00:00.000Z',
  player_name: '', player_email: 'player@example.com', player_phone: '+971501234567',
  lang: 'ar', age_group: '18–24', gender: 'male', quiz_type: 'adult', score: 8,
  total: 10, wrong_attempts: 2, duration_seconds: 120, completed: true,
  certificate_requested: true, certificate_sent: false,
  fraud_experience: 'yes', fraud_details: 'Fraud detail',
  extortion_experience: 'no', extortion_details: null, ...overrides,
});

test('period and version filters use played_at and the v2 game_id prefix', () => {
  const { filterGames } = loadData();
  const rows = [
    game(), game({ game_id: 'v2-2', played_at: '2026-11-05T10:00:00.000Z' }),
    game({ game_id: 'v2-3', played_at: '2026-10-01T10:00:00.000Z' }),
  ];
  const now = new Date('2026-11-06T12:00:00.000Z');
  assert.deepEqual(filterGames(rows, 'today', 'all', now).map((row) => row.game_id), ['current-1']);
  assert.deepEqual(filterGames(rows, 'all', 'v2', now).map((row) => row.game_id), ['v2-2', 'v2-3']);
  assert.deepEqual(filterGames(rows, '7d', 'current', now).map((row) => row.game_id), ['current-1']);
});

test('summary and funnel use selected rounds and started as the denominator', () => {
  const { summarizeGames } = loadData();
  const rows = [
    game(),
    game({ game_id: '2', completed: false, certificate_requested: false, fraud_experience: 'no', duration_seconds: 60 }),
    game({ game_id: '3', completed: true, certificate_sent: true, fraud_experience: 'no', extortion_experience: true, duration_seconds: 60 }),
  ];
  const result = summarizeGames(rows);
  assert.equal(result.started, 3);
  assert.equal(result.completed, 2);
  assert.equal(result.completionRate, 67);
  assert.equal(result.reports, 2);
  assert.equal(result.certificateRequested, 2);
  assert.equal(result.certificateSent, 1);
  assert.equal(result.averageSeconds, 80);
  assert.equal(JSON.stringify(result.funnel.map((stage) => stage.percent)), JSON.stringify([100, 67, 67, 33]));
});

test('daily series fills missing dates and separates started from completed', () => {
  const { dailySeries } = loadData();
  const rows = [game(), game({ game_id: '2', completed: false }), game({ game_id: '3', played_at: '2026-11-04T10:00:00.000Z' })];
  const series = dailySeries(rows, '7d', new Date('2026-11-06T12:00:00.000Z'));
  assert.equal(series.length, 7);
  assert.equal(JSON.stringify(series.at(-1)), JSON.stringify({ key: '2026-11-06', started: 2, completed: 1 }));
  assert.equal(JSON.stringify(series.at(-3)), JSON.stringify({ key: '2026-11-04', started: 1, completed: 1 }));
});

test('audience groups, question ranking, masking and visitor labels are deterministic', () => {
  const { audienceGroups, rankQuestions, maskContact, playerName } = loadData();
  const groups = audienceGroups([game(), game({ game_id: '2', lang: 'en', gender: 'female', quiz_type: 'kids' })]);
  assert.equal(groups.find((group) => group.id === 'language').items.length, 2);
  assert.equal(groups.find((group) => group.id === 'gender').items.find((item) => item.key === 'female').percent, 50);
  const ranked = rankQuestions([
    { quiz_type: 'adult', question_number: 1, players_answered: 20, wrong_attempts: 2, first_try_correct_players: 18, first_try_success_rate: 90 },
    { quiz_type: 'adult', question_number: 2, players_answered: 12, wrong_attempts: 8, first_try_correct_players: 4, first_try_success_rate: 33.3 },
  ]);
  assert.equal(ranked[0].question_number, 2);
  assert.equal(maskContact('player@example.com', 'email'), 'p•••••@example.com');
  assert.equal(maskContact('+971501234567', 'phone'), '+971•••••4567');
  assert.equal(playerName(game(), 'ar'), 'زائر');
  assert.equal(playerName(game(), 'en'), 'Visitor');
});
