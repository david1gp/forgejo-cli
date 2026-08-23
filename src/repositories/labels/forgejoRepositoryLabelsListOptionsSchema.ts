import * as a from "valibot"

const forgejoRepositoryLabelsListOptionsSchema = a.object({
  includeArchived: a.optional(a.boolean()),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoRepositoryLabelsListOptionsSchema }
export type ForgejoRepositoryLabelsListOptions = a.InferOutput<typeof forgejoRepositoryLabelsListOptionsSchema>
