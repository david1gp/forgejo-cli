import * as a from "valibot"

const forgejoRepositoryLabelEditOptionsSchema = a.object({
  name: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  color: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  description: a.optional(a.nullable(a.string())),
  exclusive: a.optional(a.boolean()),
  archived: a.optional(a.boolean()),
})

export { forgejoRepositoryLabelEditOptionsSchema }
export type ForgejoRepositoryLabelEditOptions = a.InferOutput<typeof forgejoRepositoryLabelEditOptionsSchema>
