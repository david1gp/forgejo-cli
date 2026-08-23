import * as a from "valibot"

const forgejoPullRequestDiffOptionsSchema = a.object({
  format: a.optional(a.picklist(["diff", "patch"] as const)),
})

export { forgejoPullRequestDiffOptionsSchema }
export type ForgejoPullRequestDiffOptions = a.InferOutput<typeof forgejoPullRequestDiffOptionsSchema>
