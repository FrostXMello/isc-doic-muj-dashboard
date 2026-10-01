import { activitySeed } from "@/lib/internal/data/seed/activities";
import { agreementSeed } from "@/lib/internal/data/seed/agreements";
import { documentLinkSeed, documentSeed } from "@/lib/internal/data/seed/documents";
import {
  legacyDirectoryInstitutions,
  sampleInstitutions,
} from "@/lib/internal/data/seed/institutions";
import { opportunitySeed } from "@/lib/internal/data/seed/opportunities";
import { availabilitySeed } from "@/lib/internal/data/seed/programs";
import {
  officialActivities,
  officialAvailability,
  officialDocumentLinks,
  officialDocuments,
  officialOpportunities,
  officialPrograms,
} from "@/lib/official/internationalization";
import { officialAgreementRecords, officialInstitutionRecords } from "@/lib/official/records";
import type {
  Activity,
  Agreement,
  DocumentLink,
  DocumentRecord,
  Institution,
  Opportunity,
  Program,
  ProgramAvailability,
} from "@/lib/internal/types";

/** Every row the repository layer can see for the current request. */
export type Dataset = {
  institutions: readonly Institution[];
  agreements: readonly Agreement[];
  programs: readonly Program[];
  availability: readonly ProgramAvailability[];
  opportunities: readonly Opportunity[];
  documents: readonly DocumentRecord[];
  documentLinks: readonly DocumentLink[];
  activities: readonly Activity[];
};

/** Official MUJ records plus earlier directory names kept for review. */
export const officialDataset: Dataset = {
  institutions: [...officialInstitutionRecords, ...legacyDirectoryInstitutions],
  agreements: officialAgreementRecords,
  programs: officialPrograms,
  availability: officialAvailability,
  opportunities: officialOpportunities,
  documents: officialDocuments,
  documentLinks: officialDocumentLinks,
  activities: officialActivities,
};

/** Fictional rows for demonstrating the workflow (INTERNAL_SAMPLE_DATA=true). */
export const sampleDataset: Omit<Dataset, "programs"> = {
  institutions: sampleInstitutions,
  agreements: agreementSeed,
  availability: availabilitySeed,
  opportunities: opportunitySeed,
  documents: documentSeed,
  documentLinks: documentLinkSeed,
  activities: activitySeed,
};

/**
 * Sample rows are off unless INTERNAL_SAMPLE_DATA is exactly "true", and never
 * on the Vercel production deployment, whatever the variable says.
 */
export function sampleDataEnabled() {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.INTERNAL_SAMPLE_DATA === "true";
}

function byId<T extends { id: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * Orders every entity by id so list ties and unsorted panels come out the
 * same whichever source produced the rows. Programmes keep their curated order.
 */
export function canonicalDataset(data: Dataset): Dataset {
  return {
    institutions: byId(data.institutions),
    agreements: byId(data.agreements),
    programs: data.programs,
    availability: byId(data.availability),
    opportunities: byId(data.opportunities),
    documents: byId(data.documents),
    documentLinks: byId(data.documentLinks),
    activities: byId(data.activities),
  };
}

export function staticDataset(includeSamples = sampleDataEnabled()): Dataset {
  if (!includeSamples) return officialDataset;
  return {
    institutions: [...officialDataset.institutions, ...sampleDataset.institutions],
    agreements: [...officialDataset.agreements, ...sampleDataset.agreements],
    programs: officialDataset.programs,
    availability: [...officialDataset.availability, ...sampleDataset.availability],
    opportunities: [...officialDataset.opportunities, ...sampleDataset.opportunities],
    documents: [...officialDataset.documents, ...sampleDataset.documents],
    documentLinks: [...officialDataset.documentLinks, ...sampleDataset.documentLinks],
    activities: [...officialDataset.activities, ...sampleDataset.activities],
  };
}
