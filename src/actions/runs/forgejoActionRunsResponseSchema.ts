import * as a from "valibot"
import { forgejoActionRunSchema } from "./forgejoActionRunSchema.js"

const forgejoActionRunsResponseSchema = a.looseObject({
  total_count: a.optional(a.nullable(a.number())),
  workflow_runs: a.optional(a.nullable(a.array(forgejoActionRunSchema))),
})

export { forgejoActionRunsResponseSchema }
export type ForgejoActionRunsResponse = a.InferOutput<typeof forgejoActionRunsResponseSchema>
