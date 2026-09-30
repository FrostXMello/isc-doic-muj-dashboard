/**
 * Programmes, opportunities, documents, activities, and office details taken
 * from the Internationalization section of https://jaipur.manipal.edu,
 * reviewed 2026-09-30. Wording stays close to the official pages; nothing
 * here states eligibility, fees, deadlines, or availability that the pages do
 * not state. Public-safe: no personal phone numbers or nodal contacts.
 */

import { officialSources, SOURCE_REVIEWED_ON, type OfficialSourceKey } from "@/lib/official/source";
import type {
  Activity,
  DocumentLink,
  DocumentRecord,
  Opportunity,
  Program,
  ProgramAvailability,
  Provenance,
} from "@/lib/internal/types";

function from(key: OfficialSourceKey, verification: Provenance["verification"] = "source-imported"): Provenance {
  const source = officialSources[key];
  return {
    sourceUrl: source.url,
    sourceTitle: source.title,
    sourceCheckedOn: SOURCE_REVIEWED_ON,
    verification,
  };
}

export { directorate } from "@/lib/official/directorate";

// ---------------------------------------------------------------------------
// Programmes (one per type) and confirmed institution × programme pairs
// ---------------------------------------------------------------------------

export const officialPrograms: readonly Program[] = [
  {
    id: "student-exchange",
    type: "student-exchange",
    name: "Student Exchange Programs",
    description:
      "Receiving foreign students for short-term visits and semester exchange/study abroad at MUJ, and sending MUJ students for the same to Collaborative Institutes, within the framework of an MoU/Agreement between the institute and MUJ. MUJ has two forms: the Non-Credit Exchange Program (summer schools, internships, short duration courses) and the Credit Exchange Program (credit-based).",
    generalAudience:
      "Outgoing MUJ students and incoming students of Collaborative Institutes. Non-credit exchanges run from 1 week to 6 months and are encouraged during semester breaks.",
    source: "official",
    ...from("exchange"),
  },
  {
    id: "semester-exchange",
    type: "semester-exchange",
    name: "Semester Exchange (Credit Exchange Program)",
    description:
      "Courses credited at universities or institutions with which MUJ has an MoU for this purpose may count towards the credit requirement of the MUJ degree, under the Student Exchange Policy. Transferred credit is not used for GPA/CGPA computation; courses must be at the same level or above and approved by the Board of Studies before the student leaves.",
    generalAudience:
      "As stated in the policy: B.Tech students with consistent academic performance and CGPA > 7 (3rd/4th year and semester breaks); non-B.Tech students with CGPA > 7 (2nd/3rd year and semester breaks). Final decisions rest with the Dean of the Faculty.",
    source: "official",
    ...from("exchangePolicy"),
  },
  {
    id: "pathway-programs",
    type: "pathway-programs",
    name: "Pathway/ Progression",
    description:
      "Approved pathway models listed by DoIC: 5 years (3 + 1 + 1) with Iowa State University (USA), CESI (France) and The University of Queensland (Australia); 5.5 years (3 + 1 + 1.5) with UMKC (USA).",
    generalAudience: null,
    source: "official",
    ...from("pathway"),
  },
  {
    id: "academic-visits",
    type: "academic-visits",
    name: "Academic and Delegation Visits (Faculty Exchange)",
    description:
      "DoIC collaborates with international partners so that faculty members can present their work internationally through joint initiatives, research and teaching, and supports brief exchange stays for visiting faculty at MUJ. Academic and delegation visits are recorded on the Faculty Exchange pages.",
    generalAudience: "Faculty members of MUJ and visiting faculty from partner institutions.",
    source: "official",
    ...from("facultyExchange"),
  },
  {
    id: "dual-degree",
    type: "dual-degree",
    name: "Global Programs (Dual Degree)",
    description:
      "Deakin University, Australia – MUJ Dual Degree: a 2+2 International Degree Program in which students complete the first two years of undergraduate study at MUJ and the final two years at Deakin University. The University of Melbourne, Australia – MUJ Dual Degree: BSc Advanced (Hons).",
    generalAudience: "Undergraduate applicants to the listed programmes.",
    source: "official",
    ...from("globalPrograms"),
  },
  {
    id: "summer-winter-school",
    type: "summer-winter-school",
    name: "International Summer and Winter Schools",
    description:
      "The International Summer School (ISSMUJ) and International Winter School (IWSMUJ) are multi- and inter-disciplinary events under DoIC offering Bachelor or Master students a three-to-four-week study/training programme. Courses are credit based; participants earn a course certificate with 03 equivalent credits. Partner university students and pan-India students may take part.",
    generalAudience: "Bachelor or Master students, including partner university students and pan-India students.",
    source: "official",
    ...from("summerSchool2026"),
  },
];

