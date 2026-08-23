import * as a from "valibot"
import { forgejoActionTaskSchema } from "./forgejoActionTaskSchema.js"

const forgejoActionTasksResponseSchema = a.looseObject({
  total_count: a.optional(a.nullable(a.number())),
  workflow_runs: a.optional(a.nullable(a.array(forgejoActionTaskSchema))),
})

export { forgejoActionTasksResponseSchema }
export type ForgejoActionTasksResponse = a.InferOutput<typeof forgejoActionTasksResponseSchema>
