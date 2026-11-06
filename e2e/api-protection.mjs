// Dependency-free route checks: use the project's TypeScript compiler and mock all outbound services.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function loadRoute(path, mocks = {}) {
  const modules = new Map();
  function load(file) {
    file = resolve(file);
    if (modules.has(file)) return modules.get(file).exports;
    const loaded = { exports: {} };
    modules.set(file, loaded);
    const source = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = (name) => {
      if (name in mocks) return mocks[name];
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
      return require(name);
    };
    new Function('require', 'module', 'exports', source)(localRequire, loaded, loaded.exports);
    return loaded.exports;
  }
  return load(path);
}

process.env.RESEND_API_KEY = 'mock-key';
process.env.CERTIFICATE_FROM_EMAIL = 'mock@example.invalid';
process.env.SUPABASE_URL = 'https://mock.example.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';

const result = {
  playerId: 'player-12345', gameId: 'game-123456', lang: 'ar', ageGroup: '18-24',
  gender: 'male', quizType: 'adult', score: 1, total: 10, durationSeconds: 3,
  completed: true, playerName: 'Test', playerEmail: 'delivered@resend.dev', attempts: [{
    questionNumber: 1, selectedOption: 0, correctOption: 0, isCorrect: true,
    timedOut: false, timeSpentSeconds: 2,
  }],
};
const certificate = {
  gameId: result.gameId, name: result.playerName, email: result.playerEmail,
  lang: 'ar', fileBase64: Buffer.from('%PDF-1.4\ntest').toString('base64'),
};
function request(body, ip = '192.0.2.1', headers = {}) {
  return new Request('http://localhost/api/test', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const protection = loadRoute('src/lib/apiProtection.ts');
const limiter = protection.createIpLimiter(3, 3_000);
for (let i = 0; i < 3; i++) assert.equal(limiter(request({}), 0), null);
assert.equal(limiter(request({}), 0).status, 429);
assert.equal(limiter(request({}), 0).headers.get('retry-after'), '1');
assert.equal(limiter(request({}, '192.0.2.2'), 0), null);
assert.equal(limiter(request({}), 1000), null);
await assert.rejects(protection.readJsonBody(request('"' + 'ع'.repeat(40) + '"'), 64), { status: 413 });
await assert.rejects(protection.readJsonBody(request('{}', undefined, { 'content-length': '100' }), 64), { status: 413 });
await assert.rejects(protection.readJsonBody(request('null'), 64), { status: 400 });

const writes = [];
const game = loadRoute('src/app/api/game-results/route.ts', {
  '@/lib/supabaseAdmin': {
    supabaseConfigured: () => true,
    supabaseRest: async (path, init) => {
      if (init?.method) writes.push({ path, body: JSON.parse(init.body) });
      return [];
    },
  },
});
for (const invalid of [null, [], '{', { ...result, score: '1' },
  { ...result, gender: ['male'] }, { ...result, attempts: [null] },
  { ...result, attempts: [{ ...result.attempts[0], questionNumber: 11 }] },
  { ...result, playerName: 'x'.repeat(121) }]) {
  assert.equal((await game.POST(request(invalid))).status, 400);
}
assert.equal(writes.length, 0);
assert.equal((await game.POST(request(' '.repeat(65_537)))).status, 413);
const saved = await game.POST(request({ ...result, certificateSent: true }));
assert.equal(saved.status, 200);
assert.match(saved.headers.get('set-cookie'), /cyber-certificate-game=game-123456/);
assert.match(saved.headers.get('set-cookie'), /HttpOnly/);
assert.match(saved.headers.get('set-cookie'), /Path=\/api\/send-certificate/);
assert.equal('certificate_sent' in writes[0].body, false);
const started = await game.POST(request({ ...result, completed: false }));
assert.match(started.headers.get('set-cookie'), /cyber-certificate-game=game-123456/);
for (let i = 0; i < 30; i++) assert.equal((await game.POST(request(null, '192.0.2.10'))).status, 400);
const gameLimited = await game.POST(request(null, '192.0.2.10'));
assert.equal(gameLimited.status, 429);
assert.ok(Number(gameLimited.headers.get('retry-after')) > 0);

let sent = false;
let providerCalls = 0;
let releaseProvider;
const providerWait = new Promise((resolve) => { releaseProvider = resolve; });
const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, init) => {
  providerCalls++;
  assert.equal(init.headers['Idempotency-Key'], `certificate/${result.gameId}`);
  await providerWait;
  return Response.json({ id: 'mock-email' });
};
try {
  const mail = loadRoute('src/app/api/send-certificate/route.ts', {
    '@/lib/supabaseAdmin': {
      supabaseConfigured: () => true,
      supabaseRest: async (_path, init) => {
        if (init?.method) {
          assert.equal(providerCalls, 1);
          assert.equal(init.method, 'PATCH');
          sent = JSON.parse(init.body).certificate_sent;
          return;
        }
        return [{ completed: true, certificate_sent: sent, player_name: result.playerName, player_email: result.playerEmail }];
      },
    },
  });
  assert.equal((await mail.POST(request({ ...certificate, gameId: undefined }, '192.0.2.20'))).status, 400);
  assert.equal((await mail.POST(request({ ...certificate, fileBase64: 'bm90IHBkZg==' }, '192.0.2.31'))).status, 400);
  assert.equal((await mail.POST(request({ ...certificate, name: 'Wrong person' }, '192.0.2.32'))).status, 400);
  assert.equal((await mail.POST(request(certificate, '192.0.2.33', { 'content-length': '10008193' }))).status, 413);
  assert.equal(providerCalls, 0);
  const firstSend = mail.POST(request({ ...certificate, gameId: undefined }, '192.0.2.21', {
    cookie: `cyber-certificate-game=${result.gameId}`,
  }));
  // Let the streamed request parse and the mock provider start before the competing send.
  while (!providerCalls) await new Promise((resolve) => setImmediate(resolve));
  const concurrent = await mail.POST(request(certificate, '192.0.2.22'));
  assert.equal(concurrent.status, 429);
  assert.equal(concurrent.headers.get('retry-after'), '5');
  releaseProvider();
  assert.equal((await firstSend).status, 200);
  assert.equal(sent, true);
  const repeated = await mail.POST(request(certificate, '192.0.2.23'));
  assert.deepEqual(await repeated.json(), { sent: true, alreadySent: true });
  assert.equal(providerCalls, 1);
  for (let i = 0; i < 3; i++) assert.equal((await mail.POST(request(null, '192.0.2.30'))).status, 400);
  const mailLimited = await mail.POST(request(certificate, '192.0.2.30'));
  assert.equal(mailLimited.status, 429);
  assert.ok(Number(mailLimited.headers.get('retry-after')) >= 1199);
} finally {
  globalThis.fetch = originalFetch;
}

process.env.ADMIN_EMAILS = ' First@example.invalid,SECOND@example.invalid, ,';
process.env.ADMIN_EMAIL = ' Legacy@example.invalid ';
let userEmail = '';
const adminMocks = {
  '@supabase/supabase-js': { createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { email: userEmail } }, error: null }) },
    from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }) }),
  }) },
  '@/lib/supabaseAdmin': { supabaseConfigured: () => true, supabaseRest: async () => [] },
};
for (const path of ['src/app/api/admin/stats/route.ts', 'src/app/admin/stats/route.ts']) {
  const admin = loadRoute(path, adminMocks);
  const authRequest = new Request('http://localhost/admin/stats', { headers: { authorization: 'Bearer mock' } });
  for (const email of ['first@example.invalid', 'SECOND@EXAMPLE.INVALID', 'legacy@example.invalid']) {
    userEmail = email;
    assert.equal((await admin.GET(authRequest)).status, 200);
  }
  userEmail = 'outsider@example.invalid';
  assert.equal((await admin.GET(authRequest)).status, 401);
  const allowlist = process.env.ADMIN_EMAILS;
  delete process.env.ADMIN_EMAILS;
  userEmail = 'legacy@example.invalid';
  assert.equal((await admin.GET(authRequest)).status, 200);
  process.env.ADMIN_EMAILS = allowlist;
}
console.log('PASS API protection: byte caps, validation, token refill, cookie integration, duplicate sends, and both admin allowlists.');
