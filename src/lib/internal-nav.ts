/**
 * Navigation definitions for the Internal Portal workspace.
 *
 * Each sidebar section maps to a route under /internal and an icon from
 * lucide-react. A section can own further pages (`pages`, e.g. Activities
 * under Dashboard) or be one list page with internal tabs (`tabs`), selected
 * by the `tab` query parameter. A tab's `recordBase` is where its detail
 * pages live, so /internal/opportunities/x still belongs to Programs ›
 * Opportunities. The `role` field is a placeholder for future RBAC gating —
 * it is not enforced in this stage.
 *
 * Pure module (no React), so route mappings can be unit-tested.
 */

export type InternalNavPage = { href: string; label: string };

export type InternalNavTab = { value: string; label: string; recordBase: string };

export type InternalNavItem = {
  href: string;
  label: string;
  icon: string;
  /** Future: minimum role required to see this item. */
  role: "viewer" | "editor" | "admin";
  description: string;
  /** Separate pages that belong to the section. */
  pages?: readonly InternalNavPage[];
  /** Views of the section's own list page; the first is the default. */
  tabs?: readonly InternalNavTab[];
};

export const internalNav: readonly InternalNavItem[] = [
  {
    href: "/internal",
    label: "Dashboard",
    icon: "LayoutDashboard",
    role: "viewer",
    description: "Overview of collaboration metrics, upcoming and recent activities.",
    pages: [{ href: "/internal/activities", label: "Activities" }],
  },
  {
    href: "/internal/universities",
    label: "Universities & MoUs",
    icon: "GraduationCap",
    role: "viewer",
    description: "Partner universities, each with its MoUs and agreements, with provenance.",
  },
  {
    href: "/internal/programs",
    label: "Programs & Opportunities",
    icon: "BookOpen",
    role: "editor",
    description: "Programmes for students and faculty, their offerings, and the opportunities (application calls) under each.",
    tabs: [
      { value: "programs", label: "Programs", recordBase: "/internal/programs" },
      { value: "opportunities", label: "Opportunities", recordBase: "/internal/opportunities" },
    ],
  },
  {
    href: "/internal/documents",
    label: "Documents & Reports",
    icon: "FolderOpen",
    role: "editor",
    description: "Official documents, with operational reports as a subsection.",
    tabs: [
      { value: "documents", label: "Documents", recordBase: "/internal/documents" },
      { value: "reports", label: "Reports", recordBase: "/internal/reports" },
    ],
  },
  {
    href: "/internal/settings",
    label: "Settings",
    icon: "Settings",
    role: "admin",
    description: "Portal configuration, users, and system preferences.",
  },
] as const;

const underPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/** The separate section page a path belongs to, e.g. /internal/activities/x → Activities. */
export function findNavPage(pathname: string, item: InternalNavItem) {
  return item.pages?.find((page) => page.href !== "/internal" && underPath(pathname, page.href));
}

/** Tabs of a section's list page; empty when it has none. */
export function sectionTabs(sectionHref: string): readonly InternalNavTab[] {
  return internalNav.find((item) => item.href === sectionHref)?.tabs ?? [];
}

/** The selected tab of a section's list page; unknown or missing values fall back to the first tab. */
export function resolveTab(sectionHref: string, value: string | null | undefined) {
  const tabs = sectionTabs(sectionHref);
  return tabs.find((tab) => tab.value === value) ?? tabs[0];
}

/** URL of a tab. The default tab is the bare section URL, so there is one canonical address per view. */
export function tabHref(sectionHref: string, value: string, keep?: URLSearchParams) {
  const params = new URLSearchParams(keep);
  params.delete("tab");
  if (value !== sectionTabs(sectionHref)[0]?.value) params.set("tab", value);
  const qs = params.toString();
  return qs ? `${sectionHref}?${qs}` : sectionHref;
}

/**
 * The tab a location belongs to: on the list page it is the `tab` parameter,
 * on a detail page the tab whose records live under that path.
 */
export function findNavTab(pathname: string, item: InternalNavItem, tabParam?: string | null) {
  if (!item.tabs) return undefined;
  if (pathname === item.href) return resolveTab(item.href, tabParam);
  return item.tabs.find((tab) => underPath(pathname, tab.recordBase));
}

/**
 * Whether a path belongs to a section. Dashboard owns /internal itself (not
 * every /internal/* page) plus its own pages such as Activities.
 */
export function isNavItemActive(pathname: string, href: string) {
  const item = internalNav.find((entry) => entry.href === href);
  if (item && (findNavPage(pathname, item) || findNavTab(pathname, item))) return true;
  if (href === "/internal") return pathname === "/internal";
  return underPath(pathname, href);
}

export function findNavItem(pathname: string) {
  return internalNav.find((item) => isNavItemActive(pathname, item.href));
}

/** Title for the current location: the non-default tab or section page, else the section. */
export function navTitle(pathname: string, tabParam?: string | null) {
  const section = findNavItem(pathname);
  if (!section) return "Portal";
  const tab = findNavTab(pathname, section, tabParam);
  if (tab && tab !== section.tabs?.[0]) return tab.label;
  return findNavPage(pathname, section)?.label ?? section.label;
}

export type Breadcrumb = { label: string; href: string };

function recordActionLabel(action: string) {
  if (action === "edit") return "Edit";
  if (action === "agreements/new") return "New MoU";
  if (/^agreements\/[^/]+\/edit$/.test(action)) return "Edit MoU";
  return null;
}

/**
 * Portal › Section › Tab or page › Record › Action. Each crumb links to a real
 * page: a tab crumb to its view of the section list, the record crumb to the
 * record itself, never to a sub-route such as /edit.
 */
export function internalBreadcrumbs(pathname: string, tabParam?: string | null): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ label: "Portal", href: "/internal" }];
  const section = findNavItem(pathname);
  if (!section) return crumbs;
  if (section.href !== "/internal") crumbs.push({ label: section.label, href: section.href });

  const page = findNavPage(pathname, section);
  const tab = findNavTab(pathname, section, tabParam);
  if (page) crumbs.push({ label: page.label, href: page.href });
  if (tab && tab !== section.tabs?.[0]) {
    crumbs.push({ label: tab.label, href: tabHref(section.href, tab.value) });
  }
  const base = tab?.recordBase ?? page?.href ?? (section.href === "/internal" ? null : section.href);
  if (!base || pathname === section.href) return crumbs;

  const [record, ...action] = pathname.slice(base.length).split("/").filter(Boolean);
  if (!record) return crumbs;
  if (record === "new") return [...crumbs, { label: "New", href: pathname }];

  crumbs.push({ label: "Details", href: `${base}/${record}` });
  const label = action.length > 0 ? recordActionLabel(action.join("/")) : null;
  if (label) crumbs.push({ label, href: pathname });
  return crumbs;
}
