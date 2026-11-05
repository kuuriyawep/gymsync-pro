import test from "node:test";
import assert from "node:assert/strict";
import { ERROR_KINDS, apiErrorInfo, isSessionExpired } from "../src/lib/apiErrors.js";

test("an expired session is not offered a retry", () => {
  const info = apiErrorInfo({ status: 401, message: "authentication_required" });
  assert.equal(info.kind, ERROR_KINDS.auth);
  assert.equal(info.retryable, false);
  assert.equal(isSessionExpired({ status: 401 }), true);
});

test("a network failure is retryable and never reported as missing data", () => {
  const info = apiErrorInfo({ message: "Failed to fetch" });
  assert.equal(info.kind, ERROR_KINDS.network);
  assert.equal(info.retryable, true);
});

test("permission denials are classified separately", () => {
  const info = apiErrorInfo({ status: 403, message: "Only an owner can do this" });
  assert.equal(info.kind, ERROR_KINDS.permission);
  assert.equal(info.retryable, false);
});

test("a missing membership is a not-found, not a crash", () => {
  const info = apiErrorInfo({ status: 404, message: "No linked membership found" });
  assert.equal(info.kind, ERROR_KINDS.notFound);
});

test("server errors are retryable", () => {
  const info = apiErrorInfo({ status: 503 });
  assert.equal(info.kind, ERROR_KINDS.server);
  assert.equal(info.retryable, true);
});

test("unknown failures still produce a message", () => {
  const info = apiErrorInfo({});
  assert.equal(info.kind, ERROR_KINDS.unknown);
  assert.ok(info.message.length > 0);
});