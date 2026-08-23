import * as a from "valibot"

const forgejoActionSecretCreateOptionsSchema = a.object({
  name: a.pipe(a.string(), a.trim(), a.minLength(1)),
  data: a.string(),
})

export { forgejoActionSecretCreateOptionsSchema }
export type ForgejoActionSecretCreateOptions = a.InferOutput<typeof forgejoActionSecretCreateOptionsSchema>
