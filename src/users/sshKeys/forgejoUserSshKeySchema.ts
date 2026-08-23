import * as a from "valibot"

const forgejoUserSshKeySchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  key: a.optional(a.nullable(a.string())),
  key_type: a.optional(a.nullable(a.string())),
  title: a.optional(a.nullable(a.string())),
  fingerprint: a.optional(a.nullable(a.string())),
  created_at: a.optional(a.nullable(a.string())),
  read_only: a.optional(a.nullable(a.boolean())),
})

export { forgejoUserSshKeySchema }
export type ForgejoUserSshKey = a.InferOutput<typeof forgejoUserSshKeySchema>
