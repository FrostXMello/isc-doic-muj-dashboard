/**
 * QS World University Rankings 2027 for institutions on the MoUs list.
 *
 * Source: QS World University Rankings 2027, published 18 June 2026
 * (topuniversities.com rankings endpoint nid 4153156, 1,504 institutions).
 * Matched to MUJ institution ids by reviewed name identity. A parent
 * university's rank is not applied to a branch campus. Partners absent from
 * this table are omitted and shown as not ranked.
 * Rank strings keep QS band notation (e.g. "801-850", "1401+") and omit a
 * leading "=" so an exact rank stays sortable.
 */

export type Qs2027Entry = {
  /** Rank or band as published by QS (e.g. "56", "801-850", "1401+"). */
  rank: string;
  /** Institution name as listed in the QS 2027 table. */
  qsName: string;
};

export const QS_RANKINGS_YEAR = 2027 as const;

/** institution id → QS 2027 entry (edition published 18 June 2026). */
export const qsRankings2027ByInstitutionId: Readonly<Record<string, Qs2027Entry>> = {
  "dir-university-of-newcastle": { rank: "244", qsName: "The University of Newcastle, Australia (UON)" },
  "ofc-aix-marseille-university": { rank: "443", qsName: "Aix-Marseille University" },
  "ofc-ajman-university": { rank: "397", qsName: "Ajman University" },
  "ofc-al-farabi-kazakh-national-university": { rank: "177", qsName: "Farabi University (former Al - Farabi Kazakh National University)" },
  "ofc-auckland-university-of-technology": { rank: "431", qsName: "Auckland University of Technology (AUT)" },
  "ofc-bauman-moscow-state-technical-university": { rank: "318", qsName: "Bauman Moscow State Technical University" },
  "ofc-binus-university": { rank: "901-950", qsName: "Bina Nusantara University (BINUS)" },
  "ofc-charles-sturt-university": { rank: "951-1000", qsName: "Charles Sturt University" },
  "ofc-curtin-university": { rank: "189", qsName: "Curtin University" },
  "ofc-czech-technical-university-in-prague": { rank: "432", qsName: "Czech Technical University in Prague" },
  "ofc-deakin-university": { rank: "227", qsName: "Deakin University" },
  "ofc-florida-international-university": { rank: "659", qsName: "Florida International University (FIU)" },
  "ofc-gdansk-university": { rank: "901-950", qsName: "University of Gdańsk" },
  "ofc-iowa-state-university-of-science-and-technology": { rank: "540", qsName: "Iowa State University" },
  "ofc-itmo-university": { rank: "801-850", qsName: "ITMO University" },
  "ofc-king-mongkuts-university-of-technology": { rank: "1401+", qsName: "King Mongkut's University of Technology North Bangkok (KMUTNB)" },
  "ofc-la-trobe-university": { rank: "241", qsName: "La Trobe University" },
  "ofc-national-technical-university-of-ukraine-igor-sikorsky-kyiv-polytechnic-institute": { rank: "851-900", qsName: "National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"" },
  "ofc-national-university-of-uzbekistan": { rank: "801-850", qsName: "National University of Uzbekistan named after Mirzo Ulugbek" },
  "ofc-norwegian-university-of-science-and-technology-ntnu-alesund": { rank: "264", qsName: "Norwegian University of Science And Technology" },
  "ofc-nottingham-trent-university": { rank: "639", qsName: "Nottingham Trent University" },
  "ofc-plymouth-university": { rank: "691", qsName: "University of Plymouth" },
  "ofc-prince-sultan-university": { rank: "488", qsName: "Prince Sultan University" },
  "ofc-samara-national-research-university": { rank: "1201-1400", qsName: "Samara National Research University (Samara University)" },
  "ofc-siberian-federal-university": { rank: "1001-1200", qsName: "Siberian Federal University, SibFU" },
  "ofc-southern-federal-university": { rank: "1001-1200", qsName: "Southern Federal University" },
  "ofc-sunway-university": { rank: "354", qsName: "Sunway University" },
  "ofc-tashkent-state-university-of-economics": { rank: "1201-1400", qsName: "Tashkent State University of Economics" },
  "ofc-taylors-university": { rank: "272", qsName: "Taylor's University" },
  "ofc-the-pennsylvania-state-university": { rank: "92", qsName: "Pennsylvania State University" },
  "ofc-the-university-of-melbourne": { rank: "22", qsName: "The University of Melbourne" },
  "ofc-the-university-of-queensland": { rank: "40", qsName: "The University of Queensland" },
  "ofc-tomsk-state-university": { rank: "510", qsName: "Tomsk State University" },
  "ofc-universiti-malaya": { rank: "56", qsName: "Universiti Malaya (UM)" },
  "ofc-universiti-malaysia-pahang": { rank: "588", qsName: "Universiti Malaysia Pahang Al-Sultan Abdullah (UMPSA)" },
  "ofc-universiti-teknologi-petronas": { rank: "261", qsName: "Universiti Teknologi PETRONAS (UTP)" },
  "ofc-university-of-calabria": { rank: "851-900", qsName: "University of Calabria" },
  "ofc-university-of-crete": { rank: "649", qsName: "University of Crete" },
  "ofc-university-of-denver": { rank: "1001-1200", qsName: "University of Denver" },
  "ofc-university-of-florida": { rank: "228", qsName: "University of Florida" },
  "ofc-university-of-galway": { rank: "275", qsName: "University of Galway" },
  "ofc-university-of-johannesburg": { rank: "292", qsName: "University of Johannesburg" },
  "ofc-university-of-kwazulu-natal": { rank: "600", qsName: "University of Kwazulu-Natal" },
  "ofc-university-of-leicester": { rank: "314", qsName: "University of Leicester" },
  "ofc-university-of-malta": { rank: "696", qsName: "University of Malta" },
  "ofc-university-of-missouri-kansas-city-umkc": { rank: "1201-1400", qsName: "University of Missouri, Kansas City" },
  "ofc-university-of-ostrava": { rank: "1201-1400", qsName: "University of Ostrava" },
  "ofc-university-of-south-wales": { rank: "1201-1400", qsName: "University of South Wales" },
  "ofc-university-of-strathclyde": { rank: "230", qsName: "University of Strathclyde" },
  "ofc-university-of-tyumen": { rank: "1401+", qsName: "University of Tyumen" },
  "ofc-university-of-western-australia": { rank: "77", qsName: "The University of Western Australia" },
  "ofc-west-university-of-timisoara": { rank: "1201-1400", qsName: "Universitatea de Vest din Timisoara / West University of Timisoara" },
  // Earlier directory names (not on the official partner page) when they are the same institution QS ranked in 2027.
  // Branch campuses and ambiguous systems are omitted: Curtin Malaysia, Wollongong in Dubai, Middlesex University Dubai, University of Massachusetts.
  "dir-boston-university": { rank: "94", qsName: "Boston University" },
  "dir-lancaster-university": { rank: "164", qsName: "Lancaster University" },
  "dir-lmu-munich": { rank: "61", qsName: "Ludwig-Maximilians-Universität München" },
  "dir-macquarie-university": { rank: "126", qsName: "Macquarie University (Sydney, Australia)" },
  "dir-national-university-of-singapore": { rank: "10", qsName: "National University of Singapore (NUS)" },
  "dir-sciences-po": { rank: "354", qsName: "Sciences Po" },
  "dir-singapore-management-university": { rank: "411", qsName: "Singapore Management University" },
  "dir-technical-university-of-munich": { rank: "25", qsName: "Technical University of Munich" },
  "dir-university-of-amsterdam": { rank: "60", qsName: "University of Amsterdam" },
  "dir-university-of-birmingham": { rank: "68", qsName: "University of Birmingham" },
  "dir-university-of-toronto": { rank: "32", qsName: "University of Toronto" },
  "dir-waseda-university": { rank: "201", qsName: "Waseda University" },
  "dir-yonsei-university": { rank: "42", qsName: "Yonsei University" },
};

export function qs2027ForInstitution(institutionId: string): Qs2027Entry | null {
  return qsRankings2027ByInstitutionId[institutionId] ?? null;
}

/** Numeric sort key: exact rank, or the low end of a band; unranked last. */
export function qsRankSortKey(rank: string | null | undefined): number {
  if (!rank) return Number.POSITIVE_INFINITY;
  const text = rank.trim();
  const exact = Number.parseInt(text, 10);
  if (String(exact) === text) return exact;
  const band = /^(\d+)\s*-\s*(\d+)$/.exec(text);
  if (band) return Number.parseInt(band[1], 10);
  const plus = /^(\d+)\+$/.exec(text);
  if (plus) return Number.parseInt(plus[1], 10);
  return Number.POSITIVE_INFINITY;
}

/** Non-overlapping bands. "Any QS 2027 rank" is the unfiltered default, so a separate "ranked" option is not offered. */
export const qsRankingBands = ["top-100", "101-500", "501-1000", "1001-plus", "unranked"] as const;
export type QsRankingBand = (typeof qsRankingBands)[number];

export const qsRankingBandLabel: Record<QsRankingBand, string> = {
  "top-100": "Top 100",
  "101-500": "101–500",
  "501-1000": "501–1000",
  "1001-plus": "1001+",
  unranked: "Not in QS 2027",
};

export function qsRankingBand(rank: string | null | undefined): Exclude<QsRankingBand, "unranked"> | null {
  const key = qsRankSortKey(rank);
  if (!Number.isFinite(key)) return null;
  if (key <= 100) return "top-100";
  if (key <= 500) return "101-500";
  if (key <= 1000) return "501-1000";
  return "1001-plus";
}

export function matchesQsRankingBand(rank: string | null | undefined, band: QsRankingBand): boolean {
  if (band === "unranked") return qsRankingBand(rank) === null;
  return qsRankingBand(rank) === band;
}
