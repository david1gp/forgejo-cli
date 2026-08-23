import * as a from "valibot"

const forgejoVersionSchema = a.looseObject({
  version: a.string(),
})

export { forgejoVersionSchema }
export type ForgejoVersion = a.InferOutput<typeof forgejoVersionSchema>
