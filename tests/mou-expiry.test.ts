import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expiryFromPeriod } from "../scripts/mou-workbook/plan";

describe("expiry calculated from signing date and period", () => {
  it("ends the day before the N-th anniversary", () => {
    assert.equal(expiryFromPeriod("2025-10-20", 3), "2028-10-19");
    assert.equal(expiryFromPeriod("2024-04-01", 5), "2029-03-31");
    assert.equal(expiryFromPeriod("2024-01-01", 2), "2025-12-31");
  });

  it("handles a 29 February signing", () => {
    assert.equal(expiryFromPeriod("2024-02-29", 5), "2029-02-28");
    assert.equal(expiryFromPeriod("2024-02-29", 4), "2028-02-28");
  });
});
