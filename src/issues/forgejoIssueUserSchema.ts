import * as a from "valibot"

const forgejoIssueUserSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  login: a.optional(a.nullable(a.string())),
  username: a.optional(a.nullable(a.string())),
  full_name: a.optional(a.nullable(a.string())),
})

export { forgejoIssueUserSchema }
export type ForgejoIssueUser = a.InferOutput<typeof forgejoIssueUserSchema>
