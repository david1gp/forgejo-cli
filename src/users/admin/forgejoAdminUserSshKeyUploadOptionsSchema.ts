import * as a from "valibot"

const forgejoAdminUserSshKeyUploadOptionsSchema = a.object({
  key: a.pipe(a.string(), a.trim(), a.minLength(1)),
  title: a.pipe(a.string(), a.trim(), a.minLength(1)),
  readOnly: a.optional(a.boolean()),
})

export { forgejoAdminUserSshKeyUploadOptionsSchema }
export type ForgejoAdminUserSshKeyUploadOptions = a.InferOutput<typeof forgejoAdminUserSshKeyUploadOptionsSchema>
