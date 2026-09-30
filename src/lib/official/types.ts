/** Region headings used by the official MUJ International Collaborations page. */
export type OfficialRegion =
  | "Asia"
  | "Europe"
  | "Australia"
  | "Africa"
  | "North America"
  | "South America"
  | "Oceania";

/**
 * How far a record has been checked.
 * - `source-imported`: copied from an official MUJ page; not yet confirmed by DoIC.
 * - `needs-review`: ambiguous, conflicting, or not found on an official page.
 * - `unverified`: entered without a source.
 * - `verified`: confirmed by DoIC staff. Never set by an import.
 */
export type VerificationStatus = "unverified" | "source-imported" | "needs-review" | "verified";

/**
 * Agreement wording distinguished on the official page. `not-stated` means the
 * row names an institution without saying what kind of agreement it is.
 */
export type OfficialAgreementType =
  | "mou"
  | "student-exchange"
  | "agreement-of-cooperation"
  | "addendum"
  | "academic-agreement"
  | "other"
  | "not-stated";

export type OfficialCountry = {
  id: string;
  name: string;
  region: OfficialRegion;
  /** Approximate geographic centre, for the globe only. Not a campus location. */
  lat: number;
  lon: number;
};

export type OfficialInstitution = {
  id: string;
  /** Institution name as displayed on the official page. */
  name: string;
  /** Spelling fixed and trailing country dropped; identity unchanged. */
  normalizedName: string;
  countryId: string;
  /** Only a URL linked from the official page. */
  website: string | null;
  notes: string | null;
};

export type OfficialAgreementRow = {
  id: string;
  reference: string;
  institutionId: string;
  /** Row text exactly as displayed. */
  listedAs: string;
  type: OfficialAgreementType;
  /** Agreement wording quoted from the row, when the row states one. */
  typeLabel: string | null;
  /** Regional heading the row sits under on the official page. */
  sourceRegion: string;
  /** Country heading the row sits under on the official page. */
  sourceCountry: string;
  /** Position in the official table at review time (1-based). */
  sourceRow: number;
  notes: string | null;
};
