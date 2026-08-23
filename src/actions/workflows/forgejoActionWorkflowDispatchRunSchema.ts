import * as a from "valibot"

const forgejoActionWorkflowDispatchRunSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  jobs: a.optional(a.nullable(a.array(a.string()))),
  run_number: a.optional(a.nullable(a.number())),
})

export { forgejoActionWorkflowDispatchRunSchema }
export type ForgejoActionWorkflowDispatchRun = a.InferOutput<typeof forgejoActionWorkflowDispatchRunSchema>
