import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTrackingCode } from "../src/features/tracking/trackingCode.js";
import { ApiError } from "../src/api/http.js";

test("short codes normalize; legacy codes preserve exact case", () => {
  for (const code of ["K7MP-4X9R", "k7mp4x9r", " k7mp-4x9r "]) assert.equal(normalizeTrackingCode(code), "K7MP-4X9R");
  const legacy = "aB_-".repeat(10) + "xYz";
  assert.equal(normalizeTrackingCode(legacy), legacy);
  for (const code of ["", "1234-5678", "K7MI-4X9R", "K7MP--4X9R", "x".repeat(42)]) assert.equal(normalizeTrackingCode(code), null);
});
test("Retry-After supports seconds, dates and tracking body fallback", () => {
  assert.equal(new ApiError(429, { retryAfterSeconds: 60 }, "12").retryAfterSeconds, 12);
  assert.equal(new ApiError(429, { retryAfterSeconds: 7 }, "invalid").retryAfterSeconds, 7);
  assert.equal(new ApiError(429, { retryAfterSeconds: 9 }).retryAfterSeconds, 9);
  const future = new Date(Date.now() + 30000).toUTCString();
  assert.ok(new ApiError(429, {}, future).retryAfterSeconds >= 29);
});
