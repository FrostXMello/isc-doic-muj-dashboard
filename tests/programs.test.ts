import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isProgramType, programTypes } from "@/lib/internal/data/programs";
import {
  officialAvailability,
  officialOpportunities,
  officialPrograms,
} from "@/lib/official/internationalization";
import { programAudience } from "@/lib/internal/status";

describe("programme hierarchy", () => {
  it("classifies every programme type, with only academic visits for faculty", () => {
    assert.deepEqual(Object.keys(programAudience).sort(), [...programTypes].sort());
    assert.deepEqual(
      programTypes.filter((type) => programAudience[type] === "faculty"),
      ["academic-visits"],
    );
  });

  it("agrees with the audience each official programme page states", () => {
    for (const program of officialPrograms) {
      if (!program.generalAudience) continue;
      const faculty = /faculty members/i.test(program.generalAudience);
      assert.equal(programAudience[program.id] === "faculty", faculty, program.id);
    }
  });

  it("files every official opportunity and offering under an existing programme", () => {
    const ids = new Set(officialPrograms.map((program) => program.id));
    for (const row of [...officialOpportunities, ...officialAvailability]) {
      assert.ok(ids.has(row.programId), `${row.id} → ${row.programId}`);
    }
  });

  it("keeps programme and offering ids apart so /internal/programs/[id] is unambiguous", () => {
    for (const row of officialAvailability) assert.equal(isProgramType(row.id), false, row.id);
    for (const type of programTypes) assert.equal(isProgramType(type), true);
  });
});
