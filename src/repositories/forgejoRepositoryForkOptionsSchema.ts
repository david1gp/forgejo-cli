import * as a from "valibot"

const forgejoRepositoryForkOptionsSchema = a.object({
  name: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  organization: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
})

export { forgejoRepositoryForkOptionsSchema }
export type ForgejoRepositoryForkOptions = a.InferOutput<typeof forgejoRepositoryForkOptionsSchema>
