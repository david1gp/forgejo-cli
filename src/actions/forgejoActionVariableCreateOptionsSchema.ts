import * as a from "valibot"

const forgejoActionVariableCreateOptionsSchema = a.pipe(
  a.object({
    name: a.pipe(a.string(), a.trim(), a.minLength(1)),
    data: a.optional(a.string()),
    value: a.optional(a.string()),
    force: a.optional(a.boolean(), false),
  }),
  a.check((input) => input.data !== undefined || input.value !== undefined, "Variable data is required"),
)

export { forgejoActionVariableCreateOptionsSchema }
export type ForgejoActionVariableCreateOptions = a.InferOutput<typeof forgejoActionVariableCreateOptionsSchema>
