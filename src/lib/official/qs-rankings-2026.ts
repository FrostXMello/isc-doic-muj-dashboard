/**
 * QS World University Rankings 2026 for official partner institutions.
 *
 * Source: QS World University Rankings 2026 (published 19 June 2025).
 * Matched to MUJ partner ids by reviewed name + country; partners not in
 * the 2026 table are omitted (shown as not ranked).
 * Rank strings keep QS band notation (e.g. "801-850").
 */

export type Qs2026Entry = {
  /** Rank or band as published by QS (e.g. "58", "801-850"). */
  rank: string;
  /** Institution name as listed in the QS 2026 table. */
  qsName: string;
};

export const QS_RANKINGS_YEAR = 2026 as const;

/** institution id → QS 2026 entry. */
export const qsRankings2026ByInstitutionId: Readonly<Record<string, Qs2026Entry>> = {
  "dir-university-of-newcastle": { rank: "227", qsName: "The University of Newcastle" },
  "ofc-aix-marseille-university": { rank: "428", qsName: "Aix-Marseille University" },
  "ofc-ajman-university": { rank: "440", qsName: "Ajman University" },
  "ofc-al-farabi-kazakh-national-university": { rank: "166", qsName: "Al-Farabi Kazakh National University" },
  "ofc-auckland-university-of-technology": { rank: "410", qsName: "Auckland University of Technology" },
  "ofc-bauman-moscow-state-technical-university": { rank: "320", qsName: "Bauman Moscow State Technical University" },
  "ofc-binus-university": { rank: "851-900", qsName: "BINUS UNIVERSITY (Bina Nusantara University)" },
  "ofc-charles-sturt-university": { rank: "951-1000", qsName: "Charles Sturt University" },
  "ofc-curtin-university": { rank: "183", qsName: "Curtin University" },
  "ofc-czech-technical-university-in-prague": { rank: "416", qsName: "Czech Technical University In Prague" },
  "ofc-deakin-university": { rank: "207", qsName: "Deakin University" },
  "ofc-florida-international-university": { rank: "582", qsName: "Florida International University" },
  "ofc-gdansk-university": { rank: "851-900", qsName: "University of Gdansk" },
  "ofc-iowa-state-university-of-science-and-technology": { rank: "449", qsName: "Iowa State University" },
  "ofc-itmo-university": { rank: "711-720", qsName: "ITMO University" },
  "ofc-king-mongkuts-university-of-technology": { rank: "1201-1400", qsName: "King Mongkut's University of Technology North Bangkok" },
  "ofc-la-trobe-university": { rank: "233", qsName: "La Trobe University" },
  "ofc-national-technical-university-of-ukraine-igor-sikorsky-kyiv-polytechnic-institute": { rank: "801-850", qsName: "National Technical University of Ukraine \"Igor Sikorsky Kyiv Polytechnic Institute\"" },
  "ofc-national-university-of-uzbekistan": { rank: "721-730", qsName: "National University of Uzbekistan" },
  "ofc-norwegian-university-of-science-and-technology-ntnu-alesund": { rank: "267", qsName: "Norwegian University of Science And Technology" },
  "ofc-nottingham-trent-university": { rank: "609", qsName: "Nottingham Trent University" },
  "ofc-plymouth-university": { rank: "613", qsName: "University of Plymouth" },
  "ofc-prince-sultan-university": { rank: "535", qsName: "Prince Sultan University" },
  "ofc-samara-national-research-university": { rank: "1201-1400", qsName: "Samara National Research University (Samara University)" },
  "ofc-siberian-federal-university": { rank: "1001-1200", qsName: "Siberian Federal University" },
  "ofc-southern-federal-university": { rank: "1001-1200", qsName: "Southern Federal University" },
  "ofc-sunway-university": { rank: "410", qsName: "Sunway University" },
  "ofc-tashkent-state-university-of-economics": { rank: "1001-1200", qsName: "Tashkent State University of Economics" },
  "ofc-taylors-university": { rank: "253", qsName: "Taylor's University (Malaysia)" },
  "ofc-the-pennsylvania-state-university": { rank: "82", qsName: "Pennsylvania State University" },
  "ofc-the-university-of-melbourne": { rank: "19", qsName: "The University of Melbourne" },
  "ofc-the-university-of-queensland": { rank: "42", qsName: "The University of Queensland" },
  "ofc-tomsk-state-university": { rank: "499", qsName: "Tomsk State University" },
  "ofc-universiti-malaya": { rank: "58", qsName: "Universiti Malaya (UM)" },
  "ofc-universiti-malaysia-pahang": { rank: "609", qsName: "Universiti Malaysia Pahang Al-Sultan Abdullah (UMPSA)" },
  "ofc-universiti-teknologi-petronas": { rank: "251", qsName: "Universiti Teknologi Petronas (UTP)" },
  "ofc-university-of-calabria": { rank: "951-1000", qsName: "Università della Calabria" },
  "ofc-university-of-crete": { rank: "628", qsName: "University of Crete" },
  "ofc-university-of-denver": { rank: "1001-1200", qsName: "University of Denver" },
  "ofc-university-of-florida": { rank: "212", qsName: "University of Florida" },
  "ofc-university-of-galway": { rank: "284", qsName: "University of Galway / Ollscoil na Gaillimhe" },
  "ofc-university-of-johannesburg": { rank: "308", qsName: "University of Johannesburg" },
  "ofc-university-of-kwazulu-natal": { rank: "558", qsName: "University of Kwazulu-Natal" },
  "ofc-university-of-leicester": { rank: "326", qsName: "University of Leicester" },
  "ofc-university-of-malta": { rank: "741-750", qsName: "University of Malta" },
  "ofc-university-of-missouri-kansas-city-umkc": { rank: "1001-1200", qsName: "University of Missouri, Kansas City" },
  "ofc-university-of-ostrava": { rank: "1201-1400", qsName: "University of Ostrava" },
  "ofc-university-of-strathclyde": { rank: "251", qsName: "University of Strathclyde" },
  "ofc-university-of-tyumen": { rank: "1201-1400", qsName: "University of Tyumen" },
  "ofc-university-of-western-australia": { rank: "77", qsName: "The University of Western Australia" },
  "ofc-west-university-of-timisoara": { rank: "1201-1400", qsName: "West University of Timisoara" },
};

export function qs2026ForInstitution(institutionId: string): Qs2026Entry | null {
  return qsRankings2026ByInstitutionId[institutionId] ?? null;
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

export const qsRankingBands = [
  "top-100",
  "101-500",
  "501-1000",
  "1001-plus",
  "ranked",
  "unranked",
] as const;
export type QsRankingBand = (typeof qsRankingBands)[number];

export const qsRankingBandLabel: Record<QsRankingBand, string> = {
  "top-100": "Top 100",
  "101-500": "101–500",
  "501-1000": "501–1000",
  "1001-plus": "1001+",
  ranked: "Ranked in QS 2026",
  unranked: "Not in QS 2026",
};

export function qsRankingBand(rank: string | null | undefined): Exclude<QsRankingBand, "ranked" | "unranked"> | null {
  const key = qsRankSortKey(rank);
  if (!Number.isFinite(key)) return null;
  if (key <= 100) return "top-100";
  if (key <= 500) return "101-500";
  if (key <= 1000) return "501-1000";
  return "1001-plus";
}

export function matchesQsRankingBand(rank: string | null | undefined, band: QsRankingBand): boolean {
  const has = Boolean(rank && Number.isFinite(qsRankSortKey(rank)));
  if (band === "ranked") return has;
  if (band === "unranked") return !has;
  return qsRankingBand(rank) === band;
}

