import assert from "node:assert/strict";
import test from "node:test";
import { monthRange, normalizeMonth, normalizeYear } from "@/lib/services/reports";

test("normalizeMonth handles YYYY-MM input", () => {
  assert.equal(normalizeMonth("2026-04"), "2026-04");
});

test("normalizeMonth handles YYYY-MM-DD input", () => {
  assert.equal(normalizeMonth("2026-04-23"), "2026-04");
});

test("monthRange returns first and last day for leap year February", () => {
  const range = monthRange("2024-02");
  assert.equal(range.start, "2024-02-01");
  assert.equal(range.end, "2024-02-29");
});

test("normalizeYear clamps invalid values to current year range behavior", () => {
  const now = new Date().getUTCFullYear();
  assert.equal(normalizeYear("abcd"), now);
  assert.equal(normalizeYear("1900"), now);
  assert.equal(normalizeYear("2200"), now);
  assert.equal(normalizeYear("2026"), 2026);
});
