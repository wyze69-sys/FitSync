const test = require("node:test");
const assert = require("node:assert");
const {
  getCambodiaWeekInfo,
  getCambodiaDayOfWeek,
  toCambodiaDateStr,
  fromCambodiaParts
} = require("../src/services/gamificationService");

test("Cambodia timezone day of week calculation", () => {
  // June 6, 2026 is Saturday (6)
  const satDate = fromCambodiaParts(2026, 6, 6, 10, 0, 0);
  assert.strictEqual(getCambodiaDayOfWeek(satDate), 6);

  // June 7, 2026 is Sunday (0)
  const sunDate = fromCambodiaParts(2026, 6, 7, 23, 59, 59);
  assert.strictEqual(getCambodiaDayOfWeek(sunDate), 0);

  // June 1, 2026 is Monday (1)
  const monDate = fromCambodiaParts(2026, 6, 1, 0, 0, 0);
  assert.strictEqual(getCambodiaDayOfWeek(monDate), 1);
});

test("Cambodia date formatting helper", () => {
  const dateStr = toCambodiaDateStr(fromCambodiaParts(2026, 6, 6));
  assert.strictEqual(dateStr, "2026-06-06");
});

test("Cambodia weekly range boundary checks", () => {
  // Test Saturday
  const satDate = fromCambodiaParts(2026, 6, 6);
  const satInfo = getCambodiaWeekInfo(satDate);
  assert.strictEqual(satInfo.mondayStr, "2026-06-01");
  assert.strictEqual(satInfo.sundayStr, "2026-06-07");

  // Test Sunday (end of week)
  const sunDate = fromCambodiaParts(2026, 6, 7, 23, 59, 0);
  const sunInfo = getCambodiaWeekInfo(sunDate);
  assert.strictEqual(sunInfo.mondayStr, "2026-06-01");
  assert.strictEqual(sunInfo.sundayStr, "2026-06-07");

  // Test Monday (start of week)
  const monDate = fromCambodiaParts(2026, 6, 1, 0, 5, 0);
  const monInfo = getCambodiaWeekInfo(monDate);
  assert.strictEqual(monInfo.mondayStr, "2026-06-01");
  assert.strictEqual(monInfo.sundayStr, "2026-06-07");
});
