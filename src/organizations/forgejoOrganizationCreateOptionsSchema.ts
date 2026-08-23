import * as a from "valibot"

const forgejoOrganizationCreateOptionsSchema = a.object({
  name: a.pipe(a.string(), a.trim(), a.minLength(1)),
  fullName: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  email: a.optional(a.nullable(a.string())),
  location: a.optional(a.nullable(a.string())),
  website: a.optional(a.nullable(a.string())),
  visibility: a.optional(a.picklist(["private", "limited", "public"] as const)),
  adminCanChangeTeamAccess: a.optional(a.boolean()),
})

export { forgejoOrganizationCreateOptionsSchema }
export type ForgejoOrganizationCreateOptions = a.InferOutput<typeof forgejoOrganizationCreateOptionsSchema>
