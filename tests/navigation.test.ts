import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, it } from "node:test";
import { findNavItem, internalBreadcrumbs, internalNav, isNavItemActive, sectionTabs } from "@/lib/internal-nav";
import { type RowNode, shouldOpenRow } from "@/lib/internal/row-click";

const appDir = join(process.cwd(), "src", "app");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Route patterns under /internal from page.tsx / route.ts files, excluding the catch-all 404. */
const internalRoutes = walk(join(appDir, "internal"))
  .filter((file) => /[/\\](page\.tsx|route\.ts)$/.test(file) && !file.includes("[..."))
  .map((file) => {
    const segments = relative(appDir, file).split(sep).slice(0, -1);
    const pattern = segments.map((s) => (s.startsWith("[") ? "[^/]+" : s.replace(/[.*+?^${}()|\\]/g, "\\$&")));
    return new RegExp(`^/${pattern.join("/")}$`);
  });

const resolves = (path: string) => internalRoutes.some((route) => route.test(path));

describe("internal route mappings", () => {
  it("every sidebar item and section page points at a real page", () => {
    for (const item of internalNav) {
      assert.ok(resolves(item.href), `${item.label} → ${item.href}`);
      for (const page of item.pages ?? []) assert.ok(resolves(page.href), `${item.label} › ${page.label}`);
    }
  });

  it("keeps five sections, with Opportunities under Programs and Reports under Documents", () => {
    assert.deepEqual(
      internalNav.map((item) => item.label),
      ["Dashboard", "Universities & MoUs", "Programs", "Documents", "Settings"],
    );
    assert.deepEqual(sectionTabs("/internal/programs").map((t) => t.href), ["/internal/programs", "/internal/opportunities"]);
    assert.deepEqual(sectionTabs("/internal/documents").map((t) => t.href), ["/internal/documents", "/internal/reports"]);
    assert.deepEqual(sectionTabs("/internal"), []);
    assert.deepEqual(sectionTabs("/internal/universities"), []);
  });

  it("no list page belongs to two sections", () => {
    const pages = internalNav.flatMap((item) => (item.pages ?? []).map((page) => page.href));
    assert.equal(new Set(pages).size, pages.length);
  });

  it("sidebar items have unique destinations and labels", () => {
    assert.equal(new Set(internalNav.map((item) => item.href)).size, internalNav.length);
    assert.equal(new Set(internalNav.map((item) => item.label)).size, internalNav.length);
  });

  it("every /internal link in the source resolves to a route", () => {
    const sources = walk(join(process.cwd(), "src")).filter((file) => /\.(tsx?|mts)$/.test(file));
    const broken: string[] = [];
    for (const file of sources) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/["`](\/internal(?:\/[^"`?#\s]*)?)[?#"`]/g)) {
        // Template params like ${row.id} stand for one dynamic segment.
        if (match[1].includes("/:")) continue; // proxy matcher patterns, not links
        const path = match[1].replace(/\$\{[^}]+\}/g, "x").replace(/\/$/, "") || "/internal";
        if (!resolves(path)) broken.push(`${relative(process.cwd(), file)}: ${match[1]}`);
      }
    }
    assert.deepEqual(broken, []);
  });

  it("highlights exactly one section per page, and Dashboard only on /internal", () => {
    const cases: Record<string, string | undefined> = {
      "/internal": "Dashboard",
      "/internal/universities": "Universities & MoUs",
      "/internal/universities/ofc-x/agreements/mou-1/edit": "Universities & MoUs",
      "/internal/programs": "Programs",
      "/internal/programs/abc": "Programs",
      "/internal/opportunities": "Programs",
      "/internal/opportunities/o1": "Programs",
      "/internal/documents/d1": "Documents",
      "/internal/reports": "Documents",
      "/internal/activities": "Dashboard",
      "/internal/activities/a1": "Dashboard",
      "/internal/settings": "Settings",
      "/internal/activitiesx": undefined,
      "/internal/universitiesx": undefined,
      "/internal/unknown": undefined,
    };
    for (const [path, label] of Object.entries(cases)) {
      assert.equal(findNavItem(path)?.label, label, path);
      const active = internalNav.filter((item) => isNavItemActive(path, item.href));
      assert.equal(active.length, label ? 1 : 0, path);
    }
  });
});

