/**
 * Reviewed matching decisions for the DoIC MoU register import.
 *
 * The import only matches a recorded name to an existing university when the
 * normalised names are identical. Every other name needs an entry here, made
 * after reading the reconciliation report:
 *  - match: the same partner as an existing university;
 *  - create: a new university, only with a country the register states;
 *  - national: an Indian partner, kept with the National MoUs;
 *  - heading: a section label inside a sheet, not a record;
 *  - unresolved: kept for manual review, with the reason.
 * Keys are names exactly as recorded (compared after `matchKey`). Partner
 * names are public; no contact details belong in this file.
 */

export type InstitutionDecision =
  | { match: string; reason: string }
  | { create: { name: string; normalizedName?: string; country: string }; reason: string }
  | { national: string }
  | { heading: string }
  | { unresolved: string };

const NATIONAL = { national: "Indian partner; listed with the national collaborations, not the international universities." };
const PIPELINE_ONLY = {
  unresolved:
    "Appears only in the MoU processing sheet with no agreement in the MoU list, so no university is created. Add it when the MoU is signed.",
};
const NO_COUNTRY = (detail: string) => ({
  unresolved: `${detail} Every university in the portal needs a country, and none is recorded, so it is not added.`,
});

const sinop = { create: { name: "Sinop University", country: "turkey" }, reason: "Name states Türkiye (portal country: Turkey)." };
const leoben = {
  create: { name: "Montanuniversitat Leoben", normalizedName: "Montanuniversität Leoben", country: "austria" },
  reason: "Name and reference state Austria.",
};
const icImpacts = {
  create: { name: "IC-IMPACTS, University of British Columbia", country: "canada" },
  reason: "Name states Canada. The MoU Status sheet calls it 'IC-IMPACTS Centres of Excellence'.",
};
const chiangMai = { create: { name: "Chiang Mai University", country: "thailand" }, reason: "Name states Thailand." };
const kasetsart = { create: { name: "Kasetsart University", country: "thailand" }, reason: "Name states Thailand." };
const santoTomas = {
  create: { name: "University of Santo Tomas, Manila", normalizedName: "University of Santo Tomas", country: "philippines" },
  reason: "Name states Manila, Philippines.",
};
const mongkut = {
  match: "ofc-king-mongkuts-university-of-technology",
  reason: "King Mongkut's University of Technology North Bangkok; the official row links kmutnb.ac.th.",
};

