import * as a from "valibot"

const forgejoActionStatusSchema = a.picklist([
  "unknown",
  "waiting",
  "running",
  "success",
  "failure",
  "cancelled",
  "skipped",
  "blocked",
] as const)

const forgejoActionTasksListOptionsSchema = a.object({
  status: a.optional(a.union([forgejoActionStatusSchema, a.array(forgejoActionStatusSchema)])),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1)), 1),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1)), 20),
})

export { forgejoActionTasksListOptionsSchema }
export type ForgejoActionTasksListOptions = a.InferOutput<typeof forgejoActionTasksListOptionsSchema>
