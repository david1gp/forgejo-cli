import * as a from "valibot"

const forgejoOrganizationTeamCreateOptionsSchema = a.object({
  name: a.pipe(a.string(), a.trim(), a.minLength(1)),
  description: a.optional(a.nullable(a.string())),
  readPermissions: a.optional(a.string()),
  writePermissions: a.optional(a.string()),
  canCreateRepos: a.optional(a.boolean()),
  includeAllRepos: a.optional(a.boolean()),
  admin: a.optional(a.boolean()),
})

export { forgejoOrganizationTeamCreateOptionsSchema }
export type ForgejoOrganizationTeamCreateOptions = a.InferOutput<typeof forgejoOrganizationTeamCreateOptionsSchema>