export const officialAvailability: readonly ProgramAvailability[] = [
  {
    id: "off-pathway-iowa-state",
    programId: "pathway-programs",
    institutionId: "ofc-iowa-state-university-of-science-and-technology",
    agreementId: null,
    availability: null,
    duration: "5 Years (3 + 1 + 1)",
    intake: null,
    applicationStart: null,
    applicationEnd: null,
    eligibility: null,
    creditInformation: null,
    notes: "Listed under “Approved Pathway Models”.",
    source: "official",
    ...from("pathway"),
  },
  {
    id: "off-pathway-cesi",
    programId: "pathway-programs",
    institutionId: "ofc-cesi",
    agreementId: null,
    availability: null,
    duration: "5 Years (3 + 1 + 1)",
    intake: null,
    applicationStart: null,
    applicationEnd: null,
    eligibility: null,
    creditInformation: null,
    notes: "Listed under “Approved Pathway Models” as “Cesi France”.",
    source: "official",
    ...from("pathway"),
  },
  {
    id: "off-pathway-queensland",
    programId: "pathway-programs",
    institutionId: "ofc-the-university-of-queensland",
    agreementId: null,
    availability: null,
    duration: "5 Years (3 + 1 + 1)",
    intake: null,
    applicationStart: null,
    applicationEnd: null,
    eligibility: null,
    creditInformation: null,
    notes: "Listed under “Approved Pathway Models” as “University of Queensland Australia” / “UQ Australia”.",
    source: "official",
    ...from("pathway"),
  },
  {
    id: "off-pathway-umkc",
    programId: "pathway-programs",
    institutionId: "ofc-university-of-missouri-kansas-city-umkc",
    agreementId: null,
    availability: null,
    duration: "5.5 Years (3 + 1 + 1.5)",
    intake: null,
    applicationStart: null,
    applicationEnd: null,
    eligibility: null,
    creditInformation: null,
    notes: "Listed under “Approved Pathway Models” as “UMKC, USA”.",
    source: "official",
    ...from("pathway"),
  },
  {
    id: "off-dual-deakin",
    programId: "dual-degree",
    institutionId: "ofc-deakin-university",
    agreementId: null,
    availability: null,
    duration: "2 + 2",
    intake: null,
    applicationStart: null,
    applicationEnd: null,
    eligibility: null,
    creditInformation: null,
    notes: "B.Tech – Civil Engineering (2+2) and B.Tech – Computer Science Engineering (2+2).",
    source: "official",
    ...from("globalPrograms"),
  },
  {
    id: "off-dual-melbourne",
    programId: "dual-degree",
    institutionId: "ofc-the-university-of-melbourne",
    agreementId: null,
    availability: null,
    duration: null,
    intake: null,
    applicationStart: null,
    applicationEnd: null,
    eligibility: null,
    creditInformation: null,
    notes:
      "Listed as “BSc Advanced (Hons)” on the Global Programs page; the site menu names it “Bachelor of Science (Honours with Research) (Dual degree program (2+2) in collaboration with University of Melbourne, Australia)”.",
    source: "official",
    ...from("globalPrograms", "needs-review"),
  },
];

