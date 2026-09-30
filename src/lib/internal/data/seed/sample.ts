/**
 * Provenance shared by every SAMPLE row. Sample rows are fictional, only
 * loaded when INTERNAL_SAMPLE_DATA=true, and never shown on the public site.
 */
export const SAMPLE = {
  source: "sample",
  sourceUrl: null,
  sourceTitle: null,
  sourceCheckedOn: null,
  verification: "unverified",
} as const;
