/**
 * Converts Date objects to ISO strings so Zod schemas (which expect strings for date fields)
 * can parse DB results without errors.
 */
export function serializeDates<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}
