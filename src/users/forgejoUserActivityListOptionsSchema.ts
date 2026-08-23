import * as a from "valibot"

const forgejoUserActivityListOptionsSchema = a.object({
  onlyPerformedBy: a.optional(a.boolean()),
  date: a.optional(a.string()),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoUserActivityListOptionsSchema }
export type ForgejoUserActivityListOptions = a.InferOutput<typeof forgejoUserActivityListOptionsSchema>
