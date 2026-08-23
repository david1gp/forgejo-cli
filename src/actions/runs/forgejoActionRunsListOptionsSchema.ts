import * as a from "valibot"

const forgejoActionRunStatusSchema = a.picklist([
  "unknown",
  "waiting",
  "running",
  "success",
  "failure",
  "cancelled",
  "skipped",
  "blocked",
] as const)

const forgejoActionRunsListOptionsSchema = a.object({
  event: a.optional(a.union([a.string(), a.array(a.string())])),
  status: a.optional(a.union([forgejoActionRunStatusSchema, a.array(forgejoActionRunStatusSchema)])),
  runNumber: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  headSha: a.optional(a.string()),
  ref: a.optional(a.string()),
  workflowId: a.optional(a.string()),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1)), 1),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1)), 20),
})

export { forgejoActionRunsListOptionsSchema }
export type ForgejoActionRunsListOptions = a.InferOutput<typeof forgejoActionRunsListOptionsSchema>
