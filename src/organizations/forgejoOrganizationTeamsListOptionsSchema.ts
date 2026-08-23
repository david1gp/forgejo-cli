import * as a from "valibot"

const forgejoOrganizationTeamsListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoOrganizationTeamsListOptionsSchema }
export type ForgejoOrganizationTeamsListOptions = a.InferOutput<typeof forgejoOrganizationTeamsListOptionsSchema>
