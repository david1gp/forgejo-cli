import * as a from "valibot"

const forgejoOrganizationLabelsListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  includeArchived: a.optional(a.boolean()),
})

export { forgejoOrganizationLabelsListOptionsSchema }
export type ForgejoOrganizationLabelsListOptions = a.InferOutput<typeof forgejoOrganizationLabelsListOptionsSchema>
