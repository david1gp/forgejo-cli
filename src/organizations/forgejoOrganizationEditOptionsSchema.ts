import * as a from "valibot"

const forgejoOrganizationEditOptionsSchema = a.object({
  fullName: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  email: a.optional(a.nullable(a.string())),
  location: a.optional(a.nullable(a.string())),
  website: a.optional(a.nullable(a.string())),
  visibility: a.optional(a.picklist(["private", "limited", "public"] as const)),
  adminCanChangeTeamAccess: a.optional(a.boolean()),
})

export { forgejoOrganizationEditOptionsSchema }
export type ForgejoOrganizationEditOptions = a.InferOutput<typeof forgejoOrganizationEditOptionsSchema>
