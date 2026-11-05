import test from "node:test";
import assert from "node:assert/strict";
import { addDays, addMonths, gymDateKey, gymMonthMeta, monthKeyOf, gymWeekdayShort } from "../src/lib/gymTime.js";

test("gymDateKey uses the gym day, not the UTC day", () => {
  // 21:30 UTC is already the next calendar day in Africa/Mogadishu (UTC+3).
  assert.equal(gymDateKey("2026-11-05T21:30:00Z"), "2026-11-06");
  assert.equal(gymDateKey("2026-11-05T20:59:00Z"), "2026-11-05");
  assert.equal(gymDateKey("2026-03-01T00:00:00+03:00"), "2026-03-01");
});

test("gymDateKey returns an empty string for unusable input", () => {
  assert.equal(gymDateKey(""), "");
  assert.equal(gymDateKey("not-a-date"), "");
  assert.equal(gymDateKey(null), "");
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(addDays("2026-11-06", 0), "2026-11-06");
});

test("addMonths clamps to the last day of a shorter month", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2026-11-06", 3), "2027-02-06");
  assert.equal(addMonths("2026-11-06", 12), "2027-11-06");
});

test("gymMonthMeta aligns the calendar to the gym month", () => {
  const meta = gymMonthMeta("2026-11-06");
  assert.equal(meta.year, 2026);
  assert.equal(meta.month, 11);
  assert.equal(meta.daysInMonth, 30);
  assert.equal(meta.firstWeekday, 0); // 1 Nov 2026 is a Sunday
  assert.equal(meta.monthKey, "2026-11");
});

test("monthKeyOf and gymWeekdayShort are safe on empty input", () => {
  assert.equal(monthKeyOf("2026-11-06"), "2026-11");
  assert.equal(monthKeyOf(""), "");
  assert.equal(gymWeekdayShort("2026-11-06"), "Fri");
  assert.equal(gymWeekdayShort(""), "");
});