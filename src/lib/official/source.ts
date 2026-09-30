/** Official MUJ pages this platform's data is taken from. */

export const SOURCE_REVIEWED_ON = "2026-09-30";

export const MUJ_SITE = "https://jaipur.manipal.edu";

export const officialSources = {
  partners: {
    url: "https://jaipur.manipal.edu/international-collaboration-and-partners.php",
    title: "International Collaborations — Collaboration & Partners",
  },
  overview: {
    url: "https://jaipur.manipal.edu/about-international-collaborations.php",
    title: "International Collaborations — Overview",
  },
  exchange: {
    url: "https://jaipur.manipal.edu/exchange-programs.php",
    title: "Student Exchange — Inbound and Outbound process flow",
  },
  exchangePolicy: {
    url: "https://jaipur.manipal.edu/img/pdf/Student-Exchange-Policy.pdf",
    title: "Student Exchange Policy (Semester Exchange)",
  },
  globalPrograms: {
    url: "https://jaipur.manipal.edu/global-progams-offered.php",
    title: "Global Programs — Programs Offered",
  },
  pathway: {
    url: "https://jaipur.manipal.edu/pathway-progression.php",
    title: "Pathway & Research — Pathway/ Progression",
  },
  facultyExchange: {
    url: "https://jaipur.manipal.edu/international-exchange-opportunities.php",
    title: "Faculty Exchange — International Exchange Opportunities",
  },
  academicVisit: {
    url: "https://jaipur.manipal.edu/academic-visit.php",
    title: "Faculty Exchange — Academic Visit",
  },
  delegationVisit: {
    url: "https://jaipur.manipal.edu/delegation-visit.php",
    title: "Faculty Exchange — Delegation Visit",
  },
  summerSchool2026: {
    url: "https://jaipur.manipal.edu/international-summer-school-2026.php",
    title: "Events — International Summer School (ISSMUJ 2026)",
  },
  summerSchool2025: {
    url: "https://jaipur.manipal.edu/international-summer-school.php",
    title: "Events — International Summer School (ISSMUJ 2025)",
  },
  summerSchool2024: {
    url: "https://jaipur.manipal.edu/upcoming%20-events.php",
    title: "Events — Upcoming Events (ISSMUJ-2024)",
  },
  winterSchool: {
    url: "https://jaipur.manipal.edu/international-winter-school.php",
    title: "Events — International Winter School",
  },
  expoFairs: {
    url: "https://jaipur.manipal.edu/international-expo-fairs.php",
    title: "Events — International Expo/ Fairs",
  },
  exploreIndia: {
    url: "https://jaipur.manipal.edu/explore-india-program.php",
    title: "Events — Explore India Program",
  },
  creditForms: {
    url: "https://jaipur.manipal.edu/credit-exchange-forms.php",
    title: "Process Information — Credit Exchange Forms",
  },
  processOthers: {
    url: "https://jaipur.manipal.edu/process-information-others.php",
    title: "Process Information — Others",
  },
  newsletter: {
    url: "https://jaipur.manipal.edu/newsletter.php",
    title: "International Collaborations — Newsletter (Synergy)",
  },
  scholarships: {
    url: "https://jaipur.manipal.edu/international-scholarship-opportunities.php",
    title: "Student Exchange — International Scholarship Opportunities",
  },
  internships: {
    url: "https://jaipur.manipal.edu/international-internship.php",
    title: "Student Exchange — International Internship",
  },
  research: {
    url: "https://jaipur.manipal.edu/research-opportunities.php",
    title: "Pathway & Research — Research Opportunities",
  },
  studentBodies: {
    url: "https://jaipur.manipal.edu/student-bodies.php",
    title: "Student Exchange — Student Exchange Bodies (IAESTE, AIESEC)",
  },
  studyTours: {
    url: "https://jaipur.manipal.edu/study-tours.php",
    title: "Student Exchange — Study Tours",
  },
  internationalAdmissions: {
    url: "https://jaipur.manipal.edu/international-program-offered.php",
    title: "Admissions — International Students: Programs & Eligibility",
  },
  internationalStudentGuide: {
    url: "https://jaipur.manipal.edu/international-student-guide.php",
    title: "Admissions — International Student Guide",
  },
  nationalCollaborations: {
    url: "https://jaipur.manipal.edu/national-universities-and-research-center.php",
    title: "Collaboration & Partners — National Universities and Research Center",
  },
} as const;

export type OfficialSourceKey = keyof typeof officialSources;
