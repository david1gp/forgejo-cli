import * as a from "valibot"

const forgejoOrganizationLabelCreateOptionsSchema = a.object({
  name: a.pipe(a.string(), a.trim(), a.minLength(1)),
  color: a.pipe(a.string(), a.trim(), a.minLength(1)),
  description: a.optional(a.nullable(a.string())),
  exclusive: a.optional(a.boolean()),
  archived: a.optional(a.boolean()),
})

export { forgejoOrganizationLabelCreateOptionsSchema }
export type ForgejoOrganizationLabelCreateOptions = a.InferOutput<typeof forgejoOrganizationLabelCreateOptionsSchema>
