// Run against the dev-only smoke page. Uses the exact Dialog/Card/Input
// components and class constants used by the production TrainingDiaryPage.
// Chromium emulates the mobile viewport and keyboard resize, NOT iOS WebKit.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const url = process.env.DIARY_SMOKE_URL || "http://127.0.0.1:4173/diary-mobile-smoke.html";
const shots = path.resolve(process.env.DIARY_SCREENSHOT_DIR || "test-artifacts/diary");
fs.mkdirSync(shots, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  let page;
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    page = await context.newPage();
    page.on("pageerror", error => { throw error; });
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    assert(response && response.ok(), "Smoke page must load");
    await page.locator('[data-testid="training-diary-dialog"]').waitFor({ state: "visible" });

    const inspect = async (description, expectFullscreen = true) => {
      const state = await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="training-diary-dialog"]');
        const footer = document.querySelector('[data-testid="training-diary-footer"]');
        const scroll = document.querySelector('[data-testid="training-diary-scroll"]');
        const load = document.querySelector('[data-testid="editable-load"]');
        if (!modal || !footer || !scroll || !load) return { missing: true };
        const modalRect = modal.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        const scrollRect = scroll.getBoundingClientRect();
        const point = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 3);
        return {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          modal: { top: modalRect.top, bottom: modalRect.bottom, left: modalRect.left, right: modalRect.right },
          footer: { top: footerRect.top, bottom: footerRect.bottom, height: footerRect.height },
          scroll: { top: scrollRect.top, bottom: scrollRect.bottom, height: scrollRect.height, scrollHeight: scroll.scrollHeight },
          inputFontSize: parseFloat(window.getComputedStyle(load).fontSize),
          bottomCoveredByModal: !!(point && modal.contains(point)),
          toastCount: document.querySelectorAll('[data-sonner-toast]').length,
        };
      });
      console.log(description, JSON.stringify(state));
      assert(!state.missing, "The actual dialog/scroll/footer must exist");
      if (expectFullscreen) {
        assert(Math.abs(state.modal.top) < 2, description + ": top edge must touch viewport");
        assert(Math.abs(state.modal.bottom - state.viewport.height) < 2, description + ": bottom edge must touch viewport");
        assert(Math.abs(state.modal.left) < 2, description + ": left edge must touch viewport");
        assert(Math.abs(state.modal.right - state.viewport.width) < 2, description + ": right edge must touch viewport");
        assert(state.bottomCoveredByModal, description + ": background must not leak at bottom");
      } else {
        assert(state.modal.left > 80, "Desktop modal must be centered, not fullscreen");
        assert(state.modal.right < state.viewport.width - 80, "Desktop modal must not be full width");
      }
      assert(state.footer.top >= state.scroll.bottom - 2, description + ": footer must not overlap the scroll region");
      assert(state.footer.bottom <= state.modal.bottom + 2, description + ": footer must stay inside the modal");
      assert(state.scroll.scrollHeight > state.scroll.height, description + ": long diary must scroll inside the modal");
      if (expectFullscreen) {
        assert(state.inputFontSize >= 16, description + ": editable fields must not trigger iOS input zoom");
      }
      assert(state.toastCount <= 1, description + ": notifications must not stack");
    };

    await inspect("initial iPhone portrait");
    await page.screenshot({ path: path.join(shots, "initial-iphone.png") });
    const input = page.locator('[data-testid="editable-load"]');
    const button = page.locator('[data-testid="diary-save"]');
    await input.scrollIntoViewIfNeeded();
    for (let number = 1; number <= 6; number++) {
      await input.fill(String(60 + number));
      await button.click();
      await page.waitForFunction(expected => {
        const el = document.querySelector('[data-testid="save-count"]');
        return el && Number(el.textContent) === expected;
      }, number);
      await inspect("edit/save cycle " + number);
    }
    await page.screenshot({ path: path.join(shots, "six-saves-iphone.png") });

    // A mobile keyboard temporarily reduces the viewport height. Closing it
    // restores the previous viewport; the footer must follow both transitions.
    await page.setViewportSize({ width: 390, height: 540 });
    await inspect("keyboard-height viewport");
    await page.setViewportSize({ width: 390, height: 844 });
    await inspect("keyboard dismissed/viewport restored");
    await page.screenshot({ path: path.join(shots, "after-keyboard-iphone.png") });

    // The old bug depended on JS-set --diary-viewport-height / -top. Inject
    // stale values and ensure the full-bleed sheet is independent of them.
    await page.locator('[data-testid="training-diary-dialog"]').evaluate(modal => {
      modal.style.setProperty("--diary-viewport-height", "200px");
      modal.style.setProperty("--diary-viewport-top", "70px");
    });
    await inspect("stale legacy viewport variables ignored");

    await page.setViewportSize({ width: 1280, height: 800 });
    await inspect("desktop layout preserved", false);
    await page.screenshot({ path: path.join(shots, "desktop.png") });
    console.log("PASS: diary modal/mobile save viewport regression checks");
  } catch (error) {
    console.error("FAIL:", error.stack || error.message);
    if (page) {
      try { await page.screenshot({ path: path.join(shots, "failure.png"), fullPage: true }); } catch {}
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
