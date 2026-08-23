import * as a from "valibot"

const forgejoUserSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  login: a.optional(a.nullable(a.string())),
  username: a.optional(a.nullable(a.string())),
  full_name: a.optional(a.nullable(a.string())),
  email: a.optional(a.nullable(a.string())),
  avatar_url: a.optional(a.nullable(a.string())),
  html_url: a.optional(a.nullable(a.string())),
  language: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  website: a.optional(a.nullable(a.string())),
  location: a.optional(a.nullable(a.string())),
  pronouns: a.optional(a.nullable(a.string())),
  visibility: a.optional(a.nullable(a.string())),
  followers_count: a.optional(a.nullable(a.number())),
  following_count: a.optional(a.nullable(a.number())),
  starred_repos_count: a.optional(a.nullable(a.number())),
  created: a.optional(a.nullable(a.string())),
  restricted: a.optional(a.nullable(a.boolean())),
  active: a.optional(a.nullable(a.boolean())),
  is_admin: a.optional(a.nullable(a.boolean())),
})

export { forgejoUserSchema }
export type ForgejoUser = a.InferOutput<typeof forgejoUserSchema>
