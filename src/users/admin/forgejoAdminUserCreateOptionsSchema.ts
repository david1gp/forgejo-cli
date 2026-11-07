import * as a from "valibot"

const forgejoAdminUserCreateOptionsSchema = a.object({
  username: a.pipe(a.string(), a.trim(), a.minLength(1)),
  email: a.pipe(a.string(), a.trim(), a.minLength(1)),
  password: a.optional(a.pipe(a.string(), a.minLength(1))),
  fullName: a.optional(a.nullable(a.string())),
  loginName: a.optional(a.nullable(a.string())),
  website: a.optional(a.nullable(a.string())),
  location: a.optional(a.nullable(a.string())),
  visibility: a.optional(a.picklist(["public", "limited", "private"] as const)),
  mustChangePassword: a.optional(a.boolean()),
  sendNotify: a.optional(a.boolean()),
  sourceId: a.optional(a.pipe(a.number(), a.integer())),
  restricted: a.optional(a.boolean()),
  active: a.optional(a.boolean()),
  allowCreateOrganization: a.optional(a.boolean()),
  allowGitHook: a.optional(a.boolean()),
  allowImportLocal: a.optional(a.boolean()),
  maxRepoCreation: a.optional(a.pipe(a.number(), a.integer())),
  prohibitLogin: a.optional(a.boolean()),
})

export { forgejoAdminUserCreateOptionsSchema }
export type ForgejoAdminUserCreateOptions = a.InferOutput<typeof forgejoAdminUserCreateOptionsSchema>
