/**
 * Joins and derived fields shared by the repository modules.
 *
 * These functions stand in for the SQL joins a database would perform. They
 * never create a relationship that is not stored as a row in the dataset.
 */

import { daysBetween } from "@/lib/internal/dates";
import type { Dataset } from "@/lib/internal/data/dataset";
import {
  deriveActivityStatus,
  deriveAgreementStatus,
  deriveOpportunityStatus,
  derivePartnershipStatus,
} from "@/lib/internal/status";
import type {
  Activity,
  ActivityView,
  Agreement,
  AgreementView,
  DocumentLinkView,
  DocumentRecord,
  DocumentView,
  Institution,
  InstitutionView,
  Opportunity,
  OpportunityView,
  Program,
  ProgramAvailability,
  ProgramAvailabilityView,
  ProgramType,
} from "@/lib/internal/types";

function indexById<T extends { id: string }>(rows: readonly T[], entity: string) {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (map.has(row.id)) throw new Error(`Duplicate ${entity} id: ${row.id}`);
    map.set(row.id, row);
  }
  return map;
}

export function createViews(data: Dataset) {
  const institutionsById = indexById(data.institutions, "institution");
  const agreementsById = indexById(data.agreements, "agreement");
  const programsById = indexById(data.programs, "program");
  const availabilityById = indexById(data.availability, "availability");

  function findInstitution(id: string | null) {
    return id ? (institutionsById.get(id) ?? null) : null;
  }

  function findAgreement(id: string | null) {
    return id ? (agreementsById.get(id) ?? null) : null;
  }

  function findProgram(id: ProgramType): Program {
    const program = programsById.get(id);
    if (!program) throw new Error(`Unknown program id: ${id}`);
    return program;
  }

  function findAvailability(id: string | null) {
    return id ? (availabilityById.get(id) ?? null) : null;
  }

  function toAgreementView(agreement: Agreement, today: string): AgreementView {
    const status = deriveAgreementStatus(agreement, today);
    const tracksExpiry = status === "active" || status === "expiring-soon" || status === "expired";
    return {
      ...agreement,
      status,
      daysToExpiry: tracksExpiry && agreement.endDate ? daysBetween(today, agreement.endDate) : null,
      institution: findInstitution(agreement.institutionId),
    };
  }

  function agreementsForInstitution(institutionId: string, today: string) {
    return data.agreements
      .filter((agreement) => agreement.institutionId === institutionId)
      .map((agreement) => toAgreementView(agreement, today));
  }

  function toInstitutionView(institution: Institution, today: string): InstitutionView {
    const agreements = agreementsForInstitution(institution.id, today);
    const live = agreements.filter((a) => a.status === "active" || a.status === "expiring-soon");
    const nextExpiry =
      live
        .map((a) => a.endDate)
        .filter((date): date is string => Boolean(date))
        .sort()[0] ?? null;
    return {
      ...institution,
      partnershipStatus: derivePartnershipStatus(agreements.map((a) => a.status)),
      agreementCount: agreements.length,
      activeAgreementCount: live.length,
      offeringCount: data.availability.filter((o) => o.institutionId === institution.id).length,
      nextExpiry,
    };
  }

  function toAvailabilityView(
    availability: ProgramAvailability,
    today: string,
  ): ProgramAvailabilityView {
    const agreement = findAgreement(availability.agreementId);
    return {
      ...availability,
      program: findProgram(availability.programId),
      institution: findInstitution(availability.institutionId),
      agreement: agreement ? toAgreementView(agreement, today) : null,
    };
  }

  function toOpportunityView(opportunity: Opportunity, today: string): OpportunityView {
    const status = deriveOpportunityStatus(opportunity, today);
    return {
      ...opportunity,
      status,
      daysToDeadline:
        opportunity.deadline &&
        (status === "open" || status === "closing-soon" || status === "upcoming")
          ? daysBetween(today, opportunity.deadline)
          : null,
      program: findProgram(opportunity.programId),
      institution: findInstitution(opportunity.institutionId),
      availability: findAvailability(opportunity.availabilityId),
    };
  }

  function toActivityView(activity: Activity, today: string): ActivityView {
    return {
      ...activity,
      status: deriveActivityStatus(activity, today),
      daysFromToday: daysBetween(today, activity.startDate),
      institution: findInstitution(activity.institutionId),
      agreement: findAgreement(activity.agreementId),
    };
  }

  function availabilityLabel(availability: ProgramAvailability) {
    const program = findProgram(availability.programId);
    const institution = findInstitution(availability.institutionId);
    return institution ? `${program.name} · ${institution.name}` : program.name;
  }

  function toDocumentView(document: DocumentRecord): DocumentView {
    const links: DocumentLinkView[] = [];
    for (const link of data.documentLinks) {
      if (link.documentId !== document.id) continue;
      if (link.institutionId) {
        const institution = findInstitution(link.institutionId);
        if (institution) {
          links.push({
            id: link.id,
            kind: "institution",
            label: institution.name,
            href: `/internal/universities/${institution.id}`,
          });
        }
      } else if (link.agreementId) {
        const agreement = findAgreement(link.agreementId);
        if (agreement) {
          links.push({
            id: link.id,
            kind: "agreement",
            label: agreement.reference,
            href: `/internal/mous/${agreement.id}`,
          });
        }
      } else if (link.availabilityId) {
        const availability = findAvailability(link.availabilityId);
        if (availability) {
          links.push({
            id: link.id,
            kind: "availability",
            label: availabilityLabel(availability),
            href: `/internal/programs/${availability.id}`,
          });
        }
      } else if (link.programId) {
        const program = programsById.get(link.programId);
        if (program) {
          links.push({
            id: link.id,
            kind: "program",
            label: program.name,
            href: `/internal/programs?program=${program.id}`,
          });
        }
      }
    }
    return { ...document, links };
  }

  function documentsLinkedTo(target: {
    institutionId?: string;
    agreementId?: string;
    programId?: ProgramType;
    availabilityId?: string;
  }) {
    const ids = new Set(
      data.documentLinks
        .filter(
          (link) =>
            (target.institutionId && link.institutionId === target.institutionId) ||
            (target.agreementId && link.agreementId === target.agreementId) ||
            (target.programId && link.programId === target.programId) ||
            (target.availabilityId && link.availabilityId === target.availabilityId),
        )
        .map((link) => link.documentId),
    );
    return data.documents.filter((doc) => ids.has(doc.id)).map(toDocumentView);
  }

  return {
    data,
    findInstitution,
    findAgreement,
    findProgram,
    findAvailability,
    toAgreementView,
    agreementsForInstitution,
    toInstitutionView,
    toAvailabilityView,
    toOpportunityView,
    toActivityView,
    toDocumentView,
    documentsLinkedTo,
  };
}

export type Views = ReturnType<typeof createViews>;
