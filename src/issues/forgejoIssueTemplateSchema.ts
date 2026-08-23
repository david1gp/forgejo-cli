import * as a from "valibot"

const forgejoIssueTemplateSchema = a.looseObject({
  file_name: a.optional(a.nullable(a.string())),
  name: a.optional(a.nullable(a.string())),
  about: a.optional(a.nullable(a.string())),
  labels: a.optional(a.nullable(a.array(a.string()))),
  ref: a.optional(a.nullable(a.string())),
})

export { forgejoIssueTemplateSchema }
export type ForgejoIssueTemplate = a.InferOutput<typeof forgejoIssueTemplateSchema>
