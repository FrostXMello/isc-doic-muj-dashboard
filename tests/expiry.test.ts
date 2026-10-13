import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expiryConflict, expirySortKey, summarizeExpiry, type ExpiryAgreement } from "@/lib/internal/expiry";
import { daysBetween } from "@/lib/internal/dates";
import { deriveAgreementStatus } from "@/lib/internal/status";
import type { Agreement } from "@/lib/internal/types";

const TODAY = "2026-10-13";

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** A signed agreement ending `days` from today, with its derived status, as the views compute it. */
function signed(id: string, endDate: string | null, extra: Partial<ExpiryAgreement> = {}): ExpiryAgreement {
  const agreement = { recordStatus: "signed", startDate: "2020-01-01", endDate } as Agreement;
  const status = deriveAgreementStatus(agreement, TODAY);
  const tracks = status === "active" || status === "expiring-soon" || status === "expired";
  return { id, status, endDate, daysToExpiry: tracks && endDate ? daysBetween(TODAY, endDate) : null, ...extra };
}

describe("expiry summary", () => {
  it("treats an agreement ending today as expiring soon, not expired", () => {
    const summary = summarizeExpiry([signed("a", TODAY)]);
    assert.equal(summary.kind, "dated");
    assert.ok(summary.kind === "dated" && summary.status === "expiring-soon" && summary.days === 0);
  });

  it("flags exactly 90 days as expiring soon and 91 days as active", () => {
    const at90 = summarizeExpiry([signed("a", addDays(TODAY, 90))]);
    const at91 = summarizeExpiry([signed("a", addDays(TODAY, 91))]);
    assert.ok(at90.kind === "dated" && at90.status === "expiring-soon" && at90.tone === "warning");
    assert.ok(at91.kind === "dated" && at91.status === "active" && at91.tone === "positive");
  });

  it("shows a past end date as expired", () => {
    const summary = summarizeExpiry([signed("a", addDays(TODAY, -1))]);
    assert.ok(summary.kind === "dated" && summary.status === "expired" && summary.tone === "danger" && summary.days === -1);
  });

  it("prefers the nearest end date in force and counts the other agreements", () => {
    const summary = summarizeExpiry([
      signed("old", addDays(TODAY, -30)),
      signed("far", addDays(TODAY, 400)),
      signed("near", addDays(TODAY, 200)),
      signed("undated", null),
    ]);
    assert.ok(summary.kind === "dated");
    assert.equal(summary.kind === "dated" && summary.agreementId, "near");
    assert.equal(summary.others, 3);
  });

  it("falls back to the most recent past end date when nothing is in force", () => {
    const summary = summarizeExpiry([signed("older", addDays(TODAY, -900)), signed("recent", addDays(TODAY, -10))]);
    assert.ok(summary.kind === "dated" && summary.agreementId === "recent");
  });

  it("separates an active agreement without an end date from no record at all", () => {
    assert.equal(summarizeExpiry([signed("a", null)]).kind, "open-ended");
    assert.equal(summarizeExpiry([]).kind, "none");
    assert.equal(
      summarizeExpiry([{ id: "listed", status: "not-stated", endDate: null, daysToExpiry: null }]).kind,
      "none",
    );
  });

  it("never infers an expiry from an agreement without a stored end date", () => {
    const summary = summarizeExpiry([{ ...signed("a", null), recordedStatus: "Active", renewalYear: 2030 }]);
    assert.equal(summary.kind, "open-ended");
  });

  it("flags a renewal recorded after the end date instead of calling it settled", () => {
    const renewed = signed("a", "2025-06-30", { renewalYear: 2025 });
    const summary = summarizeExpiry([renewed]);
    assert.ok(summary.kind === "dated" && summary.status === "expired");
    assert.match(summary.kind === "dated" ? (summary.review ?? "") : "", /renewal in 2025/);
  });

  it("flags register status words that contradict the dates", () => {
    assert.match(expiryConflict(signed("a", addDays(TODAY, -5), { recordedStatus: "Active" })) ?? "", /Active/);
    assert.match(expiryConflict(signed("b", addDays(TODAY, 300), { recordedStatus: "Expired" })) ?? "", /Expired/);
    assert.equal(expiryConflict(signed("c", addDays(TODAY, 300), { recordedStatus: "Active" })), null);
    assert.equal(expiryConflict(signed("d", addDays(TODAY, -5), { recordedStatus: "Expired" })), null);
  });

  it("sorts soonest in force first, then recent past, then undated", () => {
    const keys = [
      summarizeExpiry([signed("x", null)]),
      summarizeExpiry([signed("x", addDays(TODAY, -3))]),
      summarizeExpiry([signed("x", addDays(TODAY, 30))]),
      summarizeExpiry([signed("x", addDays(TODAY, 5))]),
    ]
      .map(expirySortKey)
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    assert.deepEqual(keys, [
      [0, 5],
      [0, 30],
      [1, 3],
      [2, 0],
    ]);
  });
});
