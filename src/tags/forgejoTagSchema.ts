import * as a from "valibot"

const forgejoTagSchema = a.looseObject({
  id: a.optional(a.nullable(a.string())),
  name: a.optional(a.nullable(a.string())),
  message: a.optional(a.nullable(a.string())),
  commit: a.optional(a.nullable(a.unknown())),
  zipball_url: a.optional(a.nullable(a.string())),
  tarball_url: a.optional(a.nullable(a.string())),
})

export { forgejoTagSchema }
export type ForgejoTag = a.InferOutput<typeof forgejoTagSchema>