// ---------------------------------------------------------------------------
// Opportunities (application calls published by DoIC)
// ---------------------------------------------------------------------------

export const officialOpportunities: readonly Opportunity[] = [
  {
    id: "opp-issmuj-2026",
    title: "International Summer School, Manipal University Jaipur (ISSMUJ) 2026",
    programId: "summer-winter-school",
    availabilityId: null,
    institutionId: null,
    opensOn: null,
    deadline: "2026-05-31",
    recordStatus: "published",
    summary:
      "Hybrid mode, 17 June – 18 July 2026. Language of instruction English; 36 contact hours; 03 credits. Last date of registration: 31 May 2026. Fees are listed on the official page.",
    source: "official",
    ...from("summerSchool2026"),
  },
  {
    id: "opp-issmuj-2025",
    title: "International Summer School, Manipal University Jaipur (ISSMUJ) 2025",
    programId: "summer-winter-school",
    availabilityId: null,
    institutionId: null,
    opensOn: null,
    deadline: "2025-05-28",
    recordStatus: "archived",
    summary:
      "Hybrid mode, 03 June – 04 July 2025. 36 contact hours; 03 credits. Last date of registration: 28 May 2025.",
    source: "official",
    ...from("summerSchool2025"),
  },
  {
    id: "opp-issmuj-2024",
    title: "International Summer School, Manipal University Jaipur (ISSMUJ) 2024",
    programId: "summer-winter-school",
    availabilityId: null,
    institutionId: null,
    opensOn: null,
    deadline: null,
    recordStatus: "archived",
    summary: "17 June – 18 July 2024, for Bachelor or Master students and professionals.",
    source: "official",
    ...from("summerSchool2024"),
  },
  {
    id: "opp-iwsmuj-2023",
    title: "International Winter School (IWSMUJ-23)",
    programId: "summer-winter-school",
    availabilityId: null,
    institutionId: null,
    opensOn: null,
    deadline: null,
    recordStatus: "archived",
    summary: "IWSMUJ-23 had 25 participants in total, a few of them international. No dates are published.",
    source: "official",
    ...from("winterSchool"),
  },
];

// ---------------------------------------------------------------------------
// Documents: links to files published on the official site (no uploads)
// ---------------------------------------------------------------------------

function officialDocument(
  doc: Omit<DocumentRecord, "status" | "updatedOn" | "storageKey" | "source" | keyof Provenance> & {
    listedOn: OfficialSourceKey;
    verification?: Provenance["verification"];
  },
): DocumentRecord {
  const { listedOn, verification, ...rest } = doc;
  return {
    ...rest,
    status: "final",
    updatedOn: null,
    storageKey: null,
    source: "official",
    ...from(listedOn, verification),
  };
}

