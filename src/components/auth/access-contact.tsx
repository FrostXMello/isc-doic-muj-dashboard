import "server-only";
import { loadPortalSettings } from "@/lib/internal/data/portal-settings";

const DEFAULT_CONTACT = "the Directorate of International Collaborations / International Student Cell";

/** Who to ask for access: the administrators' setting, or the built-in office name. */
export async function AccessContact({ lead }: { lead: string }) {
  const settings = await loadPortalSettings();
  const email = settings === "unavailable" ? null : settings.accessContactEmail;
  const note = settings === "unavailable" ? null : settings.accessContactNote;
  return (
    <>
      <p className="mt-3">
        {lead} contact{" "}
        {email ? (
          <a href={`mailto:${email}`} className="text-foreground underline underline-offset-4">
            {email}
          </a>
        ) : (
          DEFAULT_CONTACT
        )}
        .
      </p>
      {note ? <p className="mt-3">{note}</p> : null}
    </>
  );
}
