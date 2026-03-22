export const STORAGE_KEY = "home_fee_pwa_v2";

export function isValidDate(date) {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date);
}

export function toNum(v, fieldName) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${fieldName} 不是有效数字`);
  return n;
}

export function nonNegative(v, fieldName) {
  const n = toNum(v, fieldName);
  if (n < 0) throw new Error(`${fieldName} 不能小于 0`);
  return n;
}

export function compareDate(a, b) {
  return a.localeCompare(b);
}

export function daysBetween(fromDate, toDate) {
  const ms = new Date(toDate).getTime() - new Date(fromDate).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function fmtNum(n, digits = 4) {
  const s = Number(n).toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return s === "-0" ? "0" : s;
}

export function fmtMoney(n) {
  return Number(n).toFixed(2);
}

function recomputeRecord(record) {
  if (!record) return record;

  const usage = {
    water: Number(record.usage?.water ?? 0),
    electric: Number(record.usage?.electric ?? 0),
    gas: Number(record.usage?.gas ?? 0),
  };

  const unitPrice = {
    water: Number(record.unitPrice?.water ?? 0),
    electric: Number(record.unitPrice?.electric ?? 0),
    gas: Number(record.unitPrice?.gas ?? 0),
  };

  const property = {
    amount: Number(record.property?.amount ?? 0),
    ratio: Number(record.property?.ratio ?? 0),
  };

  const fee = {
    water: usage.water * unitPrice.water,
    electric: usage.electric * unitPrice.electric,
    gas: usage.gas * unitPrice.gas,
  };

  property.fee = property.amount * property.ratio;
  fee.total = fee.water + fee.electric + fee.gas + property.fee;

  return {
    ...record,
    usage,
    unitPrice,
    property,
    fee,
  };
}

export function normalizeState(state) {
  if (!state || state.version !== 2) return state;

  const records = Array.isArray(state.records)
    ? state.records.map(recomputeRecord)
    : [];

  return {
    ...state,
    records,
  };
}

export function buildInitialState(input) {
  const date = String(input.date || "").trim();
  if (!isValidDate(date)) throw new Error("初始化日期格式应为 YYYY-MM-DD");

  const waterReading = nonNegative(input.waterReading, "初始水表读数");
  const electricReading = nonNegative(input.electricReading, "初始电表读数");
  const gasReading = nonNegative(input.gasReading, "初始燃气表读数");

  return {
    version: 2,
    config: {
      waterUnitPrice: nonNegative(input.waterUnitPrice, "水费单价"),
      electricUnitPrice: nonNegative(input.electricUnitPrice, "电费单价"),
      gasUnitPrice: nonNegative(input.gasUnitPrice, "燃气单价"),
      propertyRatio: nonNegative(input.propertyRatio, "物业费比例"),
    },
    baseline: { date, waterReading, electricReading, gasReading },
    last: { date, waterReading, electricReading, gasReading },
    records: [],
    updatedAt: new Date().toISOString(),
  };
}

export function rebuildState(state, records) {
  const sortedRecords = [...records].sort((a, b) => compareDate(a.date, b.date));
  const nextState = {
    ...state,
    records: sortedRecords,
    last: {
      date: state.baseline.date,
      waterReading: state.baseline.waterReading,
      electricReading: state.baseline.electricReading,
      gasReading: state.baseline.gasReading,
    },
    config: {
      waterUnitPrice: state.config.waterUnitPrice,
      electricUnitPrice: state.config.electricUnitPrice,
      gasUnitPrice: state.config.gasUnitPrice,
      propertyRatio: state.config.propertyRatio,
    },
    updatedAt: new Date().toISOString(),
  };

  if (!sortedRecords.length) {
    return nextState;
  }

  for (const record of sortedRecords) {
    nextState.last = {
      date: record.date,
      waterReading: record.curr.waterReading,
      electricReading: record.curr.electricReading,
      gasReading: record.curr.gasReading,
    };
    nextState.config = {
      waterUnitPrice: record.unitPrice.water,
      electricUnitPrice: record.unitPrice.electric,
      gasUnitPrice: record.unitPrice.gas,
      propertyRatio: record.property.ratio,
    };
  }

  return nextState;
}

export function deleteRecord(state, createdAt) {
  const filtered = (state.records || []).filter((record) => record.createdAt !== createdAt);
  return rebuildState(state, filtered);
}

export function calcMonth(state, input) {
  if (!state || !state.last || !state.config) {
    throw new Error("未找到初始化数据，请先在配置页初始化");
  }
  if (state.version !== 2) {
    throw new Error("检测到旧版本数据，请先清空并重新初始化");
  }

  const date = String(input.date || "").trim();
  if (!isValidDate(date)) throw new Error("结算日期格式应为 YYYY-MM-DD");
  if (compareDate(date, state.last.date) <= 0) {
    throw new Error(`结算日期必须晚于上次日期 ${state.last.date}`);
  }

  const prevWater = Number(state.last.waterReading);
  const prevElectric = Number(state.last.electricReading);
  const prevGas = Number(state.last.gasReading);
  const prevDate = state.last.date;

  const currWater = nonNegative(input.waterReading, "本次水表读数");
  const currElectric = nonNegative(input.electricReading, "本次电表读数");
  const currGas = nonNegative(input.gasReading, "本次燃气表读数");

  if (currWater < prevWater) throw new Error("本次水表读数不能小于上次");
  if (currElectric < prevElectric) throw new Error("本次电表读数不能小于上次");
  if (currGas < prevGas) throw new Error("本次燃气表读数不能小于上次");

  const waterUnitPrice = input.waterUnitPrice === "" || input.waterUnitPrice == null
    ? Number(state.config.waterUnitPrice)
    : nonNegative(input.waterUnitPrice, "水费单价");
  const electricUnitPrice = input.electricUnitPrice === "" || input.electricUnitPrice == null
    ? Number(state.config.electricUnitPrice)
    : nonNegative(input.electricUnitPrice, "电费单价");
  const gasUnitPrice = input.gasUnitPrice === "" || input.gasUnitPrice == null
    ? Number(state.config.gasUnitPrice)
    : nonNegative(input.gasUnitPrice, "燃气单价");
  const propertyRatio = input.propertyRatio === "" || input.propertyRatio == null
    ? Number(state.config.propertyRatio)
    : nonNegative(input.propertyRatio, "物业费比例");

  const propertyAmount = nonNegative(input.propertyAmount, "当月物业费");

  const waterUsage = currWater - prevWater;
  const electricUsage = currElectric - prevElectric;
  const gasUsage = currGas - prevGas;

  const waterFee = waterUsage * waterUnitPrice;
  const electricFee = electricUsage * electricUnitPrice;
  const gasFee = gasUsage * gasUnitPrice;
  const propertyFee = propertyAmount * propertyRatio;
  const totalFee = waterFee + electricFee + gasFee + propertyFee;

  const record = {
    date,
    period: {
      from: prevDate,
      to: date,
      days: daysBetween(prevDate, date),
    },
    prev: { waterReading: prevWater, electricReading: prevElectric, gasReading: prevGas },
    curr: { waterReading: currWater, electricReading: currElectric, gasReading: currGas },
    usage: { water: waterUsage, electric: electricUsage, gas: gasUsage },
    unitPrice: { water: waterUnitPrice, electric: electricUnitPrice, gas: gasUnitPrice },
    property: { amount: propertyAmount, ratio: propertyRatio, fee: propertyFee },
    fee: { water: waterFee, electric: electricFee, gas: gasFee, total: totalFee },
    createdAt: new Date().toISOString(),
  };

  const nextState = {
    ...state,
    config: { waterUnitPrice, electricUnitPrice, gasUnitPrice, propertyRatio },
    last: { date, waterReading: currWater, electricReading: currElectric, gasReading: currGas },
    records: [...(state.records || []), record],
    updatedAt: new Date().toISOString(),
  };

  return { record, nextState };
}

export function buildCopyText(record) {
  return [
    `📅 结算日期: ${record.date}`,
    "",
    "💧 水费",
    `用量: ${fmtNum(record.usage.water)} 吨`,
    `单价: ${fmtNum(record.unitPrice.water)} 元/吨`,
    `金额: ${fmtMoney(record.fee.water)} 元`,
    "",
    "⚡ 电费",
    `用量: ${fmtNum(record.usage.electric)} 度`,
    `单价: ${fmtNum(record.unitPrice.electric)} 元/度`,
    `金额: ${fmtMoney(record.fee.electric)} 元`,
    "",
    "🔥 燃气费",
    `用量: ${fmtNum(record.usage.gas)} m³`,
    `单价: ${fmtNum(record.unitPrice.gas)} 元/m³`,
    `金额: ${fmtMoney(record.fee.gas)} 元`,
    "",
    "🏢 物业费",
    `当月金额: ${fmtNum(record.property.amount)} 元`,
    `比例: ${fmtNum(record.property.ratio)}`,
    `计入: ${fmtMoney(record.property.fee)} 元`,
    "",
    `🧮 本次总费用: ${fmtMoney(record.fee.total)} 元`,
  ].join("\n");
}

export function readState(storage = localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return normalizeState(JSON.parse(raw));
}

export function writeState(state, storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(storage = localStorage) {
  storage.removeItem(STORAGE_KEY);
}
