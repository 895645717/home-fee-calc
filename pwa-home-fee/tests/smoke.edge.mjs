export default async function run({ page, baseUrl, assert, fs, path, os }) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.click(".tab[data-page='settings']");
  await page.fill("#init-date", "2026-03-01");
  await page.fill("#init-water", "100");
  await page.fill("#init-electric", "200");
  await page.fill("#init-gas", "50");
  await page.fill("#init-water-price", "3");
  await page.fill("#init-electric-price", "0.8");
  await page.fill("#init-gas-price", "2.5");
  await page.fill("#init-property-ratio", "1");
  await page.click("#init-form button[type='submit']");

  await page.waitForTimeout(250);
  await page.click(".tab[data-page='calc']");

  await page.fill("#calc-date", "2026-04-01");
  await page.fill("#calc-water", "110");
  await page.fill("#calc-electric", "250");
  await page.fill("#calc-gas", "60");
  await page.fill("#calc-property-amount", "300");
  await page.click("#calc-form button[type='submit']");

  await page.waitForTimeout(300);
  const detail = await page.locator("#result-box").inputValue();
  assert.match(detail, /📅 结算日期: 2026-04-01/);
  assert.match(detail, /🧮 本次总费用: 395.00 元/);

  await page.click("#btn-copy");

  await page.click(".tab[data-page='history']");
  const cards = await page.locator(".history-card").count();
  assert.ok(cards >= 1, "history should have at least one card");

  await page.click(".tab[data-page='settings']");
  const initWaterValue = await page.locator("#init-water").inputValue();
  assert.equal(initWaterValue, "110");

  const downloadPromise = page.waitForEvent("download");
  await page.click("#btn-export");
  const download = await downloadPromise;
  const savePath = path.join(os.tmpdir(), `home-fee-export-${Date.now()}.json`);
  await download.saveAs(savePath);
  assert.ok(fs.existsSync(savePath), "export file should exist");

  await page.click(".tab[data-page='history']");
  await page.click("[data-delete-id]");
  await page.waitForTimeout(250);
  const emptyText = await page.locator("#history-list").innerText();
  assert.match(emptyText, /暂无历史记录/);

  await page.click(".tab[data-page='settings']");
  const stateAfterDelete = await page.locator("#state-box").innerText();
  assert.doesNotMatch(stateAfterDelete, /2026-04-01/);

  await page.setInputFiles("#import-file", savePath);
  await page.waitForTimeout(350);
  const stateAfterImport = await page.locator("#state-box").innerText();
  assert.match(stateAfterImport, /2026-04-01/);
}
