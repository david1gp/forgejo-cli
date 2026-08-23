import * as a from "valibot"

const forgejoOrganizationTeamMembersListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoOrganizationTeamMembersListOptionsSchema }
export type ForgejoOrganizationTeamMembersListOptions = a.InferOutput<
  typeof forgejoOrganizationTeamMembersListOptionsSchema
>
