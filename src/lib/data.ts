/**
 * DEMO DATA — replace with database queries in a later stage.
 *
 * Every figure, partner name, city, and programme note in this module is an
 * illustrative placeholder for the visual foundation. These are not official
 * DoIC statistics, not a published memorandum list, and not confirmed
 * partnerships of Manipal University Jaipur.
 *
 * Do not present these values as live institutional records. The UI labels
 * them as demo figures and illustrative partners.
 */

export const site = {
  directorate: "Directorate of International Collaboration",
  shortName: "DoIC",
  cell: "International Student Cell",
  university: "Manipal University Jaipur",
  universityShort: "MUJ",
  managedBy: "Managed by International Student Cell",
} as const;

export const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/partners", label: "Partner Universities" },
  { href: "/programs", label: "Programs" },
  { href: "/about", label: "About DoIC" },
] as const;

export const portalNav = [
  { href: "/student-portal", label: "Student Portal" },
  { href: "/internal", label: "Internal Portal" },
] as const;

export const legalNav = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export const contact = {
  office: "Directorate of International Collaboration",
  cell: "International Student Cell",
  university: "Manipal University Jaipur",
  lines: [
    "Dehmi Kalan, Jaipur–Ajmer Expressway",
    "Jaipur, Rajasthan 303007, India",
  ],
  note: "A public contact address will be published here.",
} as const;

/** Illustrative counts only. Replace with queried totals later. */
export const networkStats = [
  {
    id: "universities",
    value: 127,
    suffix: "+",
    label: "Partner Universities",
  },
  { id: "countries", value: 40, suffix: "+", label: "Countries" },
  {
    id: "programs",
    value: 18,
    suffix: "+",
    label: "International Programs",
  },
  { id: "students", value: 500, suffix: "+", label: "Students Connected" },
] as const;

export type OpportunityIcon = "exchange" | "semester" | "pathway" | "visit";

export const opportunities = [
  {
    id: "student-exchange",
    title: "Student Exchange",
    href: "/opportunities",
    icon: "exchange" as const,
    summary:
      "A term or an academic year at a partner university, with a place held for the return to MUJ.",
  },
  {
    id: "semester-exchange",
    title: "Semester Exchange",
    href: "/opportunities",
    icon: "semester" as const,
    summary:
      "One semester abroad, aligned to the partner calendar, for students who want a single focused term.",
  },
  {
    id: "pathway-programs",
    title: "Pathway Programs",
    href: "/opportunities",
    icon: "pathway" as const,
    summary:
      "Structured routes that connect study at MUJ with a later stage at a partner institution.",
  },
  {
    id: "academic-visits",
    title: "Academic Visits",
    href: "/opportunities",
    icon: "visit" as const,
    summary:
      "Short faculty-led visits, summer schools, and delegations between Jaipur and campuses abroad.",
  },
] as const;

export type PartnerRegion = "Europe" | "Middle East" | "Asia-Pacific" | "North America";

export type Partner = {
  id: string;
  region: PartnerRegion;
  country: string;
  city: string;
  lat: number;
  lon: number;
  /** Sample institution names. Not a record of signed agreements. */
  universities: readonly string[];
  summary: string;
};

/**
 * Mock partner locations for the globe and the home preview.
 * Coordinates are real city positions; the institutions are sample names.
 */
export const partners: readonly Partner[] = [
  {
    id: "united-kingdom",
    region: "Europe",
    country: "United Kingdom",
    city: "London",
    lat: 51.5072,
    lon: -0.1276,
    universities: ["University of Birmingham", "Lancaster University"],
    summary:
      "A frequent setting for semester and year-long study across engineering, management, and the arts.",
  },
  {
    id: "australia",
    region: "Asia-Pacific",
    country: "Australia",
    city: "Sydney",
    lat: -33.8688,
    lon: 151.2093,
    universities: ["Macquarie University", "University of Newcastle"],
    summary:
      "Research-led campuses on a southern academic calendar, often used for a full semester away.",
  },
  {
    id: "united-states",
    region: "North America",
    country: "United States",
    city: "Boston",
    lat: 42.3601,
    lon: -71.0589,
    universities: ["Boston University", "University of Massachusetts"],
    summary:
      "A wide field of universities, from research campuses to specialised schools, for exchange and visits.",
  },
  {
    id: "germany",
    region: "Europe",
    country: "Germany",
    city: "Munich",
    lat: 48.1351,
    lon: 11.582,
    universities: ["Technical University of Munich", "LMU Munich"],
    summary:
      "Technical universities and research partners, often aligned with engineering and the sciences.",
  },
  {
    id: "uae",
    region: "Middle East",
    country: "United Arab Emirates",
    city: "Dubai",
    lat: 25.2048,
    lon: 55.2708,
    universities: [
      "University of Wollongong in Dubai",
      "Middlesex University Dubai",
    ],
    summary:
      "A regional point for short academic visits and programmes that sit between Jaipur and further study.",
  },
  {
    id: "singapore",
    region: "Asia-Pacific",
    country: "Singapore",
    city: "Singapore",
    lat: 1.3521,
    lon: 103.8198,
    universities: [
      "National University of Singapore",
      "Singapore Management University",
    ],
    summary:
      "Compact, research-intensive campuses used here to stand in for Southeast Asian partnerships.",
  },
  {
    id: "france",
    region: "Europe",
    country: "France",
    city: "Paris",
    lat: 48.8566,
    lon: 2.3522,
    universities: ["Sciences Po"],
    summary:
      "A sample European capital for public affairs, design, and university visits.",
  },
  {
    id: "japan",
    region: "Asia-Pacific",
    country: "Japan",
    city: "Tokyo",
    lat: 35.6762,
    lon: 139.6503,
    universities: ["Waseda University"],
    summary:
      "A sample East Asian campus for exchange terms and faculty-led academic visits.",
  },
  {
    id: "canada",
    region: "North America",
    country: "Canada",
    city: "Toronto",
    lat: 43.6532,
    lon: -79.3832,
    universities: ["University of Toronto"],
    summary:
      "A sample North American research university for semester mobility.",
  },
  {
    id: "netherlands",
    region: "Europe",
    country: "Netherlands",
    city: "Amsterdam",
    lat: 52.3676,
    lon: 4.9041,
    universities: ["University of Amsterdam"],
    summary:
      "A sample continental European partner for taught programmes in English.",
  },
  {
    id: "south-korea",
    region: "Asia-Pacific",
    country: "South Korea",
    city: "Seoul",
    lat: 37.5665,
    lon: 126.978,
    universities: ["Yonsei University"],
    summary:
      "A sample Korean campus on the illustrative network east of Jaipur.",
  },
];

/** Home campus. The globe draws every partner arc back to this point. */
export const hub = {
  id: "muj",
  name: "Manipal University Jaipur",
  city: "Jaipur",
  country: "India",
  lat: 26.9124,
  lon: 75.7873,
} as const;

export const classroomPoints = [
  {
    index: "01",
    title: "International exposure",
    body: "Time in another university’s classrooms, labs, and city, with DoIC as the office that helps a student prepare.",
  },
  {
    index: "02",
    title: "Academic collaboration",
    body: "Faculty, schools, and visiting delegations keeping MUJ in working conversation with institutions abroad.",
  },
  {
    index: "03",
    title: "Student mobility",
    body: "Outbound semesters and incoming students, so the campus in Jaipur is part of a two-way exchange.",
  },
] as const;
