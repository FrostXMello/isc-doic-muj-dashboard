export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export type SearchParamsProp = { searchParams: Promise<SearchParamsRecord> };

export type IdParamsProp = { params: Promise<{ id: string }> };

/** First value of a query parameter, trimmed. Empty strings become undefined. */
export function readParam(params: SearchParamsRecord, key: string) {
  const raw = params[key];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? value : undefined;
}

/** Reads a parameter and keeps it only when it is one of the allowed values. */
export function readEnumParam<T extends string>(
  params: SearchParamsRecord,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = readParam(params, key);
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function hasActiveFilters(params: SearchParamsRecord, keys: readonly string[]) {
  return keys.some((key) => readParam(params, key) !== undefined);
}
