import * as a from "valibot"

const forgejoAdminUserRenameOptionsSchema = a.object({
  newUsername: a.pipe(a.string(), a.trim(), a.minLength(1)),
})

export { forgejoAdminUserRenameOptionsSchema }
export type ForgejoAdminUserRenameOptions = a.InferOutput<typeof forgejoAdminUserRenameOptionsSchema>
