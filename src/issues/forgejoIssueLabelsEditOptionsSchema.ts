import * as a from "valibot"

const forgejoIssueLabelReferenceSchema = a.union([
  a.pipe(a.number(), a.integer(), a.minValue(1)),
  a.pipe(a.string(), a.trim(), a.minLength(1)),
])

const forgejoIssueLabelsEditOptionsSchema = a.object({
  add: a.optional(a.array(forgejoIssueLabelReferenceSchema)),
  remove: a.optional(a.array(forgejoIssueLabelReferenceSchema)),
  rm: a.optional(a.array(forgejoIssueLabelReferenceSchema)),
})

export { forgejoIssueLabelsEditOptionsSchema }
export type ForgejoIssueLabelsEditOptions = a.InferOutput<typeof forgejoIssueLabelsEditOptionsSchema>
