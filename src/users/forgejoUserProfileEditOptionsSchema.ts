import * as a from "valibot"

const forgejoUserProfileEditOptionsSchema = a.object({
  fullName: a.optional(a.nullable(a.string())),
  email: a.optional(a.nullable(a.string())),
  website: a.optional(a.nullable(a.string())),
  location: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  pronouns: a.optional(a.nullable(a.string())),
  visibility: a.optional(a.picklist(["public", "limited", "private"] as const)),
  language: a.optional(a.nullable(a.string())),
  theme: a.optional(a.nullable(a.string())),
  hideEmail: a.optional(a.boolean()),
  hideActivity: a.optional(a.boolean()),
  hidePronouns: a.optional(a.boolean()),
  keepActivityPrivate: a.optional(a.boolean()),
})

export { forgejoUserProfileEditOptionsSchema }
export type ForgejoUserProfileEditOptions = a.InferOutput<typeof forgejoUserProfileEditOptionsSchema>
