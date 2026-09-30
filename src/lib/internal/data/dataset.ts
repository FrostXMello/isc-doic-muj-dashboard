import { activitySeed } from "@/lib/internal/data/seed/activities";
import { agreementSeed } from "@/lib/internal/data/seed/agreements";
import { documentLinkSeed, documentSeed } from "@/lib/internal/data/seed/documents";
import { institutionSeed } from "@/lib/internal/data/seed/institutions";
import { opportunitySeed } from "@/lib/internal/data/seed/opportunities";
import { availabilitySeed, programSeed } from "@/lib/internal/data/seed/programs";
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

/** The typed seed modules in ./seed — the default source. */
export const staticDataset: Dataset = {
  institutions: institutionSeed,
  agreements: agreementSeed,
  programs: programSeed,
  availability: availabilitySeed,
  opportunities: opportunitySeed,
  documents: documentSeed,
  documentLinks: documentLinkSeed,
  activities: activitySeed,
};
