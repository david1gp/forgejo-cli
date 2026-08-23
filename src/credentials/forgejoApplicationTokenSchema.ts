import * as a from "valibot"

const forgejoApplicationTokenSchema = a.pipe(a.string(), a.trim(), a.minLength(1))

export { forgejoApplicationTokenSchema }
export type ForgejoApplicationToken = a.InferOutput<typeof forgejoApplicationTokenSchema>
