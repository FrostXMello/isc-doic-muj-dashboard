/**
 * The Directorate of International Collaborations as described on the
 * official Overview and Process Information pages (reviewed 2026-09-30).
 * Kept separate from ./internationalization so client components that need
 * the name or office contact do not bundle the full dataset.
 */

import { officialSources } from "@/lib/official/source";

export const directorate = {
  name: "Directorate of International Collaborations",
  shortName: "DoIC",
  /** Spellings used on different official pages (see the source audit). */
  nameVariants: [
    "Directorate of International Collaborations",
    "Directorate of International Collaboration (DoIC)",
    "Directorate of International and Collaborations (DoIC)",
  ],
  summary:
    "DoIC is established to promote internationalization and partnerships with international institutes: student and faculty exchange, semester abroad programmes, student mobility, higher education opportunities, and MoUs with educational and research institutes. It also supports the local IAESTE student chapter, international projects, funding, short and long mobility, a visa support network, and the Summer and Winter Schools.",
  functions: [
    {
      title: "Provide direction",
      body: "Provides direction and assistance, and synchronises the University’s international work with overseas institutions and governments, coordinating individual initiatives through one central office.",
    },
    {
      title: "Foreign education",
      body: "Acts as the University’s resource for study abroad, research abroad, intern abroad and other educational experiences, and administers student exchange programmes with partner institutions.",
    },
    {
      title: "Resource centre",
      body: "Serves as the liaison for international linkages, supports agreements and partnerships with overseas universities, governments and organisations, and facilitates access to international research and funding.",
    },
    {
      title: "Student services",
      body: "Advises international students, faculty, staff and short-term exchange visitors on settling in and immigration requirements, and assists MUJ students travelling overseas.",
    },
  ],
  team: [
    { name: "Dr Lalita Ledwani", title: "Dean – Research, International Affairs and Academic Administration" },
    { name: "Dr Ravi Kumar Sharma", title: "Professor & Director, Directorate of International Collaborations" },
    { name: "Mr. Punit Balichwal", title: "Deputy Manager, Directorate of International Collaborations" },
    { name: "Ms. Sunita Saini", title: "Sr. Management Executive, Directorate of International Collaborations" },
  ],
  office: {
    location: "DoIC Office, Dome Building, MUJ",
    address: ["Dehmi Kalan, Jaipur-Ajmer Expressway", "Jaipur 303007, Rajasthan, India"],
    email: "doic@jaipur.manipal.edu",
    telephone: "+91 141 3999100 (Ext. 162/610)",
  },
  visaAssistanceForm: "https://forms.office.com/r/jpkUyBS5fB",
  sources: {
    overview: officialSources.overview,
    office: officialSources.processOthers,
    letterhead: officialSources.exchangePolicy,
  },
} as const;
