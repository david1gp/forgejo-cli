import * as a from "valibot"

const forgejoOrganizationMembersListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  publicOnly: a.optional(a.boolean()),
})

export { forgejoOrganizationMembersListOptionsSchema }
export type ForgejoOrganizationMembersListOptions = a.InferOutput<typeof forgejoOrganizationMembersListOptionsSchema>
