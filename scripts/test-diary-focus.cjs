const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.DIARY_BROWSER || 'webkit';
const baseline = process.env.DIARY_BASELINE === '1';
const base = 'http://127.0.0.1:4173';
const out = path.resolve(process.env.DIARY_SCREENSHOT_DIR || 'test-artifacts/focus');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true });
  let page;
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== base || url.pathname.startsWith('/api/')) return route.abort();
      return route.continue();
    });
    // Native keyboards do NOT resize the layout viewport on iOS. Unlike the
    // previous test, drive visual viewport height AND offset independently.
    // This models those events; it is not a physical iPhone OS keyboard test.
    await context.addInitScript(() => {
      const nativeViewport = window.visualViewport;
      const shim = new EventTarget();
      let values = null;
      for (const key of ['height', 'width', 'offsetTop', 'offsetLeft', 'scale', 'pageTop', 'pageLeft']) {
        Object.defineProperty(shim, key, { get: () => values?.[key] ?? nativeViewport?.[key] ?? (key === 'scale' ? 1 : 0) });
      }
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => shim });
      window.__setDiaryViewport = patch => {
        values = patch ? { width: window.innerWidth, height: window.innerHeight, scale: 1, offsetTop: 0, offsetLeft: 0, pageTop: 0, pageLeft: 0, ...patch } : null;
        shim.dispatchEvent(new Event('resize'));
        shim.dispatchEvent(new Event('scroll'));
      };
    });
    page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/diary-focus-regression.html', { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByRole('tab', { name: 'Registros', exact: true }).click();
    const target = page.getByText('REGRESSÃO DE FOCO', { exact: false }).first();
    await target.scrollIntoViewIfNeeded();
    assert.equal(await page.locator('html').getAttribute('data-diary-focus-lock'), null, 'Closed diary must not lock dashboard');
    const prior = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    const priorTop = (await target.boundingBox()).y;
    await target.click();
    const dialog = page.getByTestId('training-diary-dialog');
    await dialog.waitFor({ state: 'visible' });
    const cards = dialog.locator('[data-slot="card"]').filter({ has: page.locator('input[placeholder="Nome do exercício"]') });
    const card = cards.first();
    const weight = card.locator('input[type="number"]').nth(0);
    await weight.waitFor({ state: 'visible' });
    await weight.tap();

    const inspect = async (label, visibleTop = 0, visibleHeight = 844) => {
      await page.waitForTimeout(90);
      const value = await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="training-diary-dialog"]');
        const footer = document.querySelector('[data-testid="training-diary-footer"]');
        const scroll = document.querySelector('[data-testid="training-diary-scroll"]');
        const root = document.getElementById('root');
        const box = el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height }; };
        return {
          lock: document.documentElement.getAttribute('data-diary-focus-lock'),
          rootVisibility: getComputedStyle(root).visibility,
          bodyPosition: getComputedStyle(document.body).position,
          y: window.scrollY, layoutHeight: document.documentElement.clientHeight,
          modal: box(modal), footer: box(footer), scroll: box(scroll),
          focused: document.activeElement?.tagName,
          keyboard: document.querySelector('[data-diary-focus-layer]')?.getAttribute('data-keyboard-open'),
          toastCount: document.querySelectorAll('[data-sonner-toast]').length,
        };
      });
      console.log(label, JSON.stringify(value));
      if (baseline) return value;
      assert.equal(value.lock, 'v1', label + ': document must be isolated');
      assert.equal(value.rootVisibility, 'hidden', label + ': previous screen cannot paint beneath the editor');
      assert.equal(value.bodyPosition, 'fixed', label + ': overflow:hidden alone is insufficient');
      assert.equal(value.y, 0, label + ': document must not scroll on input focus');
      assert(Math.abs(value.modal.top - visibleTop) < 2, label + ': visible top');
      assert(Math.abs(value.modal.bottom - (visibleTop + visibleHeight)) < 2, label + ': visible bottom');
      assert(value.footer.top >= value.scroll.bottom - 2, label + ': no footer overlap');
      assert(value.footer.bottom <= value.modal.bottom + 2, label + ': footer contained');
      assert(value.toastCount <= 1, label + ': no notification stack');
      return value;
    };
    const initial = await inspect('actual editor: numeric focus before any save');
    if (baseline) {
      assert.notEqual(initial.lock, 'v1', 'Baseline must really be old app code');
      assert.notEqual(initial.rootVisibility, 'hidden', 'Baseline still paints the old page');
      await page.evaluate(() => window.__setDiaryViewport({ height: 444, offsetTop: 70, pageTop: 70 }));
      const keyboard = await inspect('baseline: independent visual viewport changed');
      assert(Math.abs(keyboard.modal.bottom - 514) > 2, 'Baseline must miss the independent keyboard viewport');
      await page.screenshot({ path: path.join(out, 'baseline-focus.png') });
      console.log('BASELINE_REPRODUCED: real editor leaves the old page painted and ignores keyboard-only viewport offset');
      return;
    }

    // User-reported trigger: tap editable controls BEFORE pressing Save.
    await page.evaluate(() => window.__setDiaryViewport({ height: 444, offsetTop: 70, pageTop: 70 }));
    const keyboard = await inspect('keyboard-only resize + 70px pan (layout unchanged)', 70, 444);
    assert.equal(keyboard.layoutHeight, 844, 'This test must not merely resize the whole browser');
    await page.screenshot({ path: path.join(out, 'actual-editor-keyboard.png') });
    await page.evaluate(() => window.scrollTo(0, 90));
    await inspect('browser focus attempts document scroll', 70, 444);

    // Simulate Done while focus remains on the input, with a stale toolbar pan.
    await page.evaluate(() => window.__setDiaryViewport({ height: 844, offsetTop: 60, pageTop: 60 }));
    await inspect('keyboard dismissed while input remains focused');
    await page.evaluate(() => window.__setDiaryViewport(null));

    for (let cycle = 1; cycle <= 6; cycle++) {
      await weight.fill(String(30 + cycle));
      const reps = card.locator('input[type="number"]').nth(1);
      await reps.fill(String(8 + cycle));
      await page.waitForTimeout(70);
      await dialog.getByRole('button', { name: 'Salvar', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="training-diary-dialog"]')?.textContent.includes('Salvando...') === false);
      await inspect('actual save cycle ' + cycle);
    }
    const persisted = await page.evaluate(() => window.__diaryFocusFixture.log.exercises[0].sets[0]);
    assert.equal(Number(persisted.weight), 36, 'Actual save handler must persist latest weight in synthetic transport');
    assert.equal(persisted.reps, 14, 'Actual save handler must persist latest reps');

    // Load type remains per SET. A sibling must not inherit the changed mode.
    const loadSelector = card.locator('[data-slot="select-trigger"]').nth(1);
    await loadSelector.click();
    await page.getByRole('option', { name: 'PC', exact: true }).click();
    await page.waitForTimeout(80);
    const loads = await page.evaluate(() => window.__diaryFocusFixture.log.exercises[0].sets.map(set => set.loadType));
    assert.deepEqual(loads, ['bodyweight', 'kg', 'kg']);
    await inspect('load-type dropdown focus');
    await loadSelector.click();
    await page.getByRole('option', { name: 'kg', exact: true }).click();
    const nameInput = card.locator('input[placeholder="Nome do exercício"]');
    await nameInput.fill('Hack Squat editado');
    await nameInput.press('Tab');
    await page.waitForTimeout(80);
    await inspect('exercise name focus and blur');
    await page.screenshot({ path: path.join(out, 'actual-editor-six-saves.png') });

    await dialog.getByRole('button', { name: 'Fechar', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForTimeout(100);
    const restored = await page.evaluate(() => ({ lock: document.documentElement.getAttribute('data-diary-focus-lock'), visibility: getComputedStyle(document.getElementById('root')).visibility, x: window.scrollX, y: window.scrollY }));
    assert.equal(restored.lock, null, 'Close must release scroll lock');
    assert.equal(restored.visibility, 'visible', 'Close must restore dashboard');
    assert.equal(restored.y, prior.y, 'Restore original document scroll');
    assert(Math.abs((await target.boundingBox()).y - priorTop) < 5, 'Restore underlying list scroll position');
    await target.click();
    await dialog.waitFor({ state: 'visible' });
    await inspect('reopen after restoration');
    await dialog.getByRole('button', { name: 'Fechar', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(errors.length, 0, 'Unexpected runtime errors: ' + errors.join('; '));
    console.log('REAL_EDITOR_PASS (' + engine + '): focus before save, independent keyboard geometry, six real saves, per-set load types and cleanup');
  } catch (error) {
    console.error('FAIL', error.stack || error);
    console.error('PAGE_ERRORS', JSON.stringify(errors));
    if (page) {
      console.error('PAGE_TEXT', (await page.locator('body').innerText().catch(() => '')).slice(0,3500));
      await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {});
    }
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
