import * as a from "valibot"

const forgejoUserRepositoriesListOptionsSchema = a.object({
  starred: a.optional(a.boolean()),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  sort: a.optional(a.picklist(["name", "created", "updated", "size", "id"] as const)),
  order: a.optional(a.picklist(["asc", "desc"] as const)),
})

export { forgejoUserRepositoriesListOptionsSchema }
export type ForgejoUserRepositoriesListOptions = a.InferOutput<typeof forgejoUserRepositoriesListOptionsSchema>
