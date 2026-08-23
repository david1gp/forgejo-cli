import * as a from "valibot"

const forgejoOrganizationSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  name: a.optional(a.nullable(a.string())),
  username: a.optional(a.nullable(a.string())),
  full_name: a.optional(a.nullable(a.string())),
  avatar_url: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  website: a.optional(a.nullable(a.string())),
  email: a.optional(a.nullable(a.string())),
  location: a.optional(a.nullable(a.string())),
  visibility: a.optional(a.nullable(a.string())),
  repo_admin_change_team_access: a.optional(a.nullable(a.boolean())),
})

export { forgejoOrganizationSchema }
export type ForgejoOrganization = a.InferOutput<typeof forgejoOrganizationSchema>
