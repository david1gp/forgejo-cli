import * as a from "valibot"

const forgejoOrganizationTeamRepositoriesListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoOrganizationTeamRepositoriesListOptionsSchema }
export type ForgejoOrganizationTeamRepositoriesListOptions = a.InferOutput<
  typeof forgejoOrganizationTeamRepositoriesListOptionsSchema
>
