import assert from "node:assert/strict";
import {
  buildInitialState,
  calcMonth,
  buildCopyText,
  readState,
  writeState,
} from "./logic.js";

const init = buildInitialState({
  date: "2026-03-01",
  waterReading: 100,
  electricReading: 200,
  gasReading: 50,
  waterUnitPrice: 3,
  electricUnitPrice: 0.8,
  gasUnitPrice: 2.5,
  propertyRatio: 1,
});

assert.equal(init.last.date, "2026-03-01");

const { record, nextState } = calcMonth(init, {
  date: "2026-04-01",
  waterReading: 110,
  electricReading: 250,
  gasReading: 60,
  propertyAmount: 300,
});

assert.equal(record.usage.water, 10);
assert.equal(record.usage.electric, 50);
assert.equal(record.usage.gas, 10);
assert.equal(record.fee.water, 30);
assert.equal(record.fee.electric, 40);
assert.equal(record.fee.gas, 25);
assert.equal(record.property.fee, 300);
assert.equal(record.fee.total, 395);
assert.equal(nextState.last.date, "2026-04-01");

const copy = buildCopyText(record);
assert.ok(copy.includes("结算日期: 2026-04-01"));
assert.ok(copy.includes("本次总费用: 395.00"));

assert.throws(() => calcMonth(nextState, {
  date: "2026-04-01",
  waterReading: 120,
  electricReading: 260,
  gasReading: 70,
  propertyAmount: 300,
}), /结算日期必须晚于上次日期/);

assert.throws(() => calcMonth(nextState, {
  date: "2026-05-01",
  waterReading: 100,
  electricReading: 260,
  gasReading: 70,
  propertyAmount: 300,
}), /本次水表读数不能小于上次/);

console.log("logic tests passed");

const fakeStorage = {
  value: null,
  getItem() { return this.value; },
  setItem(_key, value) { this.value = value; },
  removeItem() { this.value = null; },
};

writeState({
  version: 2,
  baseline: { date: "2026-03-01", waterReading: 0, electricReading: 0, gasReading: 0 },
  last: { date: "2026-03-02", waterReading: 100, electricReading: 100, gasReading: 100 },
  config: { waterUnitPrice: 1, electricUnitPrice: 1, gasUnitPrice: 1, propertyRatio: 1 },
  records: [{
    date: "2026-03-02",
    period: { from: "2026-03-01", to: "2026-03-02", days: 1 },
    prev: { waterReading: 0, electricReading: 0, gasReading: 0 },
    curr: { waterReading: 100, electricReading: 100, gasReading: 100 },
    usage: { water: 100, electric: 100, gas: 100 },
    unitPrice: { water: 1, electric: 1, gas: 1 },
    property: { amount: 143, ratio: 1, fee: 143 },
    fee: { water: 1, electric: 1, gas: 1, total: 146 },
    createdAt: "2026-03-02T00:00:00.000Z",
  }],
  updatedAt: "2026-03-02T00:00:00.000Z",
}, fakeStorage);

const repaired = readState(fakeStorage);
assert.equal(repaired.records[0].fee.water, 100);
assert.equal(repaired.records[0].fee.electric, 100);
assert.equal(repaired.records[0].fee.gas, 100);
assert.equal(repaired.records[0].fee.total, 443);
