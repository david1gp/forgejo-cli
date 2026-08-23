import * as a from "valibot"

const forgejoRepositoryLabelSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  name: a.optional(a.nullable(a.string())),
  color: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  exclusive: a.optional(a.nullable(a.boolean())),
  is_archived: a.optional(a.nullable(a.boolean())),
  url: a.optional(a.nullable(a.string())),
})

export { forgejoRepositoryLabelSchema }
export type ForgejoRepositoryLabel = a.InferOutput<typeof forgejoRepositoryLabelSchema>
