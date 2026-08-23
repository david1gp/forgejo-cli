import * as a from "valibot"

const forgejoReleaseListOptionsSchema = a.object({
  q: a.optional(a.string()),
  preRelease: a.optional(a.boolean()),
  draft: a.optional(a.boolean()),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoReleaseListOptionsSchema }
export type ForgejoReleaseListOptions = a.InferOutput<typeof forgejoReleaseListOptionsSchema>