export const officialDocuments: readonly DocumentRecord[] = [
  officialDocument({
    id: "doc-student-exchange-policy",
    title: "Student Exchange Policy",
    type: "policy",
    url: "https://jaipur.manipal.edu/img/pdf/Student-Exchange-Policy.pdf",
    publiclyAccessible: true,
    description:
      "Linked as “Semester Exchange” in the Internationalization menu. The download link on the Exchange Programs page (…/content/dam/manipal/muj/documents/Collaborations/Student-Exchange-Policy.pdf) returned 404 on 2026-09-30.",
    listedOn: "exchangePolicy",
  }),
  officialDocument({
    id: "doc-credit-mapping-policy",
    title: "Course Credit Mapping Policy and Procedure (DoIC)",
    type: "policy",
    url: "https://jaipur.manipal.edu/img/pdf/3Course-Credit%20Maping%20Policy%20and%20Procedure_DOIC_17March2025.pdf",
    publiclyAccessible: true,
    description: "Listed on Credit Exchange Forms.",
    listedOn: "creditForms",
  }),
  officialDocument({
    id: "doc-credit-mapping-form",
    title: "Credit Mapping Form (Course Comparison Form)",
    type: "form",
    url: "https://jaipur.manipal.edu/img/pdf/COURSE%20COMPARISON%20FORM%20FOR%20CREDIT%20MAPPING%5B.pdf",
    publiclyAccessible: true,
    description: "Listed on Credit Exchange Forms.",
    listedOn: "creditForms",
  }),
  officialDocument({
    id: "doc-visa-assistance-form",
    title: "Visa Assistance Form",
    type: "form",
    url: "https://forms.office.com/r/jpkUyBS5fB",
    publiclyAccessible: false,
    description:
      "Microsoft Forms link for visa-related queries, listed on the DoIC overview page. Whether it opens without signing in was not checked.",
    listedOn: "overview",
  }),
  officialDocument({
    id: "doc-issmuj-2026-flyer",
    title: "ISSMUJ 2026 flyer",
    type: "brochure",
    url: "https://jaipur.manipal.edu/img/ISSMUJ-2026.pdf",
    publiclyAccessible: true,
    description: null,
    listedOn: "summerSchool2026",
  }),
  officialDocument({
    id: "doc-issmuj-2025-flyer",
    title: "ISSMUJ 2025 flyer",
    type: "brochure",
    url: "https://jaipur.manipal.edu/img/International%20Summer%20School%20Manipal%20University%20Jaipur%202025%20(ISSMUJ).pdf",
    publiclyAccessible: true,
    description: null,
    listedOn: "summerSchool2025",
  }),
  officialDocument({
    id: "doc-issmuj-2024-flyer",
    title: "ISSMUJ 2024 flyer",
    type: "brochure",
    url: "https://jaipur.manipal.edu/img/summer-school/ISSMUJ%202024%20Flyer%20Outside%20MUJ%20(2)_11zon.pdf",
    publiclyAccessible: true,
    description: null,
    listedOn: "summerSchool2024",
  }),
  officialDocument({
    id: "doc-explore-india-2024",
    title: "One Week Explore India 2024 Program (DoIC MUJ)",
    type: "brochure",
    url: "https://jaipur.manipal.edu/img/pdf/One%20Week%20Explore%20India%202024%20Program_DoIC%20MUJ.pdf",
    publiclyAccessible: true,
    description: "A one-week immersive study cum excursion programme across Jaipur, Agra and New Delhi.",
    listedOn: "exploreIndia",
  }),
  ...(
    [
      [6, "Jan–Jul 2024", "DoIC%20Newsletter%20Vol%206.pdf"],
      [5, "2022–23", "newslettedoic%20vol%205.pdf"],
      [4, "2021–22", "Newsletter%20DoIC.pdf"],
      [3, "2020–21", "Newsletter%20DoIC_%20Synergy%202020-21%20Vol%203.pdf"],
      [2, "2019–20", "DoIC%20Newsletter_2019-20%20(1)-SYNERGY%20VOL%202.pdf"],
      [1, "2018–19", "VOL%201.%20DOIC%20Newsletter_Jul18%20-%20Jun19_v3_%2001062019%20(1).pdf"],
    ] as const
  ).map(([volume, period, file]) =>
    officialDocument({
      id: `doc-synergy-vol-${volume}`,
      title: `Synergy — DoIC newsletter, Volume ${volume} (${period})`,
      type: "newsletter",
      url: `https://jaipur.manipal.edu/img/pdf/newsletter/${file}`,
      publiclyAccessible: true,
      description: null,
      listedOn: "newsletter",
    }),
  ),
  officialDocument({
    id: "doc-refund-policy-2024-25",
    title: "Refund Policy 2024-25 (International Students)",
    type: "policy",
    url: "https://jaipur.manipal.edu/img/pdf/Refund%20Policy%202024-25.pdf",
    publiclyAccessible: true,
    description:
      "The file opens, but its link sits in hidden (commented-out) markup on the Course Fee Refund Rules page; the page shows the rules as a table instead.",
    listedOn: "internationalAdmissions",
    verification: "needs-review",
  }),
  officialDocument({
    id: "doc-doic-process-documents",
    title: "DoIC Process Documents",
    type: "other",
    url: "https://jaipur.manipal.edu/img/pdf/6_1_DoIC%20Process%20Documents.pdf",
    publiclyAccessible: true,
    description:
      "The file opens, but its link sits in hidden (commented-out) markup on Process Information: Others. Confirm with DoIC whether it is current.",
    listedOn: "processOthers",
    verification: "needs-review",
  }),
  officialDocument({
    id: "doc-dic-list",
    title: "Department International Coordinators (DICs) list",
    type: "other",
    url: "https://jaipur.manipal.edu/pdf/Dic.pdf",
    publiclyAccessible: false,
    description:
      "Linked from hidden markup on the Collaboration & Partners page; the link returned 404 on 2026-09-30.",
    listedOn: "partners",
    verification: "needs-review",
  }),
];

