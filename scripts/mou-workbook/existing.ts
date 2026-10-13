/**
 * The universities, agreements, and nodal contacts the hosted database holds
 * before the register import. They come from the same modules the seed SQL is
 * generated from; the import SQL re-checks every key against the database and
 * stops if one is missing.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { legacyDirectoryInstitutions } from "@/lib/internal/data/seed/institutions";
import { officialCountries, referenceCountries } from "@/lib/official/countries";
import { officialAgreementRows } from "@/lib/official/partners";
import { officialInstitutionRecords } from "@/lib/official/records";
import type { Existing, ExistingContact } from "./plan";

const CONTACTS_PATH = join(process.cwd(), "data/private/muj-nodal-contacts.json");

type ContactsFile = {
  contacts: { agreementId: string; name: string | null; phone: string | null; email: string | null }[];
};

export function loadExisting(): Existing {
  let contacts: ExistingContact[] = [];
  if (existsSync(CONTACTS_PATH)) {
    const file = JSON.parse(readFileSync(CONTACTS_PATH, "utf8")) as ContactsFile;
    contacts = file.contacts.map((contact) => ({
      code: `nc-${contact.agreementId}`,
      agreementCode: contact.agreementId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    }));
  }
  return {
    institutions: [...officialInstitutionRecords, ...legacyDirectoryInstitutions].map((institution) => ({
      slug: institution.id,
      name: institution.name,
      normalizedName: institution.normalizedName,
      countryId: institution.countryId,
    })),
    agreements: officialAgreementRows.map((row) => ({
      code: row.id,
      institutionSlug: row.institutionId,
      title: row.listedAs,
      type: row.type,
      typeLabel: row.typeLabel,
    })),
    contacts,
    countries: new Set([...officialCountries, ...referenceCountries].map((country) => country.id)),
  };
}
