/**
 * Navigation definitions for the Internal Portal workspace.
 *
 * Each entry maps to a route under /internal and an icon from lucide-react.
 * The `role` field is a placeholder for future RBAC gating — it is not
 * enforced in this stage.
 *
 * Pure module (no React), so route mappings can be unit-tested.
 */

export type InternalNavItem = {
  href: string;
  label: string;
  icon: string;
  /** Future: minimum role required to see this item. */
  role: "viewer" | "editor" | "admin";
  description: string;
};

export const internalNav: readonly InternalNavItem[] = [
  {
    href: "/internal",
    label: "Dashboard",
    icon: "LayoutDashboard",
    role: "viewer",
    description: "Overview of institutional collaboration metrics and recent activity.",
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
    description: "International program definitions and configurations.",
  },
  {
    href: "/internal/opportunities",
    label: "Opportunities",
    icon: "Compass",
    role: "editor",
    description: "Student-facing opportunity listings management.",
  },
  {
    href: "/internal/documents",
    label: "Documents",
    icon: "FolderOpen",
    role: "editor",
    description: "Institutional documents, agreements, and file storage.",
  },
  {
    href: "/internal/activities",
    label: "Activities",
    icon: "CalendarDays",
    role: "viewer",
    description: "Events, visits, delegations, and activity log.",
  },
  {
    href: "/internal/reports",
    label: "Reports",
    icon: "BarChart3",
    role: "admin",
    description: "Analytics, exports, and periodic reports.",
  },
  {
    href: "/internal/settings",
    label: "Settings",
    icon: "Settings",
    role: "admin",
    description: "Portal configuration, users, and system preferences.",
  },
] as const;

/** The section a path belongs to. Dashboard matches only its own path, not every /internal/* page. */
export function isNavItemActive(pathname: string, href: string) {
  if (href === "/internal") return pathname === "/internal";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavItem(pathname: string) {
  return internalNav.find((item) => isNavItemActive(pathname, item.href));
}

export type Breadcrumb = { label: string; href: string };

function recordActionLabel(action: string) {
  if (action === "edit") return "Edit";
  if (action === "agreements/new") return "New MoU";
  if (/^agreements\/[^/]+\/edit$/.test(action)) return "Edit MoU";
  return null;
}

/**
 * Portal › Section › Record › Action. Each crumb links to a real page: the
 * record crumb points at the record itself, never at a sub-route such as /edit.
 */
export function internalBreadcrumbs(pathname: string): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ label: "Portal", href: "/internal" }];
  const section = findNavItem(pathname);
  if (!section || section.href === "/internal") return crumbs;
  crumbs.push({ label: section.label, href: section.href });

  const [record, ...action] = pathname.slice(section.href.length).split("/").filter(Boolean);
  if (!record) return crumbs;
  if (record === "new") return [...crumbs, { label: "New", href: pathname }];

  crumbs.push({ label: "Details", href: `${section.href}/${record}` });
  const label = action.length > 0 ? recordActionLabel(action.join("/")) : null;
  if (label) crumbs.push({ label, href: pathname });
  return crumbs;
}
