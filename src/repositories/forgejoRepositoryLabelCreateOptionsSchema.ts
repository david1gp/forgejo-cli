import * as a from "valibot"

const forgejoRepositoryLabelCreateOptionsSchema = a.object({
  name: a.pipe(a.string(), a.trim(), a.minLength(1)),
  color: a.pipe(a.string(), a.trim(), a.minLength(1)),
  description: a.optional(a.nullable(a.string())),
  exclusive: a.optional(a.boolean()),
  archived: a.optional(a.boolean()),
})

export { forgejoRepositoryLabelCreateOptionsSchema }
export type ForgejoRepositoryLabelCreateOptions = a.InferOutput<typeof forgejoRepositoryLabelCreateOptionsSchema>
