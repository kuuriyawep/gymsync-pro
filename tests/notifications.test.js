import test from "node:test";
import assert from "node:assert/strict";
import { normalizeNotifications, notificationTimestamp, reminderStage, unreadCount } from "../src/lib/notifications.js";

test("duplicate rows collapse to one notification", () => {
  const items = normalizeNotifications([
    { id: "1", type: "expiry", title: "Membership expires in 5 days", description: "A", occurredAt: "2026-11-05T10:00:00Z" },
    { id: "1", type: "expiry", title: "Membership expires in 5 days", description: "A", occurredAt: "2026-11-05T10:00:00Z" },
  ]);
  assert.equal(items.length, 1);
});

test("the same event re-created with a new id is not shown twice", () => {
  const items = normalizeNotifications([
    { id: "a", type: "expiry", title: "Membership expires today", description: "Renew", createdAt: "2026-11-06T08:00:00Z" },
    { id: "b", type: "expiry", title: "Membership expires today", description: "Renew", createdAt: "2026-11-06T09:00:00Z" },
  ]);
  assert.equal(items.length, 1);
});

test("distinct events are kept and sorted newest first", () => {
  const items = normalizeNotifications([
    { id: "1", type: "payments", title: "Payment received", description: "Ali", occurredAt: "2026-11-01T10:00:00Z" },
    { id: "2", type: "newMembers", title: "New member", description: "Hawa", occurredAt: "2026-11-05T10:00:00Z" },
  ]);
  assert.deepEqual(items.map((item) => item.id), ["2", "1"]);
});

test("unread count matches the badge source", () => {
  const items = normalizeNotifications([
    { id: "1", title: "A", read: false },
    { id: "2", title: "B", read_at: "2026-11-05T10:00:00Z" },
  ]);
  assert.equal(unreadCount(items), 1);
  assert.equal(unreadCount([]), 0);
});

test("empty and malformed payloads are safe", () => {
  assert.deepEqual(normalizeNotifications(), []);
  assert.deepEqual(normalizeNotifications(null), []);
  assert.equal(notificationTimestamp(""), "");
  assert.equal(notificationTimestamp("nonsense"), "");
});

test("reminder categories are labelled from backend titles only", () => {
  assert.equal(reminderStage("Membership expires in 5 days"), "5 days before expiry");
  assert.equal(reminderStage("Membership expires tomorrow"), "1 day before expiry");
  assert.equal(reminderStage("Membership expires today"), "Expires today");
  assert.equal(reminderStage("Payment received"), "");
});