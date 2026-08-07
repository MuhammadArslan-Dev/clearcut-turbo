/**
 * Hierarchical query-key factory convention (the pattern documented at
 * https://tkdodo.eu/blog/effective-react-query-keys). This package only
 * provides the builder — each app defines its own scoped keys, e.g.:
 *
 *   export const courseKeys = createQueryKeys("courses");
 *   courseKeys.list({ examId })   // ["courses", "list", { examId }]
 *   courseKeys.detail(courseId)   // ["courses", "detail", courseId]
 *
 * Hierarchical keys let you invalidate broadly (`courseKeys.all`) or
 * narrowly (`courseKeys.detail(id)`) without hand-maintaining key arrays
 * at every call site.
 */
export function createQueryKeys<Scope extends string>(scope: Scope) {
  return {
    all: [scope] as const,
    lists: () => [scope, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [scope, "list", filters ?? {}] as const,
    details: () => [scope, "detail"] as const,
    detail: (id: string | number) => [scope, "detail", id] as const,
  };
}
