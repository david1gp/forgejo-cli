import * as a from "valibot"

const forgejoAdminUserEditOptionsSchema = a.object({
  email: a.optional(a.nullable(a.string())),
  fullName: a.optional(a.nullable(a.string())),
  loginName: a.optional(a.nullable(a.string())),
  password: a.optional(a.pipe(a.string(), a.minLength(1))),
  website: a.optional(a.nullable(a.string())),
  location: a.optional(a.nullable(a.string())),
  visibility: a.optional(a.picklist(["public", "limited", "private"] as const)),
  active: a.optional(a.boolean()),
  admin: a.optional(a.boolean()),
  allowCreateOrganization: a.optional(a.boolean()),
  allowDeleteAvatar: a.optional(a.boolean()),
  allowGitHook: a.optional(a.boolean()),
  allowImportLocal: a.optional(a.boolean()),
  maxRepoCreation: a.optional(a.pipe(a.number(), a.integer(), a.minValue(-1))),
  mustChangePassword: a.optional(a.boolean()),
  prohibitLogin: a.optional(a.boolean()),
  restricted: a.optional(a.boolean()),
})

export { forgejoAdminUserEditOptionsSchema }
export type ForgejoAdminUserEditOptions = a.InferOutput<typeof forgejoAdminUserEditOptionsSchema>
