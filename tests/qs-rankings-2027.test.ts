import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { legacyDirectoryInstitutions } from "@/lib/internal/data/seed/institutions";
import { officialInstitutionRecords } from "@/lib/official/records";
import {
  QS_RANKINGS_YEAR,
  matchesQsRankingBand,
  qs2027ForInstitution,
  qsRankSortKey,
  qsRankingBand,
  qsRankingBands,
  qsRankings2027ByInstitutionId,
} from "@/lib/official/qs-rankings-2027";

describe("QS World University Rankings 2027 (published 18 June 2026)", () => {
  it("covers reviewed partner matches with published ranks only", () => {
    assert.equal(QS_RANKINGS_YEAR, 2027);
    assert.equal(Object.keys(qsRankings2027ByInstitutionId).length, 71);
    assert.equal(qs2027ForInstitution("wb-kasetsart-university")?.rank, "721-730");
    assert.equal(qs2027ForInstitution("wb-virginia-commonwealth-university-usa")?.rank, "951-1000");
    // IC-IMPACTS is a research network hosted by UBC, not UBC itself.
    assert.equal(qs2027ForInstitution("wb-ic-impacts-university-of-british-columbia"), null);
    assert.deepEqual(qs2027ForInstitution("ofc-the-university-of-melbourne"), {
      rank: "22",
      qsName: "The University of Melbourne",
    });
    assert.deepEqual(qs2027ForInstitution("ofc-universiti-malaya"), {
      rank: "56",
      qsName: "Universiti Malaya (UM)",
    });
    assert.deepEqual(qs2027ForInstitution("dir-national-university-of-singapore"), {
      rank: "10",
      qsName: "National University of Singapore (NUS)",
    });
    assert.deepEqual(qs2027ForInstitution("dir-lmu-munich"), {
      rank: "61",
      qsName: "Ludwig-Maximilians-Universität München",
    });
    assert.deepEqual(qs2027ForInstitution("ofc-university-of-south-wales"), {
      rank: "1201-1400",
      qsName: "University of South Wales",
    });
    assert.deepEqual(qs2027ForInstitution("ofc-al-farabi-kazakh-national-university"), {
      rank: "177",
      qsName: "Farabi University (former Al - Farabi Kazakh National University)",
    });
    assert.equal(qs2027ForInstitution("ofc-warsaw-management-university"), null);
    assert.equal(qs2027ForInstitution("ofc-quocent-sdn-bhd"), null);
    // A branch campus is not given its parent university's rank.
    assert.equal(qs2027ForInstitution("ofc-curtin-university-malaysia"), null);
    assert.equal(qs2027ForInstitution("ofc-curtin-university")?.rank, "189");
    assert.equal(qs2027ForInstitution("dir-university-of-wollongong-in-dubai"), null);
    assert.equal(qs2027ForInstitution("dir-university-of-massachusetts"), null);
    // IULM (Milan) is not Ulm University.
    assert.equal(qs2027ForInstitution("ofc-iulm-university"), null);
    // Newcastle, Australia is not Newcastle University (UK).
    assert.equal(qs2027ForInstitution("dir-university-of-newcastle")?.rank, "244");
  });

  it("sorts exact ranks and bands by the published low end", () => {
    assert.equal(qsRankSortKey("22"), 22);
    assert.equal(qsRankSortKey("126"), 126);
    assert.equal(qsRankSortKey("801-850"), 801);
    assert.equal(qsRankSortKey("1401+"), 1401);
    assert.ok(qsRankSortKey(null) > qsRankSortKey("1401"));
    for (const entry of Object.values(qsRankings2027ByInstitutionId)) {
      assert.equal(entry.rank.startsWith("="), false, entry.rank);
      assert.ok(Number.isFinite(qsRankSortKey(entry.rank)), entry.rank);
    }
  });

  it("maps ranks into filter bands", () => {
    assert.equal(qsRankingBand("56"), "top-100");
    assert.equal(qsRankingBand("488"), "101-500");
    assert.equal(qsRankingBand("801-850"), "501-1000");
    assert.equal(qsRankingBand("1201-1400"), "1001-plus");
    assert.equal(qsRankingBand("1401+"), "1001-plus");
    assert.equal(qsRankingBand(null), null);
    assert.equal(matchesQsRankingBand("56", "top-100"), true);
    assert.equal(matchesQsRankingBand("56", "101-500"), false);
    assert.equal(matchesQsRankingBand(null, "unranked"), true);
    assert.equal(matchesQsRankingBand("56", "unranked"), false);
    assert.deepEqual(qsRankingBands, ["top-100", "101-500", "501-1000", "1001-plus", "unranked"]);
  });

  it("only ranks institutions on the list, and the MoUs filters stay in one order", () => {
    const ids = new Set([
      ...officialInstitutionRecords.map((row) => row.id),
      ...legacyDirectoryInstitutions.map((row) => row.id),
    ]);
    // wb- ids are universities the MoU register import adds (scripts/mou-workbook/plan.ts).
    for (const id of Object.keys(qsRankings2027ByInstitutionId)) assert.ok(ids.has(id) || id.startsWith("wb-"), id);

    const page = readFileSync(new URL("../src/app/internal/universities/page.tsx", import.meta.url), "utf8");
    const bar = page.slice(page.indexOf("selects={["), page.indexOf("/>", page.indexOf("selects={[")));
    assert.deepEqual(
      [...bar.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]),
      ["country", "faculty", "department", "expiry", "mouType", "qs", "sort"],
    );
    assert.equal(bar.includes('name: "region"'), false);
    assert.equal(bar.includes('name: "source"'), false);
    assert.equal(bar.includes('name: "status"'), false);
    assert.equal(page.includes("QS 2027"), true);
    assert.equal(page.includes("QS 2026"), false);
  });
});