export const institutionDecisions: Record<string, InstitutionDecision> = {
  // Same partner as an existing university.
  "The College of Engineering and Computing at Florida International University, Greater Miami, Florida USA: Academic Agreement": {
    match: "ofc-florida-international-university",
    reason: "Official name plus the agreement wording.",
  },
  "Florida International University, Greater Miami, Florida US Agreement": {
    match: "ofc-florida-international-university",
    reason: "Same university.",
  },
  "University of Florida Board of Trustees, USA": { match: "ofc-university-of-florida", reason: "The university's legal signatory." },
  "b. University of Leicester, Agreement of Cooperation, UK": { match: "ofc-university-of-leicester", reason: "Name plus agreement wording." },
  "University of Leicester, UK (MoU)": { match: "ofc-university-of-leicester", reason: "Name plus agreement wording." },
  "University of Leicester, UK Agreement of Cooperation": { match: "ofc-university-of-leicester", reason: "Name plus agreement wording." },
  "Plymouth University UK (Psychology Dept)": { match: "ofc-plymouth-university", reason: "Name plus department." },
  "b. CESI France, Addendum": { match: "ofc-cesi", reason: "Name plus agreement wording." },
  "b. Addendum 1 CESI France": { match: "ofc-cesi", reason: "Name plus agreement wording." },
  "b. University of Ostrava Czech Republic: Student Exchange Agreement": { match: "ofc-university-of-ostrava", reason: "Name plus agreement wording." },
  "b. University of Ostrava Czech Republic (Agreement)": { match: "ofc-university-of-ostrava", reason: "Name plus agreement wording." },
  "University of Ostrava, Czechia": { match: "ofc-university-of-ostrava", reason: "Same university." },
  "b. Ajman University, UAE: Student Exchange Agreement (SEA)": { match: "ofc-ajman-university", reason: "Name plus agreement wording." },
  "b. Student Exchange Agreement(SEA), Ajman University, UAE": { match: "ofc-ajman-university", reason: "Name plus agreement wording." },
  "a. Southern Federal University Russia (Agreement on Mutual Corporation with Addendum 1 to 3)": {
    match: "ofc-southern-federal-university",
    reason: "Name plus agreement wording.",
  },
  "b. Southern Federal University Russia_Indian-Russian Center (IRC)": {
    match: "ofc-southern-federal-university",
    reason: "The university's Indian-Russian Center.",
  },
  "Sothern Federal University Russia ( Agreement on Mutual Corporation with Addendum 1 to 4)": {
    match: "ofc-southern-federal-university",
    reason: "Misspelt name plus agreement wording.",
  },
  "a. Russian State Social University (The Russian Federation)": { match: "ofc-russian-state-social-university", reason: "Same university." },
  "b. Russian State Social University (The Russian Federation): Student Exchange Agreement)": {
    match: "ofc-russian-state-social-university",
    reason: "Name plus agreement wording.",
  },
  "(a) Russian State Social University (b) Student Exchange Agreement)": {
    match: "ofc-russian-state-social-university",
    reason: "Name plus agreement wording.",
  },
  "b. Nottingham Trent University United Kingdom (Agreement)": { match: "ofc-nottingham-trent-university", reason: "Name plus agreement wording." },
  "Tashkent University of Finance, Uzbekistan": { match: "ofc-tashkent-university-of-finance", reason: "Same name plus country." },
  "University of Queensland Australia": { match: "ofc-the-university-of-queensland", reason: "The official page misspells it 'Universit of Queensland'." },
  "Bio Forensics Research Centre, Italy": { match: "ofc-bio-forensic-research-centre", reason: "Spelling variant." },
  "InFoSTAuccess3D (IS3D) Greece": { match: "ofc-infosuccess3d-is3d", reason: "Spelling variant; same IS3D acronym." },
  "Ural State Law University Russia": { match: "ofc-ural-state-law-university", reason: "The official page lists the university under this name too." },
  "Sunway University Malaysia": { match: "ofc-sunway-university", reason: "The official page lists both spellings for one university." },
  "University of Gdansk, Poland": {
    match: "ofc-gdansk-university",
    reason: "The official page lists 'Gdansk University Poland'; the reference keyword is Gdansk.",
  },
  "Old Dominion University, Virginia, USA": { match: "ofc-old-dominion-university", reason: "Same name plus country." },
  "University of Galway, Ireland": { match: "ofc-university-of-galway", reason: "The official page misspells it 'Glaway'." },
  "Taylor's University, Malaysia": { match: "ofc-taylors-university", reason: "Same name plus country." },
  "Institute of Theoretical and Computational Physics, Department of Physics, University of Crete, Greece": {
    match: "ofc-university-of-crete",
    reason: "An institute of the university.",
  },
  "La Trobe University Melbourne Victoria, Australia": { match: "ofc-la-trobe-university", reason: "Same university." },
  "2+2 Deakin University, Victoria, Australia": { match: "ofc-deakin-university", reason: "A 2+2 programme agreement with the university." },
  "Department of Computer Engineering, Modeling, Electronics and Systems -University of Calabria, Italy": {
    match: "ofc-university-of-calabria",
    reason: "A department of the university.",
  },
  "King Mongkut's University of Technology North Bangkok, Thailand": mongkut,
  "University of Missouri- Kansas City (UMKC), USA": { match: "ofc-university-of-missouri-kansas-city-umkc", reason: "Same university." },
  "MoA (Articulation) UMKC’s School of Computing & Engg": {
    match: "ofc-university-of-missouri-kansas-city-umkc",
    reason: "A school of UMKC.",
  },
  "The Curators of the University of Missouri on behalf of the University of Missouri-Kansas City (UMKC), USA; MoU+MoA; Renewal": {
    match: "ofc-university-of-missouri-kansas-city-umkc",
    reason: "Same university (renewal).",
  },
  "Janabadra University (JBUI), Yogyakarta Indonesia": { match: "ofc-janabadra-university", reason: "Same name plus country." },
  "University Malaya, Malaysia": { match: "ofc-universiti-malaya", reason: "Spelling variant." },
  "MoU-Seoul Media Institute of Technology, Seoul, Republic of Korea": {
    match: "ofc-seoul-media-institute-of-technology",
    reason: "Same name with an 'MoU-' prefix.",
  },
  "Norwegian University of Science and Technology, Ålesund, Norway (Amendment)": {
    match: "ofc-norwegian-university-of-science-and-technology-ntnu-alesund",
    reason: "Same university (amendment).",
  },
  "The Pennsylvania State University, Penn State Dickinson Law": {
    match: "ofc-the-pennsylvania-state-university",
    reason: "A school of the university.",
  },
  "RENEWAL:Iowa State University of Science and Technology": {
    match: "ofc-iowa-state-university-of-science-and-technology",
    reason: "Same university (renewal).",
  },
  "RENEWAL:University of Malta": { match: "ofc-university-of-malta", reason: "Same university (renewal)." },
  "Cranfield University, United Kingdom": { match: "ofc-cranfield-university", reason: "Same university." },
  "Hochschule Bremen-City University of Applied Sciences (HSB), Germany": {
    match: "ofc-hochschule-bremen-city-university-of-applied-sciences",
    reason: "Same university.",
  },

  // New universities.
  "Chiang Mai University Thailand": chiangMai,
  "Chian Mai University Thailand": chiangMai,
  "IC-IMPACTS,University of British Columbia,Canada": icImpacts,
  "IC-IMPACTS Centres of Excellence": icImpacts,
  "Kasetsart University, Thailand": kasetsart,
  "Sinop University, Turkiye": sinop,
  "Sinop University: Erasmus+ Inter-institutional agreement": sinop,
  "Montanuniversitat Leoben Austria": leoben,
  "MoU - Montanuniversitat Leoben Austria": leoben,
  "University of Santo Tomas, Manila, Philippines": santoTomas,
  "University of Bucharest": {
    create: { name: "University of Bucharest", country: "romania" },
    reason: "Country column says Romania in both copies (rows 128 and 133), although those rows have shifted columns.",
  },
  "VIRGINIA COMMONWEALTH UNIVERSITY, USA": {
    create: { name: "VIRGINIA COMMONWEALTH UNIVERSITY, USA", normalizedName: "Virginia Commonwealth University", country: "united-states" },
    reason: "Name states USA.",
  },
  "Institute of Management Accountants, USA": {
    create: { name: "Institute of Management Accountants, USA", normalizedName: "Institute of Management Accountants", country: "united-states" },
    reason: "Name states USA.",
  },

  // No country recorded.
  "The International Association for the Exchange of Students for Technical Experience (IAESTE)": NO_COUNTRY(
    "Global student-exchange organisation (country recorded as 'Global').",
  ),
  "Apply Erasmus Computing Cluster": NO_COUNTRY("Multi-country Erasmus cluster (country recorded as 'MultiCountry')."),
  "Apply Erasmus Computing Cluster, MultiCountry": NO_COUNTRY("Multi-country Erasmus cluster."),
  "Erasmus EASTACA": NO_COUNTRY("Erasmus project; the partner institution is not named."),
  "University of Bari Aldo Moro": NO_COUNTRY("University named without a country."),
  "n+i” Network of Engineering Institutes, Paris France": {
    unresolved: "A network of institutes with a MoU link but no row in the MoU list; not added as a university.",
  },

  // Processing sheet only.
  "Southern Cross University, Australia [signing authority not from SCU but from SCG]": PIPELINE_ONLY,
  "University of Sussesx, UK": PIPELINE_ONLY,
  "Université de Lille' France": PIPELINE_ONLY,
  "Project AUSM (Australian University School Mentorship Program)": PIPELINE_ONLY,
  "Erasmus Funding Project": PIPELINE_ONLY,

  // National partners in the processing sheet.
  "Sri Karan Narendra Agriculture University, Jobner, Jaipur": NATIONAL,
  "Maharashtra National Law University’ (MNLU), Mumbai.": NATIONAL,
  "Bharathiar University- Nanoscience & Technology Department, Coimbatore": NATIONAL,
  "Gujarat National Law University (GNLU), Gujrat": NATIONAL,
  "Global Academy of Law-Tech Education and Research (GALTER), Hyderabad": NATIONAL,
  "Indian Institute of Science Education and Research (IISER)_Kolkata": NATIONAL,
  "Sardar Patel University of Police Security and Criminal Justice Jodhpur": NATIONAL,
  "AIESEC ((International Association of Students in Economics and Business)": NATIONAL,
  "UGC-MMTTC, JAI Narain Vyas University Jodhpur, Rajasthan": NATIONAL,
  "Kamala Nehru College, University of Delhi": NATIONAL,
  "NATIONAL INSTITUTE OF DESIGN, ASSAM": NATIONAL,
  "CSIR Pilani": NATIONAL,
  "Jaipuria Institute of Management": NATIONAL,
  "Rajasthan Olive Cultivation Limited (ROCL)": NATIONAL,

  // Section labels.
  Renewals: { heading: "Section label: the rows below it track renewals." },
  Activity: { heading: "Section label, not a partner." },
};

/** Decisions for one worksheet row, by import key, when the name cell alone is not enough. */
export const rowDecisions: Record<string, InstitutionDecision> = {
  "mou-list:94": {
    ...mongkut,
    reason:
      "The name cell holds only 'a'; the reference (DoIC/MoU/Thailand/Mongkut) and the partner's kmutnb.ac.th email identify King Mongkut's University of Technology North Bangkok.",
  },
};

/**
 * MoU list rows whose agreement pairing was reviewed: an existing agreement
 * code, or "new" for a separate agreement.
 */
export const agreementDecisions: Record<number, string> = {
  // The official page lists Ostrava twice (ic-077, ic-078) and the register
  // has two agreements with the same nodal officer; row 22 pairs with ic-077
  // by title, so the Student Exchange Agreement is the other official row.
  23: "ic-078",
  // The official page lists each of these partners once; the register adds a
  // later MoA under the same name. The official row is the original MoU and
  // the MoA is recorded as its own agreement.
  111: "ic-098",
  112: "new",
  115: "ic-046",
  116: "new",
};
