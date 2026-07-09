const test = require("node:test");
const assert = require("node:assert");
const { formatDate } = require("../src/utils/rowMappers");

test("formatDate: parses Date object representing local date to correct YYYY-MM-DD string without UTC shifting", () => {
  // Create a local Date object for July 9, 2026
  const dateObj = new Date(2026, 6, 9); // Month is 0-indexed, so 6 is July
  const formatted = formatDate(dateObj);
  assert.strictEqual(formatted, "2026-07-09");
});

test("formatDate: preserves string YYYY-MM-DD date inputs without shifting", () => {
  const formatted = formatDate("2026-07-09");
  assert.strictEqual(formatted, "2026-07-09");
});

test("formatDate: handles empty/falsy inputs", () => {
  assert.strictEqual(formatDate(null), "");
  assert.strictEqual(formatDate(undefined), "");
});
