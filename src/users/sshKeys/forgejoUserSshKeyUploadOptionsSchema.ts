import * as a from "valibot"

const forgejoUserSshKeyUploadOptionsSchema = a.object({
  key: a.pipe(a.string(), a.trim(), a.minLength(1)),
  title: a.pipe(a.string(), a.trim(), a.minLength(1)),
  readOnly: a.optional(a.boolean()),
})

export { forgejoUserSshKeyUploadOptionsSchema }
export type ForgejoUserSshKeyUploadOptions = a.InferOutput<typeof forgejoUserSshKeyUploadOptionsSchema>
