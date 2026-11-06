/* BASE=http://localhost:3400 node e2e/event.mjs
   Uses real Supabase broadcast/presence. Clearly skips only when public env is absent. */
import assert from 'node:assert/strict';
import { chromium } from '/Users/ahmedalali/node_modules/playwright/index.mjs';
import { AR_CORRECT, answerCorrect, fastForwardVideo, startGame } from './helpers.mjs';

const BASE = process.env.BASE || 'http://localhost:3400';
const browser = await chromium.launch();
try {
  const presenter = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await presenter.goto(`${BASE}/event`);
  await presenter.waitForFunction(() => document.querySelector('[data-testid="event-start"] button:not(:disabled), [data-testid="event-unavailable"]'));
  if (await presenter.getByTestId('event-unavailable').count()) {
    console.log('SKIP event realtime e2e: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are missing or invalid in this build.');
  } else {
    await presenter.getByTestId('event-start').click();
    const codeNode = presenter.getByTestId('event-code');
    await codeNode.waitFor({ timeout: 20000 });
    const code = (await codeNode.innerText()).trim();
    assert.match(code, /^\d{4}$/);
    const players = [];
    const personalRequests = [];
    for (let i = 0; i < 2; i++) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      page.on('request', (request) => {
        if (/\/api\/(game-results|send-certificate|ai-review)/.test(request.url())) personalRequests.push(request.url());
      });
      await page.goto(`${BASE}/play?event=${code}`);
      await page.getByText('18–24 سنة', { exact: true }).click();
      await page.getByRole('button', { name: 'متابعة', exact: true }).click();
      await page.getByText('ذكر', { exact: true }).click();
      await page.locator(`input[name="event-team"][value="team-${i + 1}"]`).check({ timeout: 15000 });
      await page.getByTestId('event-nickname').fill(i === 0 ? 'صقر' : 'نسر');
      await page.getByRole('button', { name: 'انضم إلى الفعالية', exact: true }).click();
      await fastForwardVideo(page);
      // After the test-only video seek, exercise privacy without the webdriver save shortcut.
      await page.evaluate(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
      await startGame(page);
      players.push(page);
    }
    await presenter.waitForFunction(() => document.querySelector('[data-testid="event-player-count"]')?.textContent?.includes('2'));
    for (const page of players) for (let q = 0; q < 2; q++) await answerCorrect(page, AR_CORRECT[q]);
    for (let i = 1; i <= 2; i++) {
      await presenter.waitForFunction((id) => Number(document.querySelector(`[data-testid="event-team-${id}"]`)?.getAttribute('data-average')) > 0, `team-${i}`);
    }
    const scores = await presenter.locator('[data-average]').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-average')));
    await presenter.reload();
    await presenter.getByTestId('event-code').waitFor({ timeout: 15000 });
    assert.equal((await presenter.getByTestId('event-code').innerText()).trim(), code);
    assert.deepEqual(await presenter.locator('[data-average]').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-average'))), scores);
    await presenter.locator('[data-testid="event-end"] button:not([disabled])').waitFor({ timeout: 15000 });
    await presenter.getByTestId('event-end').click();
    await players[0].getByText('انتهت الفعالية', { exact: true }).waitFor({ timeout: 15000 });
    assert.deepEqual(await presenter.locator('[data-average]').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-average'))), scores);
    assert.equal(personalRequests.length, 0, 'Event play must never send personal analytics, AI review or certificate requests');
    console.log('PASS event: two teams, live count/progress, refresh persistence, frozen results, privacy.');
  }
} finally {
  await browser.close();
}
