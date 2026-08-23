import * as a from "valibot"

const forgejoUserEmailSchema = a.looseObject({
  email: a.optional(a.nullable(a.string())),
  primary: a.optional(a.nullable(a.boolean())),
  activated: a.optional(a.nullable(a.boolean())),
  visibility: a.optional(a.nullable(a.string())),
})

export { forgejoUserEmailSchema }
export type ForgejoUserEmail = a.InferOutput<typeof forgejoUserEmailSchema>