describe("internal breadcrumbs", () => {
  const labels = (path: string) => internalBreadcrumbs(path).map((c) => `${c.label}=${c.href}`);

  it("maps sections, records and record actions to their own pages", () => {
    assert.deepEqual(labels("/internal"), ["Portal=/internal"]);
    assert.deepEqual(labels("/internal/universities"), ["Portal=/internal", "Universities & MoUs=/internal/universities"]);
    assert.deepEqual(labels("/internal/programs/p1"), [
      "Portal=/internal",
      "Programs=/internal/programs",
      "Details=/internal/programs/p1",
    ]);
    assert.deepEqual(labels("/internal/opportunities/o1"), [
      "Portal=/internal",
      "Programs=/internal/programs",
      "Opportunities=/internal/opportunities",
      "Details=/internal/opportunities/o1",
    ]);
    assert.deepEqual(labels("/internal/reports"), [
      "Portal=/internal",
      "Documents=/internal/documents",
      "Reports=/internal/reports",
    ]);
    assert.deepEqual(labels("/internal/documents"), ["Portal=/internal", "Documents=/internal/documents"]);
    assert.deepEqual(labels("/internal/activities/a1"), [
      "Portal=/internal",
      "Activities=/internal/activities",
      "Details=/internal/activities/a1",
    ]);
    assert.deepEqual(labels("/internal/universities/new").at(-1), "New=/internal/universities/new");
    assert.deepEqual(labels("/internal/universities/u1/edit").slice(2), [
      "Details=/internal/universities/u1",
      "Edit=/internal/universities/u1/edit",
    ]);
    assert.deepEqual(labels("/internal/universities/u1/agreements/new").slice(2), [
      "Details=/internal/universities/u1",
      "New MoU=/internal/universities/u1/agreements/new",
    ]);
    assert.deepEqual(labels("/internal/universities/u1/agreements/mou-1/edit").slice(2), [
      "Details=/internal/universities/u1",
      "Edit MoU=/internal/universities/u1/agreements/mou-1/edit",
    ]);
  });

  it("every breadcrumb link resolves to a route", () => {
    for (const path of [
      "/internal/universities/u1/agreements/mou-1/edit",
      "/internal/documents/d1",
      "/internal/opportunities/o1",
      "/internal/activities/a1",
    ]) {
      for (const crumb of internalBreadcrumbs(path)) assert.ok(resolves(crumb.href), crumb.href);
    }
  });
});

describe("clickable table rows", () => {
  class FakeNode implements RowNode<FakeNode> {
    constructor(
      readonly matches: boolean,
      readonly parent: FakeNode | null = null,
    ) {}
    closest(): FakeNode | null {
      return this.matches ? this : (this.parent?.closest() ?? null);
    }
    contains(other: FakeNode) {
      for (let node: FakeNode | null = other; node; node = node.parent) if (node === this) return true;
      return false;
    }
  }
  const details = new FakeNode(true);
  const row = new FakeNode(false, details);
  const cell = new FakeNode(false, row);
  const button = new FakeNode(true, cell);
  const base = { button: 0, defaultPrevented: false, modifier: false, row, selection: "" };

  it("opens the row's record from empty space", () => {
    assert.equal(shouldOpenRow({ ...base, target: cell }), "navigate");
    assert.equal(shouldOpenRow({ ...base, target: cell, modifier: true }), "new-tab");
  });

  it("leaves links, buttons and dialogs inside the row alone", () => {
    assert.equal(shouldOpenRow({ ...base, target: button }), "ignore");
  });

  it("ignores interactive ancestors outside the row", () => {
    assert.equal(shouldOpenRow({ ...base, target: new FakeNode(false, row) }), "navigate");
  });

  it("ignores secondary buttons, handled events and text selection", () => {
    assert.equal(shouldOpenRow({ ...base, target: cell, button: 1 }), "ignore");
    assert.equal(shouldOpenRow({ ...base, target: cell, defaultPrevented: true }), "ignore");
    assert.equal(shouldOpenRow({ ...base, target: cell, selection: "Ajman" }), "ignore");
  });
});
