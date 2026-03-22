import {
  buildInitialState,
  calcMonth,
  buildCopyText,
  deleteRecord,
  readState,
  writeState,
  clearState,
  fmtMoney,
  fmtNum,
} from "./logic.js";

const $ = (id) => document.getElementById(id);

const initForm = $("init-form");
const calcForm = $("calc-form");
const stateBox = $("state-box");
const resultBox = $("result-box");
const historyList = $("history-list");
const importInput = $("import-file");

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function ensureDateDefaults() {
  if (!$("init-date").value) $("init-date").value = todayIso();
  if (!$("calc-date").value) $("calc-date").value = todayIso();
}

function toast(msg, type = "ok") {
  const el = $("toast");
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.hidden = false;
  window.setTimeout(() => {
    el.hidden = true;
  }, 2200);
}

function getState() {
  return readState();
}

function setState(next) {
  writeState(next);
  render();
}

function activatePage(page) {
  document.querySelectorAll(".page").forEach((el) => {
    el.classList.toggle("active", el.id === `page-${page}`);
  });
  document.querySelectorAll(".tab").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });
  ensureDateDefaults();
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => activatePage(btn.dataset.page));
  });
}

function fillConfigForm(state) {
  if (!state || state.version !== 2) return;
  $("init-date").value = state.baseline.date;
  $("init-water").value = fmtNum(state.last.waterReading);
  $("init-electric").value = fmtNum(state.last.electricReading);
  $("init-gas").value = fmtNum(state.last.gasReading);
  $("init-water-price").value = fmtNum(state.config.waterUnitPrice);
  $("init-electric-price").value = fmtNum(state.config.electricUnitPrice);
  $("init-gas-price").value = fmtNum(state.config.gasUnitPrice);
  $("init-property-ratio").value = fmtNum(state.config.propertyRatio);
}

function renderState(state) {
  if (!state) {
    stateBox.innerHTML = `<div class="status-empty">📝 尚未初始化。请先在配置页录入初始值。</div>`;
    return;
  }
  if (state.version !== 2) {
    stateBox.innerHTML = `<div class="status-empty">⚠️ 检测到旧版本数据，请先清空后重新初始化。</div>`;
    return;
  }

  const lastRecord = Array.isArray(state.records) && state.records.length
    ? state.records[state.records.length - 1]
    : null;

  const readingItems = [
    ["📅 上次结算日期", state.last.date],
    ["💧 上次水表读数", `${fmtNum(state.last.waterReading)} 吨`],
    ["⚡ 上次电表读数", `${fmtNum(state.last.electricReading)} 度`],
    ["🔥 上次燃气读数", `${fmtNum(state.last.gasReading)} m³`],
    ["🏢 上次物业费", lastRecord ? `${fmtMoney(lastRecord.property.fee)} 元` : "-"],
  ];

  const pricingItems = [
    ["💧 水费单价", `${fmtNum(state.config.waterUnitPrice)} 元/吨`],
    ["⚡ 电费单价", `${fmtNum(state.config.electricUnitPrice)} 元/度`],
    ["🔥 燃气单价", `${fmtNum(state.config.gasUnitPrice)} 元/m³`],
    ["🏢 物业费比例", fmtNum(state.config.propertyRatio)],
  ];

  const makeGrid = (items) => items
    .map(([k, v]) => `<div class="status-item"><span class="k">${k}</span><span class="v">${v}</span></div>`)
    .join("");

  stateBox.innerHTML = [
    `<div class="status-section"><h4>🧮 上次结算与读数</h4><div class="status-grid">${makeGrid(readingItems)}</div></div>`,
    `<div class="status-section"><h4>💰 当前计费参数</h4><div class="status-grid">${makeGrid(pricingItems)}</div></div>`,
  ].join("");
}