export const officialDocumentLinks: readonly DocumentLink[] = [
  { id: "dl-policy-student-exchange", documentId: "doc-student-exchange-policy", institutionId: null, agreementId: null, programId: "student-exchange", availabilityId: null },
  { id: "dl-policy-semester-exchange", documentId: "doc-student-exchange-policy", institutionId: null, agreementId: null, programId: "semester-exchange", availabilityId: null },
  { id: "dl-credit-policy-semester", documentId: "doc-credit-mapping-policy", institutionId: null, agreementId: null, programId: "semester-exchange", availabilityId: null },
  { id: "dl-credit-form-semester", documentId: "doc-credit-mapping-form", institutionId: null, agreementId: null, programId: "semester-exchange", availabilityId: null },
  { id: "dl-issmuj-2026", documentId: "doc-issmuj-2026-flyer", institutionId: null, agreementId: null, programId: "summer-winter-school", availabilityId: null },
  { id: "dl-issmuj-2025", documentId: "doc-issmuj-2025-flyer", institutionId: null, agreementId: null, programId: "summer-winter-school", availabilityId: null },
  { id: "dl-issmuj-2024", documentId: "doc-issmuj-2024-flyer", institutionId: null, agreementId: null, programId: "summer-winter-school", availabilityId: null },
];

// ---------------------------------------------------------------------------
// Activities documented on the Faculty Exchange and Events pages
// ---------------------------------------------------------------------------

type ActivityInput = Omit<Activity, keyof Provenance | "source" | "agreementId" | "participants"> & {
  listedOn: OfficialSourceKey;
  participants?: string | null;
};

function officialActivity({ listedOn, participants = null, ...rest }: ActivityInput): Activity {
  return { ...rest, participants, agreementId: null, source: "official", ...from(listedOn) };
}

