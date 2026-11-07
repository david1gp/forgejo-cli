import * as a from "valibot"

const forgejoUserTokenCreateOptionsSchema = a.object({
  name: a.pipe(a.string(), a.trim(), a.minLength(1)),
  scopes: a.optional(a.array(a.pipe(a.string(), a.trim(), a.minLength(1)))),
})

export { forgejoUserTokenCreateOptionsSchema }
export type ForgejoUserTokenCreateOptions = a.InferOutput<typeof forgejoUserTokenCreateOptionsSchema>
