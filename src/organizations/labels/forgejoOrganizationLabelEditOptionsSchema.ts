import * as a from "valibot"

const forgejoOrganizationLabelEditOptionsSchema = a.object({
  name: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  color: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  description: a.optional(a.nullable(a.string())),
  exclusive: a.optional(a.boolean()),
  archived: a.optional(a.boolean()),
})

export { forgejoOrganizationLabelEditOptionsSchema }
export type ForgejoOrganizationLabelEditOptions = a.InferOutput<typeof forgejoOrganizationLabelEditOptionsSchema>