export const officialActivities: readonly Activity[] = [
  officialActivity({
    id: "act-sfedu-visit-2023",
    title: "Academic visit of Southern Federal University, Russia",
    type: "inbound-visit",
    startDate: "2023-06-22",
    endDate: "2023-06-24",
    institutionId: "ofc-southern-federal-university",
    country: "Russia",
    city: "Jaipur",
    recordStatus: "completed",
    summary:
      "Southern Federal University visited MUJ to sign a Memorandum of Understanding and to promote summer/winter schools, faculty/student exchange, pathway programmes, joint research and joint supervision.",
    participants: "Dr. Gennady Veselov, Dr. Anton Pljonkin, Dr. Anna Opryshko",
    listedOn: "academicVisit",
  }),
  officialActivity({
    id: "act-illinois-state-visit-2023",
    title: "Academic visit of Illinois State University",
    type: "inbound-visit",
    startDate: "2023-03-16",
    endDate: null,
    institutionId: "ofc-illinois-state-university",
    country: "United States",
    city: "Jaipur",
    recordStatus: "completed",
    summary:
      "A delegation from Illinois State University visited MUJ to sign a Memorandum of Understanding and to promote summer/winter schools, exchange, pathway programmes and joint research.",
    participants: "Dr. Aondover Tarhule; Ms. Roopa Rawjee EdD",
    listedOn: "academicVisit",
  }),
  officialActivity({
    id: "act-iit-guwahati-2023",
    title: "Academic visit to Indian Institute of Technology Guwahati",
    type: "outbound-visit",
    startDate: "2023-01-30",
    endDate: null,
    institutionId: null,
    country: "India",
    city: "Guwahati",
    recordStatus: "completed",
    summary: "DoIC, MUJ signed a Memorandum of Understanding with IIT Guwahati on 30 January 2023 (national collaboration).",
    listedOn: "academicVisit",
  }),
  officialActivity({
    id: "act-chiang-mai-2023",
    title: "Staff training event at Chiang Mai University",
    type: "outbound-visit",
    startDate: "2023-02-13",
    endDate: "2023-02-17",
    institutionId: null,
    country: "Thailand",
    city: null,
    recordStatus: "completed",
    summary:
      "Training for staff involved in the EACEA-funded project “A new Master Course in Applied Computational Fluid Dynamics”, with European expert partners.",
    listedOn: "academicVisit",
  }),
  officialActivity({
    id: "act-monash-2023",
    title: "Academic visit to Monash University (Clayton campus)",
    type: "outbound-visit",
    startDate: "2023-03-14",
    endDate: null,
    institutionId: null,
    country: "Australia",
    city: null,
    recordStatus: "completed",
    summary:
      "MUJ leaders discussed a holistic engagement plan, an integrated Masters programme and collaborative research. Monash University is not listed on the official partner page.",
    listedOn: "academicVisit",
  }),
  officialActivity({
    id: "act-rmit-2023",
    title: "Delegation visit to RMIT University",
    type: "delegation",
    startDate: "2023-03-14",
    endDate: null,
    institutionId: null,
    country: "Australia",
    city: null,
    recordStatus: "completed",
    summary:
      "Dr. G K Prabhu, President, MUJ, discussed international programmes and a joint degree programme. RMIT University is not listed on the official partner page.",
    listedOn: "delegationVisit",
  }),
  officialActivity({
    id: "act-deakin-2023",
    title: "Delegation visit to Deakin University",
    type: "delegation",
    startDate: "2023-03-15",
    endDate: null,
    institutionId: "ofc-deakin-university",
    country: "Australia",
    city: null,
    recordStatus: "completed",
    summary:
      "Dr. G K Prabhu, President, MUJ, discussed student transfer programmes, engagement plans, research collaboration and a joint degree programme.",
    listedOn: "delegationVisit",
  }),
  officialActivity({
    id: "act-queensland-2023",
    title: "Delegation visit to The University of Queensland",
    type: "delegation",
    startDate: "2023-03-16",
    endDate: null,
    institutionId: "ofc-the-university-of-queensland",
    country: "Australia",
    city: null,
    recordStatus: "completed",
    summary: "Dr. G K Prabhu, President, MUJ, discussed international programmes and a joint degree programme.",
    listedOn: "delegationVisit",
  }),
  officialActivity({
    id: "act-sydney-2023",
    title: "Delegation visit to The University of Sydney",
    type: "delegation",
    startDate: "2023-03-17",
    endDate: null,
    institutionId: null,
    country: "Australia",
    city: null,
    recordStatus: "completed",
    summary:
      "Dr. G K Prabhu, President, MUJ, discussed international pathways, an engagement plan and a joint degree programme. The University of Sydney is not listed on the official partner page.",
    listedOn: "delegationVisit",
  }),
  officialActivity({
    id: "act-australia-day-2023",
    title: "Australia Day at MUJ",
    type: "event",
    startDate: "2023-08-07",
    endDate: null,
    institutionId: null,
    country: "India",
    city: "Jaipur",
    recordStatus: "planned",
    summary:
      "Organised by DoIC with Global Reach: representatives of 13–15 Australian universities, a panel discussion and student counselling desks. The page announces the event; it does not record the outcome.",
    listedOn: "expoFairs",
  }),
  officialActivity({
    id: "act-campus-france-2024",
    title: "Campus France – Education Fair (Study in France Tour)",
    type: "event",
    startDate: "2024-04-05",
    endDate: null,
    institutionId: null,
    country: "India",
    city: "Jaipur",
    recordStatus: "planned",
    summary:
      "Collaborative effort by DoIC-MUJ, Campus France, the French Embassy and Alliance Française, supported by InSeLL. The page announces the event; it does not record the outcome.",
    listedOn: "expoFairs",
  }),
  officialActivity({
    id: "act-issmuj-2024",
    title: "International Summer School (ISSMUJ-2024)",
    type: "event",
    startDate: "2024-06-17",
    endDate: "2024-07-18",
    institutionId: null,
    country: "India",
    city: "Jaipur",
    recordStatus: "planned",
    summary: "Published as an upcoming event; the outcome is not recorded on the official page.",
    listedOn: "summerSchool2024",
  }),
  officialActivity({
    id: "act-issmuj-2025",
    title: "International Summer School (ISSMUJ 2025, hybrid)",
    type: "event",
    startDate: "2025-06-03",
    endDate: "2025-07-04",
    institutionId: null,
    country: "India",
    city: "Jaipur",
    recordStatus: "planned",
    summary: "Published as planned; the outcome is not recorded on the official page.",
    listedOn: "summerSchool2025",
  }),
  officialActivity({
    id: "act-issmuj-2026",
    title: "International Summer School (ISSMUJ 2026, hybrid)",
    type: "event",
    startDate: "2026-06-17",
    endDate: "2026-07-18",
    institutionId: null,
    country: "India",
    city: "Jaipur",
    recordStatus: "planned",
    summary: "Published as planned; the outcome is not recorded on the official page.",
    listedOn: "summerSchool2026",
  }),
];

