import * as a from "valibot"

const forgejoUserEmailOptionsSchema = a.object({
  emails: a.pipe(a.array(a.pipe(a.string(), a.trim(), a.minLength(1))), a.minLength(1)),
})

export { forgejoUserEmailOptionsSchema }
export type ForgejoUserEmailOptions = a.InferOutput<typeof forgejoUserEmailOptionsSchema>
