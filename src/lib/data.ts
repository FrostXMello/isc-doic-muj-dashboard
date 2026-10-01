/**
 * Site-wide copy and navigation for the public website.
 *
 * Institutional facts (directorate name, office contact, programmes, partner
 * institutions) come from the official MUJ Internationalization pages via
 * src/lib/official. This module only holds presentation copy around them.
 *
 * Ownership: DoIC is the university directorate that owns international
 * collaborations. The International Student Cell (ISC) operates this
 * platform for DoIC; it is not the authority over DoIC's records. This site
 * is not the official MUJ website.
 */

import { directorate } from "@/lib/official/directorate";
import { officialSources } from "@/lib/official/source";

export const site = {
  directorate: directorate.name,
  shortName: directorate.shortName,
  cell: "International Student Cell",
  university: "Manipal University Jaipur",
  universityShort: "MUJ",
  managedBy: "Platform operated by the International Student Cell for DoIC",
  officialSite: "https://jaipur.manipal.edu",
  officialPartnersPage: officialSources.partners.url,
} as const;

/** Top nav shown on every student-portal page. */
export const studentPortalNav = [
  { href: "/student-portal", label: "Home" },
  { href: "/student-portal/opportunities", label: "Opportunities" },
  { href: "/student-portal/partners", label: "Partner Universities" },
  { href: "/student-portal/programs", label: "Programs" },
  { href: "/student-portal/about", label: "About DoIC" },
] as const;

/** Footer site links. */
export const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/student-portal/opportunities", label: "Opportunities" },
  { href: "/student-portal/partners", label: "Partner Universities" },
  { href: "/student-portal/programs", label: "Programs" },
  { href: "/student-portal/about", label: "About DoIC" },
] as const;

export const portalNav = [{ href: "/login", label: "Login" }] as const;

export const legalNav = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

/** DoIC office contact as published in the official Student Exchange Policy. */
export const contact = {
  office: directorate.name,
  location: directorate.office.location,
  university: "Manipal University Jaipur",
  lines: directorate.office.address,
  email: directorate.office.email,
  telephone: directorate.office.telephone,
  source: officialSources.exchangePolicy,
} as const;

export type OpportunityIcon = "exchange" | "semester" | "pathway" | "visit" | "degree" | "school";

/** Programme categories on the home page; wording condensed from the official pages. */
export const opportunities = [
  {
    id: "student-exchange",
    title: "Student Exchange",
    href: "/student-portal/programs",
    icon: "exchange" as const,
    summary:
      "Non-credit exchanges (summer schools, internships, short courses) and credit-based exchanges with Collaborative Institutes, under an MoU or agreement with MUJ.",
  },
  {
    id: "semester-exchange",
    title: "Semester Exchange",
    href: "/student-portal/programs",
    icon: "semester" as const,
    summary:
      "Credits earned at an institution with which MUJ has an MoU for this purpose may count towards the MUJ degree, under the Student Exchange Policy.",
  },
  {
    id: "pathway-programs",
    title: "Pathway / Progression",
    href: "/student-portal/programs",
    icon: "pathway" as const,
    summary:
      "Approved pathway models of 5 years (3 + 1 + 1) and 5.5 years (3 + 1 + 1.5) with listed partner universities.",
  },
  {
    id: "dual-degree",
    title: "Global Programs (Dual Degree)",
    href: "/student-portal/programs",
    icon: "degree" as const,
    summary:
      "Dual degrees listed with Deakin University (2+2 B.Tech) and The University of Melbourne (BSc Advanced (Hons)).",
  },
  {
    id: "summer-winter-school",
    title: "International Summer and Winter Schools",
    href: "/student-portal/opportunities",
    icon: "school" as const,
    summary:
      "ISSMUJ and IWSMUJ: three-to-four-week credit-based study and training programmes run under DoIC.",
  },
  {
    id: "academic-visits",
    title: "Academic and Delegation Visits",
    href: "/student-portal/programs",
    icon: "visit" as const,
    summary:
      "Faculty exchange, academic visits and delegations between MUJ and institutions abroad, as recorded by DoIC.",
  },
] as const;

/** Home campus. The globe draws every partner arc back to this point. */
export const hub = {
  id: "muj",
  name: "Manipal University Jaipur",
  city: "Jaipur",
  country: "India",
  lat: 26.9124,
  lon: 75.7873,
} as const;