// ---------------------------------------------------------------------------
// Other official listings, linked rather than imported
// ---------------------------------------------------------------------------

export const otherOfficialListings = [
  {
    id: "scholarships",
    title: "International Scholarship Opportunities",
    body: "Partner and other scholarships listed by DoIC, with opening and closing months where known (many entries say “check website”).",
    url: officialSources.scholarships.url,
    pageTitle: officialSources.scholarships.title,
  },
  {
    id: "internships",
    title: "International Internship",
    body: "External internship programmes (for example CERN, EPFL, OIST, Mitacs Globalink) listed by DoIC. Dates on the page are from 2023–2024.",
    url: officialSources.internships.url,
    pageTitle: officialSources.internships.title,
  },
  {
    id: "research",
    title: "Research Opportunities",
    body: "External research internships (OIST, CUHK SURP, McKelvey School of Engineering) listed by DoIC. Dates on the page are from 2023–2024.",
    url: officialSources.research.url,
    pageTitle: officialSources.research.title,
  },
  {
    id: "student-bodies",
    title: "Student Exchange Bodies — IAESTE and AIESEC",
    body: "IAESTE MUJ (a local committee of IAESTE India) and AIESEC, as described on the official page.",
    url: officialSources.studentBodies.url,
    pageTitle: officialSources.studentBodies.title,
  },
  {
    id: "study-tours",
    title: "Study Tours",
    body: "Previous study tour listed: Ajman University, Dubai, UAE.",
    url: officialSources.studyTours.url,
    pageTitle: officialSources.studyTours.title,
  },
  {
    id: "explore-india",
    title: "Explore India Program",
    body: "A one-week immersive study cum excursion programme across Jaipur, Agra and New Delhi (2024 programme document).",
    url: officialSources.exploreIndia.url,
    pageTitle: officialSources.exploreIndia.title,
  },
  {
    id: "admissions",
    title: "International admissions",
    body: "Admission of Foreign/NRI/PIO/OCI students is handled by the Office of International Admissions (admissions@jaipur.manipal.edu), not by DoIC.",
    url: officialSources.internationalAdmissions.url,
    pageTitle: officialSources.internationalAdmissions.title,
  },
] as const;
