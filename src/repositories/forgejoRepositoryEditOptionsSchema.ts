import * as a from "valibot"

const forgejoRepositoryEditOptionsSchema = a.object({
  archived: a.optional(a.boolean()),
  defaultBranch: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  enablePrune: a.optional(a.boolean()),
  mirrorInterval: a.optional(a.nullable(a.string())),
  name: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  private: a.optional(a.boolean()),
  template: a.optional(a.boolean()),
  website: a.optional(a.nullable(a.string())),
})

export { forgejoRepositoryEditOptionsSchema }
export type ForgejoRepositoryEditOptions = a.InferOutput<typeof forgejoRepositoryEditOptionsSchema>
