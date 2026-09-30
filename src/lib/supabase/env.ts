/**
 * Public Supabase connection settings. Both values are safe to expose to the
 * browser; access is enforced by row level security, not by the key.
 *
 * The publishable key (`sb_publishable_…`) is the current Supabase naming;
 * the legacy anon key is accepted as a fallback. A service-role or secret key
 * must never be used here.
 */
export type SupabasePublicEnv = { url: string; key: string };

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}
