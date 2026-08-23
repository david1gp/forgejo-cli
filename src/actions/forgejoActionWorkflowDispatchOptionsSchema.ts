import * as a from "valibot"

const forgejoActionWorkflowDispatchOptionsSchema = a.pipe(
  a.object({
    name: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
    workflow: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
    ref: a.pipe(a.string(), a.trim(), a.minLength(1)),
    inputs: a.optional(a.record(a.string(), a.string()), {}),
    returnRunInfo: a.optional(a.boolean(), false),
  }),
  a.check((input) => input.name !== undefined || input.workflow !== undefined, "Workflow name is required"),
)

export { forgejoActionWorkflowDispatchOptionsSchema }
export type ForgejoActionWorkflowDispatchOptions = a.InferOutput<typeof forgejoActionWorkflowDispatchOptionsSchema>
