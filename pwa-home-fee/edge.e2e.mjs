import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const pw = (await import("file:///C:/Projects/family-menu/node_modules/playwright/index.js")).default;
const { chromium } = pw;

const edgePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const baseUrl = "http://127.0.0.1:4173/index.html";

const browser = await chromium.launch({
  executablePath: edgePath,
  headless: true,
});

const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.fill("#init-month", "2026-03");
  await page.fill("#init-water", "100");
  await page.fill("#init-electric", "200");
  await page.fill("#init-water-price", "3");
  await page.fill("#init-electric-price", "0.8");
  await page.fill("#init-property-base", "300");
  await page.fill("#init-property-ratio", "1");
  await page.click("#init-form button[type='submit']");

  await page.waitForTimeout(200);
  const stateText = await page.locator("#state-box").innerText();
  assert.match(stateText, /当前上月月份: 2026-03/);

  await page.fill("#calc-month", "2026-04");
  await page.fill("#calc-water", "110");
  await page.fill("#calc-electric", "250");
  await page.click("#calc-form button[type='submit']");

  await page.waitForTimeout(250);
  const detail = await page.locator("#result-box").inputValue();
  assert.match(detail, /结算月份: 2026-04/);
  assert.match(detail, /本月总费用: 370.00/);

  await page.click("#btn-copy");

  const rows = await page.locator("#history-body tr").count();
  assert.ok(rows >= 1, "history should have at least one row");

  const downloadPromise = page.waitForEvent("download");
  await page.click("#btn-export");
  const download = await downloadPromise;
  const savePath = path.join(os.tmpdir(), `home-fee-export-${Date.now()}.json`);
  await download.saveAs(savePath);
  assert.ok(fs.existsSync(savePath), "export file should exist");

  await page.once("dialog", (d) => d.accept());
  await page.click("#btn-clear");
  await page.waitForTimeout(250);
  const stateAfterClear = await page.locator("#state-box").innerText();
  assert.match(stateAfterClear, /尚未初始化/);

  await page.setInputFiles("#import-file", savePath);
  await page.waitForTimeout(300);
  const stateAfterImport = await page.locator("#state-box").innerText();
  assert.match(stateAfterImport, /当前上月月份: 2026-04/);

  console.log("EDGE_E2E_PASS");
} finally {
  await context.close();
  await browser.close();
}
