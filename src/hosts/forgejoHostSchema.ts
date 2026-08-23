import * as a from "valibot"

const forgejoHostSchema = a.pipe(a.string(), a.minLength(1), a.regex(/^\S+$/))

export { forgejoHostSchema }
export type ForgejoHost = a.InferOutput<typeof forgejoHostSchema>
