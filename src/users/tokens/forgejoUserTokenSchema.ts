import * as a from "valibot"

const forgejoUserTokenSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  name: a.optional(a.nullable(a.string())),
  sha1: a.optional(a.nullable(a.string())),
  token_last_eight: a.optional(a.nullable(a.string())),
  scopes: a.optional(a.nullable(a.array(a.string()))),
})

export { forgejoUserTokenSchema }
export type ForgejoUserToken = a.InferOutput<typeof forgejoUserTokenSchema>
