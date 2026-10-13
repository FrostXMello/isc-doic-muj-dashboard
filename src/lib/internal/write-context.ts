import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth/session";
import { resolveInternalDataSource } from "@/lib/internal/data/source";
import { can, type Permission } from "@/lib/internal/permissions";
import { formValues, type RecordFormState } from "@/lib/internal/record-forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Shared plumbing for record server actions. Kept out of the "use server"
 * modules so none of it is callable as an action.
 *
 * Writes run through the signed-in user's own Supabase session, so row level
 * security is the real boundary; the permission check here only gives a
 * clear message before the round trip.
 */

export const notPermitted: RecordFormState = { error: "Your role can't make this change." };
export const unavailable: RecordFormState = {
  error: "Editing needs the Supabase data source, which isn't configured here.",
};
export const tryAgain: RecordFormState = { error: "Couldn't save the change. Please try again." };

export type PgError = { code?: string; message?: string } | null;

export type Writable = { supabase: SupabaseClient; userId: string };

export async function writableClient(permission: Permission): Promise<Writable | RecordFormState> {
  if (resolveInternalDataSource() !== "supabase") return unavailable;
  const auth = await getAuthContext();
  if (auth.state !== "signed-in" || !can(auth.roles, permission)) return notPermitted;
  const supabase = await createSupabaseServerClient();
  return supabase ? { supabase, userId: auth.userId } : unavailable;
}

export function isState(value: unknown): value is RecordFormState {
  return typeof value === "object" && value !== null && !("supabase" in value);
}

export function withValues(state: RecordFormState, formData: FormData): RecordFormState {
  return { ...state, values: formValues(formData) };
}

/** Every page under /internal reads the same dataset, so refresh them all (counts, lists, search). */
export function refreshPortal() {
  revalidatePath("/internal", "layout");
}

/** Maps common Postgres errors to a form message; null when the caller should handle it. */
export function commonError(error: NonNullable<PgError>): RecordFormState | null {
  if (error.code === "42501") return notPermitted;
  if (error.code === "23503") {
    return { error: "Other records still depend on this one. Remove or move those links first, or archive it instead." };
  }
  if (error.code === "23514") return { error: "One of the values isn't allowed. Check the dates and links." };
  return null;
}
