import * as a from "valibot"

const forgejoRepositoryCommitsListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoRepositoryCommitsListOptionsSchema }
export type ForgejoRepositoryCommitsListOptions = a.InferOutput<typeof forgejoRepositoryCommitsListOptionsSchema>
