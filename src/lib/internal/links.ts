/**
 * Agreements (MoUs) live on their lead university's page, opened and
 * scrolled to by id.
 */
export function agreementHref(agreement: { id: string; institutionId: string }) {
  return `/internal/universities/${agreement.institutionId}?agreement=${encodeURIComponent(agreement.id)}#agreement-${agreement.id}`;
}
