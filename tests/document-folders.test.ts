import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countryFolders,
  documentCountry,
  findFolder,
  folderCounts,
  inCountry,
  NO_COUNTRY,
} from "@/lib/internal/document-folders";
import type { DocumentLinkView } from "@/lib/internal/types";

const link = (country: string | null): DocumentLinkView => ({
  id: `l-${country}`,
  kind: "institution",
  label: "Uni",
  href: "/",
  country,
});

describe("document folders", () => {
  it("lists only non-empty folders, in display order", () => {
    const counts = folderCounts([{ type: "policy" }, { type: "agreement" }, { type: "agreement" }]);
    assert.deepEqual(
      counts.map((f) => [f.type, f.count]),
      [
        ["agreement", 2],
        ["policy", 1],
      ],
    );
  });

  it("finds folders by type only", () => {
    assert.equal(findFolder("newsletter")?.label, "Newsletters");
    assert.equal(findFolder("nope"), undefined);
    assert.equal(findFolder(undefined), undefined);
  });

  it("groups by the first linked country, with unassigned last", () => {
    const docs = [{ links: [link("Russia")] }, { links: [] }, { links: [link(null), link("Germany")] }, { links: [link("Russia")] }];
    assert.equal(documentCountry(docs[2]), "Germany");
    assert.deepEqual(countryFolders(docs), [
      { country: "Germany", count: 1 },
      { country: "Russia", count: 2 },
      { country: NO_COUNTRY, count: 1 },
    ]);
    assert.ok(inCountry(docs[1], NO_COUNTRY));
    assert.ok(!inCountry(docs[0], "Germany"));
  });
});
