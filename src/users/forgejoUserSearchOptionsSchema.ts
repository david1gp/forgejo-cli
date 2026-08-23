import * as a from "valibot"

const forgejoUserSearchOptionsSchema = a.pipe(
  a.object({
    query: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
    q: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
    page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
    limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
    sort: a.optional(a.string()),
    order: a.optional(a.picklist(["asc", "desc"] as const)),
  }),
  a.check((input) => input.query !== undefined || input.q !== undefined, "A user search query is required"),
)

export { forgejoUserSearchOptionsSchema }
export type ForgejoUserSearchOptions = a.InferOutput<typeof forgejoUserSearchOptionsSchema>
