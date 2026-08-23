import * as a from "valibot"

const forgejoOrganizationTeamSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  name: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  permission: a.optional(a.nullable(a.string())),
  units: a.optional(a.nullable(a.array(a.string()))),
  units_map: a.optional(a.nullable(a.record(a.string(), a.string()))),
  can_create_org_repo: a.optional(a.nullable(a.boolean())),
  includes_all_repositories: a.optional(a.nullable(a.boolean())),
  organization: a.optional(a.nullable(a.unknown())),
})

export { forgejoOrganizationTeamSchema }
export type ForgejoOrganizationTeam = a.InferOutput<typeof forgejoOrganizationTeamSchema>
