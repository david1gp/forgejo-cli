import * as a from "valibot"

const forgejoRepositoryListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  q: a.optional(a.string()),
  sort: a.optional(a.string()),
  order: a.optional(a.picklist(["asc", "desc"] as const)),
  owner: a.optional(a.string()),
  archived: a.optional(a.boolean()),
  private: a.optional(a.boolean()),
  template: a.optional(a.boolean()),
})

export { forgejoRepositoryListOptionsSchema }
export type ForgejoRepositoryListOptions = a.InferOutput<typeof forgejoRepositoryListOptionsSchema>
