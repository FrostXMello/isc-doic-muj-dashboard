/**
 * Navigation definitions for the Internal Portal workspace.
 *
 * Each sidebar section maps to a route under /internal and an icon from
 * lucide-react. A section can group several list pages (`pages`): they keep
 * their own URLs, so records, filters and bookmarks keep working, and are
 * shown as tabs inside the section. The `role` field is a placeholder for
 * future RBAC gating — it is not enforced in this stage.
 *
 * Pure module (no React), so route mappings can be unit-tested.
 */

export type InternalNavPage = { href: string; label: string };

export type InternalNavItem = {
  href: string;
  label: string;
  icon: string;
  /** Future: minimum role required to see this item. */
  role: "viewer" | "editor" | "admin";
  description: string;
  /** List pages inside the section, shown as tabs when there is more than one. */
  pages?: readonly InternalNavPage[];
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
    label: "Programs",
    icon: "BookOpen",
    role: "editor",
    description: "Programmes for students and faculty, their offerings, and the opportunities (application calls) under each.",
    pages: [
      { href: "/internal/programs", label: "Programs" },
      { href: "/internal/opportunities", label: "Opportunities" },
    ],
  },
  {
    href: "/internal/documents",
    label: "Documents",
    icon: "FolderOpen",
    role: "editor",
    description: "Official documents, with operational reports as a subsection.",
    pages: [
      { href: "/internal/documents", label: "Documents" },
      { href: "/internal/reports", label: "Reports" },
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

/** The section page a path belongs to, e.g. /internal/opportunities/x → Opportunities. */
export function findNavPage(pathname: string, item: InternalNavItem) {
  return item.pages?.find((page) => page.href !== "/internal" && underPath(pathname, page.href));
}

/**
 * Whether a path belongs to a section. Dashboard owns /internal itself (not
 * every /internal/* page) plus its own pages such as Activities.
 */
export function isNavItemActive(pathname: string, href: string) {
  const item = internalNav.find((entry) => entry.href === href);
  if (item && findNavPage(pathname, item)) return true;
  if (href === "/internal") return pathname === "/internal";
  return underPath(pathname, href);
}

export function findNavItem(pathname: string) {
  return internalNav.find((item) => isNavItemActive(pathname, item.href));
}

/** Tabs for a section with more than one list page; empty otherwise. */
export function sectionTabs(sectionHref: string): readonly InternalNavPage[] {
  const pages = internalNav.find((item) => item.href === sectionHref)?.pages ?? [];
  return pages.length > 1 ? pages : [];
}

export type Breadcrumb = { label: string; href: string };

function recordActionLabel(action: string) {
  if (action === "edit") return "Edit";
  if (action === "agreements/new") return "New MoU";
  if (/^agreements\/[^/]+\/edit$/.test(action)) return "Edit MoU";
  return null;
}

/**
 * Portal › Section › Page › Record › Action. Each crumb links to a real page:
 * the record crumb points at the record itself, never at a sub-route such as /edit.
 */
export function internalBreadcrumbs(pathname: string): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ label: "Portal", href: "/internal" }];
  const section = findNavItem(pathname);
  if (!section) return crumbs;
  const page = findNavPage(pathname, section);
  if (section.href !== "/internal") crumbs.push({ label: section.label, href: section.href });
  if (page && page.href !== section.href) crumbs.push({ label: page.label, href: page.href });
  const base = page?.href ?? (section.href === "/internal" ? null : section.href);
  if (!base) return crumbs;

  const [record, ...action] = pathname.slice(base.length).split("/").filter(Boolean);
  if (!record) return crumbs;
  if (record === "new") return [...crumbs, { label: "New", href: pathname }];

  crumbs.push({ label: "Details", href: `${base}/${record}` });
  const label = action.length > 0 ? recordActionLabel(action.join("/")) : null;
  if (label) crumbs.push({ label, href: pathname });
  return crumbs;
}
