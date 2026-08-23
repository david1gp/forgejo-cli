import * as a from "valibot"

const forgejoRepositoryAvatarUpdateOptionsSchema = a.object({
  image: a.pipe(a.string(), a.minLength(1), a.regex(/^\S+$/)),
})

export { forgejoRepositoryAvatarUpdateOptionsSchema }
export type ForgejoRepositoryAvatarUpdateOptions = a.InferOutput<typeof forgejoRepositoryAvatarUpdateOptionsSchema>
