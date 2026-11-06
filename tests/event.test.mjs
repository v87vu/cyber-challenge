import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const cache = new Map();
function load(file, mocks = {}) {
  file = resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', source)((name) => {
    if (name in mocks) return mocks[name];
    return name.startsWith('.') ? load(resolve(dirname(file), `${name}.ts`), mocks) : require(name);
  }, mod, mod.exports);
  return mod.exports;
}
const m = load('src/lib/event/model.ts');
const session = { id: 'event-123456', code: '1234', ended: false, teams: [{ id: 'team-1', name: 'أحمر' }, { id: 'team-2', name: 'أزرق' }], players: [] };
const player = (id, teamId = 'team-1') => ({ id, teamId, nickname: 'صقر', correct: 0, total: 22, finished: false, elapsed: 0 });
assert.equal(m.cleanNickname(' صقر '), 'صقر');
for (const nickname of ['fuck', 'F U C K', 'كـسـم', 'a@b.com', '123456789', '<script>', 'a'.repeat(17), '\u202Ex', '']) assert.equal(m.cleanNickname(nickname), '', nickname);
assert.equal(m.validSession(session), true);
assert.equal(m.applyProgress(session, { ...player('unknown-123'), correct: 3 }), false);
assert.equal(m.admit(session, player('player-123')).id, 'player-123');
assert.equal(m.admit(session, player('player-123', 'team-2')), 'invalid');
assert.equal(m.admit(session, { ...player('player-123'), nickname: 'نسر' }), 'invalid');
assert.equal(m.applyProgress(session, { ...player('player-123'), correct: 5, elapsed: 10 }), true);
assert.equal(m.applyProgress(session, { ...player('player-123'), correct: 4, elapsed: 11 }), false);
assert.equal(m.applyProgress(session, { ...player('player-123'), correct: 7, elapsed: 9 }), false);
assert.equal(m.applyProgress(session, { ...player('player-123'), correct: 7, elapsed: 11, finished: true }), false);
for (let i = 1; i < 200; i++) m.admit(session, player(`player-${String(i).padStart(4, '0')}`));
assert.equal(session.players.length, 200);
assert.equal(m.admit(session, player('overflow-123')), 'full');
assert.equal(m.admit(session, player('player-123')).id, 'player-123');
session.ended = true;
assert.equal(m.applyProgress(session, { ...player('player-123'), correct: 22, elapsed: 50, finished: true }), false);
assert.equal(m.admit(session, player('late-12345')), 'ended');
assert.equal(m.validSession(JSON.parse(JSON.stringify(session))), true);
const ranked = m.leaderboard({ ...session, players: [
  { ...player('player-red'), correct: 11, elapsed: 50 },
  { ...player('player-blue', 'team-2'), total: 10, correct: 5, elapsed: 30 },
] });
assert.equal(ranked[0].id, 'team-2');
assert.equal(ranked[0].average, 50);

// Exercise the player protocol through a simulated broadcast/presence connection.
const broadcasts = [];
let callback, subscribe;
const channel = {
  state: 'joined', on(type, _event, cb) { if (type === 'broadcast') callback = cb; return this; },
  subscribe(cb) { subscribe = cb; queueMicrotask(() => cb('SUBSCRIBED')); return this; },
  track: async () => 'ok',
};
const storage = new Map();
globalThis.sessionStorage = { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
const client = { channel: () => channel, removeChannel: async () => {} };
const { EventPlayer } = load('src/lib/event/player.ts', { './realtime': {
  eventClient: () => client,
  members: () => [{ role: 'presenter', code: '1234', eventId: session.id }],
  send: (_ch, payload) => broadcasts.push(payload),
} });
const p = new EventPlayer('1234');
const cleanup = p.connect();
try {
  const info = m.eventInfo({ ...session, ended: false });
  callback({ payload: { kind: 'state', code: '9999', info } });
  assert.equal(p.snapshot().info, null, 'ignore wrong code');
  callback({ payload: { kind: 'state', code: '1234', info } });
  p.join('team-1', 'صقر', 22);
  const join = broadcasts.find((msg) => msg.kind === 'join');
  assert.ok(join);
  callback({ payload: { kind: 'rejected', code: '1234', eventId: info.id, playerId: join.player.id, reason: 'full' } });
  callback({ payload: { kind: 'state', code: '1234', info } });
  assert.equal(p.snapshot().status, 'full', 'heartbeat must preserve capacity rejection');
  p.join('team-1', 'صقر', 22);
  p.updateQuiz(2, false, true);
  assert.equal(broadcasts.filter((msg) => msg.kind === 'progress').length, 0, 'no progress before host admission');
  callback({ payload: { kind: 'admitted', code: '1234', eventId: info.id, player: join.player } });
  assert.equal(p.snapshot().status, 'joined');
  p.updateQuiz(2, false, true);
  assert.equal(broadcasts.at(-1).player.correct, 2);
  assert.deepEqual(Object.keys(broadcasts.at(-1).player).sort(), ['correct', 'elapsed', 'finished', 'id', 'nickname', 'teamId', 'total'].sort());
  subscribe('CHANNEL_ERROR');
  assert.equal(p.snapshot().status, 'unavailable');
  subscribe('SUBSCRIBED');
  callback({ payload: { kind: 'state', code: '1234', info } });
  assert.equal(p.snapshot().status, 'joined');
  callback({ payload: { kind: 'state', code: '1234', info: { ...info, ended: true } } });
  const count = broadcasts.length;
  p.updateQuiz(22, true, true);
  assert.equal(broadcasts.length, count, 'frozen event accepts no more progress');
  callback({ payload: { kind: 'state', code: '1234', info } });
  assert.equal(p.snapshot().status, 'ended', 'stale heartbeat cannot reopen ended event');
} finally { cleanup(); }
console.log('PASS event model/protocol: validation, unknown codes, fixed teams, cap 200, scoring, tie time, admission, reconnect, freeze, private payload.');
