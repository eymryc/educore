/**
 * Mapping léger entre champs formulaires UI (souvent camelCase / FR)
 * et payloads API (snake_case).
 */
export function toSnakeCaseKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

export function mapFormToApi(
  values: Record<string, string | boolean | number | null | undefined>,
  aliases: Record<string, string> = {}
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === "" || value === undefined) continue;
    const apiKey = aliases[key] ?? toSnakeCaseKey(key);
    payload[apiKey] = value;
  }

  return payload;
}

export function firstFieldError(
  errors: Record<string, string[]> | undefined,
  field: string
): string | undefined {
  return errors?.[field]?.[0];
}
