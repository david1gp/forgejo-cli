import * as a from "valibot"

const forgejoIssueEditOptionsSchema = a.object({
  title: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  body: a.optional(a.nullable(a.string())),
  state: a.optional(a.picklist(["open", "closed"] as const)),
  assignees: a.optional(a.array(a.string())),
})

export { forgejoIssueEditOptionsSchema }
export type ForgejoIssueEditOptions = a.InferOutput<typeof forgejoIssueEditOptionsSchema>
