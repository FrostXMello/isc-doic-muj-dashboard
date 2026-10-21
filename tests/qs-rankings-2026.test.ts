import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { legacyDirectoryInstitutions } from "@/lib/internal/data/seed/institutions";
import { officialInstitutionRecords } from "@/lib/official/records";
import {
  matchesQsRankingBand,
  qs2026ForInstitution,
  qsRankSortKey,
  qsRankingBand,
  qsRankingBands,
  qsRankings2026ByInstitutionId,
} from "@/lib/official/qs-rankings-2026";

describe("QS World University Rankings 2026", () => {
  it("covers reviewed partner matches with published ranks only", () => {
    assert.ok(Object.keys(qsRankings2026ByInstitutionId).length >= 60);
    assert.deepEqual(qs2026ForInstitution("ofc-the-university-of-melbourne"), {
      rank: "19",
      qsName: "The University of Melbourne",
    });
    assert.deepEqual(qs2026ForInstitution("ofc-universiti-malaya"), {
      rank: "58",
      qsName: "Universiti Malaya (UM)",
    });
    assert.deepEqual(qs2026ForInstitution("dir-national-university-of-singapore"), {
      rank: "8",
      qsName: "National University of Singapore (NUS)",
    });
    assert.deepEqual(qs2026ForInstitution("dir-lmu-munich"), {
      rank: "58",
      qsName: "Ludwig-Maximilians-Universität München",
    });
    assert.equal(qs2026ForInstitution("ofc-warsaw-management-university"), null);
    assert.equal(qs2026ForInstitution("ofc-quocent-sdn-bhd"), null);
    // A branch campus is not given its parent university's rank.
    assert.equal(qs2026ForInstitution("ofc-curtin-university-malaysia"), null);
    assert.equal(qs2026ForInstitution("dir-university-of-wollongong-in-dubai"), null);
    assert.equal(qs2026ForInstitution("dir-university-of-massachusetts"), null);
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
    assert.equal(matchesQsRankingBand("58", "101-500"), false);
    assert.equal(matchesQsRankingBand(null, "unranked"), true);
    assert.equal(matchesQsRankingBand("58", "unranked"), false);
    assert.deepEqual(qsRankingBands, ["top-100", "101-500", "501-1000", "1001-plus", "unranked"]);
  });

  it("only ranks institutions on the list, and the MoUs filters stay in one order", () => {
    const ids = new Set([
      ...officialInstitutionRecords.map((row) => row.id),
      ...legacyDirectoryInstitutions.map((row) => row.id),
    ]);
    for (const id of Object.keys(qsRankings2026ByInstitutionId)) assert.ok(ids.has(id), id);

    const page = readFileSync(new URL("../src/app/internal/universities/page.tsx", import.meta.url), "utf8");
    const bar = page.slice(page.indexOf("selects={["), page.indexOf("/>", page.indexOf("selects={[")));
    assert.deepEqual(
      [...bar.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]),
      ["country", "mouStatus", "mouType", "qs", "coverage", "sort"],
    );
    assert.equal(bar.includes('name: "region"'), false);
    assert.equal(bar.includes('name: "source"'), false);
    assert.equal(bar.includes('name: "status"'), false);
  });
});
