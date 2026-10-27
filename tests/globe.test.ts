import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { retireStaleAgreements } from "@/lib/internal/data/current";
import { canonicalDataset, staticDataset } from "@/lib/internal/data/dataset";
import { registerGlobe } from "@/lib/internal/data/globe";
import { registerScope, withRegisterSnapshot } from "@/lib/internal/data/register-snapshot";

const today = "2026-10-27";

describe("registerGlobe", () => {
  const globe = registerGlobe(today);
  const { data } = retireStaleAgreements(
    canonicalDataset(withRegisterSnapshot(staticDataset(false))),
    today,
    registerScope,
  );
  const withMou = new Set(data.agreements.map((agreement) => agreement.institutionId));
  const listed = data.institutions.filter((institution) => withMou.has(institution.id));

  it("counts every university with a current MoU, once, in its country", () => {
    assert.equal(globe.totals.universities, listed.length);
    assert.equal(globe.totals.countries, new Set(listed.map((institution) => institution.countryId)).size);
    assert.equal(globe.markers.length, globe.totals.countries);
  });

  it("places one point per country with distinct positions and no names", () => {
    const positions = new Set(globe.markers.map((marker) => `${marker.lat},${marker.lon}`));
    assert.equal(positions.size, globe.markers.length);
    for (const marker of globe.markers) {
      assert.equal(marker.precision, "country");
      assert.ok(!("institutionIds" in marker));
      assert.ok(marker.agreementRows >= (marker.precision === "country" ? marker.institutions : 1));
    }
  });
});
