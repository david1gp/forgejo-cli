import * as a from "valibot"

const forgejoActionSecretSchema = a.looseObject({
  created_at: a.optional(a.nullable(a.string())),
  name: a.optional(a.nullable(a.string())),
})

export { forgejoActionSecretSchema }
export type ForgejoActionSecret = a.InferOutput<typeof forgejoActionSecretSchema>
