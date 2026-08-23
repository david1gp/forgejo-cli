import * as a from "valibot"

const forgejoTagListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1)), 1),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1)), 20),
})

export { forgejoTagListOptionsSchema }
export type ForgejoTagListOptions = a.InferOutput<typeof forgejoTagListOptionsSchema>
