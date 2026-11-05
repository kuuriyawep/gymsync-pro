import test from "node:test";
import assert from "node:assert/strict";
import { normalizePersonName, normalizePhoneInput, validateMemberLink } from "../src/lib/linkVerification.js";

test("a valid name and phone pass", () => {
  const result = validateMemberLink({ phone: "+252 61 234 5678", fullName: "  Ahmed   Ali " });
  assert.equal(result.ok, true);
  assert.equal(result.fullName, "Ahmed Ali");
  assert.equal(result.phone, "+252612345678");
});

test("whitespace-only input is rejected", () => {
  const result = validateMemberLink({ phone: "   ", fullName: "   " });
  assert.equal(result.ok, false);
  assert.ok(result.errors.fullName);
  assert.ok(result.errors.phone);
});

test("a phone without a country code is rejected", () => {
  const result = validateMemberLink({ phone: "612345678", fullName: "Ahmed Ali" });
  assert.equal(result.ok, false);
  assert.match(result.errors.phone, /country/i);
});

test("a too-short phone number is rejected", () => {
  const result = validateMemberLink({ phone: "+252 61", fullName: "Ahmed Ali" });
  assert.equal(result.ok, false);
  assert.match(result.errors.phone, /short/i);
});

test("a numeric-only name is rejected", () => {
  const result = validateMemberLink({ phone: "+252612345678", fullName: "12345" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.fullName);
});

test("normalizers are stable on empty values", () => {
  assert.equal(normalizePersonName(null), "");
  assert.equal(normalizePhoneInput(null), "");
  assert.equal(normalizePhoneInput("(061) 234-5678"), "0612345678");
});