import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  blobPath,
  buildFolderTree,
  cleanFolder,
  cleanName,
  type EventFile,
  folderFromRelativePath,
  folderPaths,
  formatBytes,
  isBlobPath,
  isClutter,
  uniqueName,
} from "@/lib/internal/event-files";

const file = (folder: string, name: string, sizeBytes = 10): EventFile => ({
  id: `${folder}/${name}`,
  folder,
  name,
  sizeBytes,
  mimeType: null,
  updatedAt: "2026-10-28T00:00:00Z",
});

describe("event file paths", () => {
  it("normalises folders and rejects unusable parts", () => {
    assert.equal(cleanFolder(" Certificates / Scanned/ "), "Certificates/Scanned");
    assert.equal(cleanFolder(""), "");
    assert.equal(cleanFolder("a\\b"), "a/b");
    assert.equal(cleanFolder("a/../b"), null);
    assert.equal(cleanFolder("x".repeat(401)), null);
  });

  it("accepts ordinary names and rejects slashes and dots", () => {
    assert.equal(cleanName("  Notesheet.pdf "), "Notesheet.pdf");
    assert.equal(cleanName("a/b.pdf"), null);
    assert.equal(cleanName(".."), null);
    assert.equal(cleanName("   "), null);
  });

  it("places folder uploads under the chosen target", () => {
    assert.equal(folderFromRelativePath("ISSMUJ/Photos/day1.jpg", "2026"), "2026/ISSMUJ/Photos");
    assert.equal(folderFromRelativePath("report.pdf", ""), "");
  });

  it("matches the storage path rule", () => {
    const sha = "a".repeat(64);
    assert.equal(blobPath(sha), `blobs/${sha}`);
    assert.ok(isBlobPath(blobPath(sha)));
    assert.ok(!isBlobPath("blobs/../x"));
  });

  it("skips system clutter", () => {
    assert.ok(isClutter(".DS_Store"));
    assert.ok(isClutter("~$Budget.xlsx"));
    assert.ok(isClutter("._photo.jpg"));
    assert.ok(!isClutter("Budget.xlsx"));
  });

  it("suffixes taken names", () => {
    assert.equal(uniqueName("Report.pdf", new Set()), "Report.pdf");
    assert.equal(uniqueName("Report.pdf", new Set(["report.pdf"])), "Report (2).pdf");
    assert.equal(uniqueName("Report.pdf", new Set(["report.pdf", "report (2).pdf"])), "Report (3).pdf");
    assert.equal(uniqueName("README", new Set(["readme"])), "README (2)");
  });

  it("formats sizes", () => {
    assert.equal(formatBytes(512), "512 B");
    assert.equal(formatBytes(2048), "2 KB");
    assert.equal(formatBytes(5 * 1024 * 1024), "5.0 MB");
  });
});

describe("buildFolderTree", () => {
  const tree = buildFolderTree([
    file("", "Notesheet.pdf", 5),
    file("Photos/Day 10", "b.jpg", 1),
    file("Photos/Day 2", "a.jpg", 2),
    file("Certificates", "c.pdf", 3),
  ]);

  it("counts files and bytes at every level", () => {
    assert.equal(tree.count, 4);
    assert.equal(tree.bytes, 11);
    const photos = tree.folders.find((folder) => folder.name === "Photos");
    assert.equal(photos?.count, 2);
    assert.equal(photos?.bytes, 3);
  });

  it("orders folders naturally and keeps top-level files", () => {
    assert.deepEqual(
      tree.folders.map((folder) => folder.name),
      ["Certificates", "Photos"],
    );
    assert.deepEqual(
      tree.folders[1].folders.map((folder) => folder.name),
      ["Day 2", "Day 10"],
    );
    assert.deepEqual(
      tree.files.map((entry) => entry.name),
      ["Notesheet.pdf"],
    );
    assert.deepEqual(folderPaths(tree), ["Certificates", "Photos", "Photos/Day 2", "Photos/Day 10"]);
  });
});
