import * as a from "valibot"

const forgejoIssueListOptionsSchema = a.object({
  q: a.optional(a.string()),
  labels: a.optional(a.union([a.string(), a.array(a.string())])),
  createdBy: a.optional(a.string()),
  assignedBy: a.optional(a.string()),
  state: a.optional(a.picklist(["open", "closed", "all"] as const)),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoIssueListOptionsSchema }
export type ForgejoIssueListOptions = a.InferOutput<typeof forgejoIssueListOptionsSchema>
