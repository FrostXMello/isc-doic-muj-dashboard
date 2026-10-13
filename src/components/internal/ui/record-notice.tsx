import { SuccessNotice } from "@/components/internal/forms/form-fields";
import { readParam, type SearchParamsRecord } from "@/lib/internal/query";

const notices: Record<string, string> = {
  "programme-created": "Programme added.",
  "programme-updated": "Programme saved.",
  "programme-deleted": "Programme deleted.",
  "offering-created": "Offering added.",
  "offering-updated": "Offering saved.",
  "offering-deleted": "Offering deleted.",
  "call-created": "Call added.",
  "call-updated": "Call saved.",
  "call-deleted": "Call deleted.",
  "activity-created": "Activity logged.",
  "activity-updated": "Activity saved.",
  "activity-deleted": "Activity deleted.",
  "document-created": "Document added. You can upload its file below.",
  "document-updated": "Document saved.",
  "document-deleted": "Document and its stored files deleted.",
  "document-deleted-files-kept":
    "Document deleted. Its stored files could not be removed; a Super admin can clear them from storage.",
  "record-archived": "Archived. It no longer counts as active and can be restored at any time.",
  "record-restored": "Restored.",
  "settings-saved": "Settings saved.",
};

/** Confirmation after a redirecting write (`?notice=` key); unknown keys show nothing. */
export function RecordNotice({ query }: { query: SearchParamsRecord }) {
  const text = notices[readParam(query, "notice") ?? ""];
  return text ? <SuccessNotice>{text}</SuccessNotice> : null;
}
