import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchesQsRankingBand,
  qs2026ForInstitution,
  qsRankSortKey,
  qsRankingBand,
  qsRankings2026ByInstitutionId,
} from "@/lib/official/qs-rankings-2026";

describe("QS World University Rankings 2026", () => {
  it("covers reviewed partner matches with published ranks only", () => {
    assert.ok(Object.keys(qsRankings2026ByInstitutionId).length >= 50);
    assert.deepEqual(qs2026ForInstitution("ofc-the-university-of-melbourne"), {
      rank: "19",
      qsName: "The University of Melbourne",
    });
    assert.deepEqual(qs2026ForInstitution("ofc-universiti-malaya"), {
      rank: "58",
      qsName: "Universiti Malaya (UM)",
    });
    assert.equal(qs2026ForInstitution("ofc-warsaw-management-university"), null);
    assert.equal(qs2026ForInstitution("ofc-quocent-sdn-bhd"), null);
  });

  it("sorts exact ranks and bands by the published low end", () => {
    assert.equal(qsRankSortKey("19"), 19);
    assert.equal(qsRankSortKey("801-850"), 801);
    assert.equal(qsRankSortKey("1401+"), 1401);
    assert.ok(qsRankSortKey(null) > qsRankSortKey("1401"));
  });

  it("maps ranks into filter bands", () => {
    assert.equal(qsRankingBand("58"), "top-100");
    assert.equal(qsRankingBand("251"), "101-500");
    assert.equal(qsRankingBand("711-720"), "501-1000");
    assert.equal(qsRankingBand("1201-1400"), "1001-plus");
    assert.equal(qsRankingBand(null), null);
    assert.equal(matchesQsRankingBand("58", "top-100"), true);
    assert.equal(matchesQsRankingBand("58", "ranked"), true);
    assert.equal(matchesQsRankingBand(null, "unranked"), true);
    assert.equal(matchesQsRankingBand("58", "unranked"), false);
  });
});