function renderHistory(state) {
  historyList.innerHTML = "";
  const records = state && Array.isArray(state.records) ? [...state.records].reverse() : [];
  if (!records.length) {
    historyList.innerHTML = `<div class="history-empty">📭 暂无历史记录</div>`;
    return;
  }

  historyList.innerHTML = records.map((r) => `
    <article class="history-card">
      <div class="history-top">
        <div>
          <div class="history-date">📆 ${r.period.from} → ${r.period.to}</div>
          <div class="history-days">⏱ ${r.period.days} 天</div>
        </div>
        <button class="btn danger mini-btn" data-delete-id="${r.createdAt}">删除</button>
      </div>
      <div class="history-fees">
        <div class="history-fee-pill"><span class="label">💧 水费</span><span class="value">${fmtMoney(r.fee.water)} 元</span></div>
        <div class="history-fee-pill"><span class="label">⚡ 电费</span><span class="value">${fmtMoney(r.fee.electric)} 元</span></div>
        <div class="history-fee-pill"><span class="label">🔥 燃气费</span><span class="value">${fmtMoney(r.fee.gas)} 元</span></div>
        <div class="history-fee-pill"><span class="label">🏢 物业费</span><span class="value">${fmtMoney(r.property.fee)} 元</span></div>
      </div>
      <div class="history-total">🧮 总费用 ${fmtMoney(r.fee.total)} 元</div>
    </article>
  `).join("");

  historyList.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const currentState = getState();
      const nextState = deleteRecord(currentState, btn.dataset.deleteId);
      setState(nextState);
      toast("历史记录已删除");
    });
  });
}

function render() {
  const state = getState();
  renderState(state);
  renderHistory(state);
  ensureDateDefaults();
  fillConfigForm(state);
}

initForm.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const state = buildInitialState({
      date: $("init-date").value,
      waterReading: $("init-water").value,
      electricReading: $("init-electric").value,
      gasReading: $("init-gas").value,
      waterUnitPrice: $("init-water-price").value,
      electricUnitPrice: $("init-electric-price").value,
      gasUnitPrice: $("init-gas-price").value,
      propertyRatio: $("init-property-ratio").value,
    });
    setState(state);
    resultBox.value = "";
    toast("初始化完成");
    activatePage("calc");
  } catch (err) {
    toast(err.message || String(err), "err");
  }
});

calcForm.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const state = getState();
    const { record, nextState } = calcMonth(state, {
      date: $("calc-date").value,
      waterReading: $("calc-water").value,
      electricReading: $("calc-electric").value,
      gasReading: $("calc-gas").value,
      propertyAmount: $("calc-property-amount").value,
      waterUnitPrice: $("calc-water-price").value,
      electricUnitPrice: $("calc-electric-price").value,
      gasUnitPrice: $("calc-gas-price").value,
      propertyRatio: $("calc-property-ratio").value,
    });
    setState(nextState);
    resultBox.value = buildCopyText(record);
    toast("本次费用已计算并保存");
    calcForm.reset();
    ensureDateDefaults();
  } catch (err) {
    toast(err.message || String(err), "err");
  }
});

$("btn-copy").addEventListener("click", async () => {
  const text = resultBox.value.trim();
  if (!text) return toast("没有可复制的明细", "err");
  try {
    await navigator.clipboard.writeText(text);
    toast("已复制明细");
  } catch {
    resultBox.select();
    document.execCommand("copy");
    toast("已复制明细");
  }
});

$("btn-export").addEventListener("click", () => {
  const state = getState();
  if (!state) return toast("暂无数据可导出", "err");
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `home-fee-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("已导出备份");
});

$("btn-import").addEventListener("click", () => importInput.click());
importInput.addEventListener("change", async (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  try {
    const text = await f.text();
    const data = JSON.parse(text);
    if (!data.last || !data.config || data.version !== 2) {
      throw new Error("备份文件结构不正确或版本过旧");
    }
    setState(data);
    toast("导入成功");
  } catch (err) {
    toast(err.message || String(err), "err");
  } finally {
    importInput.value = "";
  }
});

$("btn-clear").addEventListener("click", () => {
  if (!window.confirm("确认清空所有本地数据？")) return;
  clearState();
  resultBox.value = "";
  render();
  toast("已清空");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const isWebHttp = location.protocol === "http:" || location.protocol === "https:";
    if (isWebHttp) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
      return;
    }

    // In native app WebView, stale SW caches can keep old UI assets forever.
    // Unregister and clear caches to ensure each APK update shows latest UI.
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {}

    if ("caches" in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {}
    }
  });
}

bindTabs();
render();


