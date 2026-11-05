import test from "node:test";
import assert from "node:assert/strict";
import { attendanceDayKey, attendanceMonth, attendanceSummary, longestStreak } from "../src/lib/attendance.js";

const record = (iso) => ({ id: iso, checkedInAt: iso });

test("a check-in is attributed to the gym day", () => {
  assert.equal(attendanceDayKey(record("2026-11-05T22:10:00Z")), "2026-11-06");
  // date-only fallback still works when no timestamp is present
  assert.equal(attendanceDayKey({ date: "2026-11-04" }), "2026-11-04");
  assert.equal(attendanceDayKey({}), "");
});

test("consecutive gym days produce a streak", () => {
  const summary = attendanceSummary(
    [record("2026-11-04T06:00:00Z"), record("2026-11-05T06:00:00Z"), record("2026-11-06T06:00:00Z")],
    "",
    "2026-11-06"
  );
  assert.equal(summary.current, 3);
  assert.equal(summary.monthCount, 3);
});

test("a missed day breaks the streak", () => {
  const summary = attendanceSummary(
    [record("2026-11-02T06:00:00Z"), record("2026-11-03T06:00:00Z"), record("2026-11-06T06:00:00Z")],
    "",
    "2026-11-06"
  );
  assert.equal(summary.current, 1);
});

test("a streak stays alive when the last visit was yesterday", () => {
  const summary = attendanceSummary(
    [record("2026-11-04T06:00:00Z"), record("2026-11-05T06:00:00Z")],
    "",
    "2026-11-06"
  );
  assert.equal(summary.current, 2);
});

test("two check-ins on one gym day count once", () => {
  const summary = attendanceSummary(
    [record("2026-11-06T05:00:00Z"), record("2026-11-06T15:00:00Z")],
    "",
    "2026-11-06"
  );
  assert.equal(summary.current, 1);
  assert.equal(summary.dates.size, 1);
  assert.equal(summary.monthCount, 1);
});

test("empty history is empty, not invented", () => {
  const summary = attendanceSummary([], "", "2026-11-06");
  assert.equal(summary.current, 0);
  assert.equal(summary.monthCount, 0);
  assert.equal(summary.dates.size, 0);
  assert.ok(summary.week.every((day) => day.attended === false));
});

test("attendance before the tracking start date is ignored", () => {
  const summary = attendanceSummary(
    [record("2026-10-30T06:00:00Z"), record("2026-11-05T06:00:00Z"), record("2026-11-06T06:00:00Z")],
    "2026-11-01",
    "2026-11-06"
  );
  assert.equal(summary.current, 2);
  assert.equal(summary.monthCount, 2);
});

test("the last seven days are gym days and end today", () => {
  const summary = attendanceSummary([record("2026-11-06T06:00:00Z")], "", "2026-11-06");
  assert.equal(summary.week.length, 7);
  assert.equal(summary.week[6].key, "2026-11-06");
  assert.equal(summary.week[0].key, "2026-10-31");
  assert.equal(summary.week[6].attended, true);
  assert.equal(summary.week[5].attended, false);
});

test("longest streak spans gaps correctly", () => {
  const records = [
    record("2026-11-01T06:00:00Z"),
    record("2026-11-02T06:00:00Z"),
    record("2026-11-03T06:00:00Z"),
    record("2026-11-06T06:00:00Z"),
  ];
  assert.equal(longestStreak(records), 3);
  assert.equal(longestStreak([]), 0);
});

test("the calendar grid is aligned to the gym month", () => {
  const { cells, meta, firstKey } = attendanceMonth("2026-11-06");
  assert.equal(meta.daysInMonth, 30);
  assert.equal(firstKey, "2026-11-01");
  assert.equal(cells.filter(Boolean).length, 30);
  assert.equal(cells[0], 1); // 1 Nov 2026 is a Sunday, so the grid starts immediately
});