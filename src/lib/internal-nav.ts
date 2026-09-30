/**
 * Navigation definitions for the Internal Portal workspace.
 *
 * Each entry maps to a route under /internal and an icon from lucide-react.
 * The `role` field is a placeholder for future RBAC gating — it is not
 * enforced in this stage.
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
    label: "Universities",
    icon: "GraduationCap",
    role: "viewer",
    description: "Partner university directory and relationship management.",
  },
  {
    href: "/internal/mous",
    label: "MOUs",
    icon: "FileText",
    role: "editor",
    description: "Memoranda of Understanding tracking and status.",
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
