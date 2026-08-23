import * as a from "valibot"

const forgejoTagCreateOptionsSchema = a.object({
  tagName: a.pipe(a.string(), a.trim(), a.minLength(1)),
  message: a.optional(a.nullable(a.string())),
  target: a.optional(a.string()),
})

export { forgejoTagCreateOptionsSchema }
export type ForgejoTagCreateOptions = a.InferOutput<typeof forgejoTagCreateOptionsSchema>
