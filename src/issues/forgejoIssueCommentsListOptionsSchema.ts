import * as a from "valibot"

const forgejoIssueCommentsListOptionsSchema = a.object({
  since: a.optional(a.string()),
  before: a.optional(a.string()),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoIssueCommentsListOptionsSchema }
export type ForgejoIssueCommentsListOptions = a.InferOutput<typeof forgejoIssueCommentsListOptionsSchema>
