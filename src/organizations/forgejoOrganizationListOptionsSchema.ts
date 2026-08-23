import * as a from "valibot"

const forgejoOrganizationListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  onlyMemberOf: a.optional(a.boolean()),
})

export { forgejoOrganizationListOptionsSchema }
export type ForgejoOrganizationListOptions = a.InferOutput<typeof forgejoOrganizationListOptionsSchema>
