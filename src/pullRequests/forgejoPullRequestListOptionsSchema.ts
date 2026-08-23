import * as a from "valibot"

const forgejoPullRequestListOptionsSchema = a.object({
  q: a.optional(a.string()),
  labels: a.optional(a.union([a.string(), a.array(a.string())])),
  createdBy: a.optional(a.string()),
  assignedBy: a.optional(a.string()),
  state: a.optional(a.picklist(["open", "closed", "all"] as const)),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoPullRequestListOptionsSchema }
export type ForgejoPullRequestListOptions = a.InferOutput<typeof forgejoPullRequestListOptionsSchema>
