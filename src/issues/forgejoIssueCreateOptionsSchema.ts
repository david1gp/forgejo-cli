import * as a from "valibot"

const forgejoIssueCreateOptionsSchema = a.object({
  title: a.pipe(a.string(), a.trim(), a.minLength(1)),
  body: a.optional(a.nullable(a.string())),
  assignee: a.optional(a.nullable(a.string())),
  assignees: a.optional(a.array(a.string())),
  labels: a.optional(a.array(a.union([a.number(), a.string()]))),
  milestone: a.optional(a.nullable(a.number())),
  ref: a.optional(a.nullable(a.string())),
  dueDate: a.optional(a.nullable(a.string())),
})

export { forgejoIssueCreateOptionsSchema }
export type ForgejoIssueCreateOptions = a.InferOutput<typeof forgejoIssueCreateOptionsSchema>
