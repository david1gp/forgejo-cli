import * as a from "valibot"

const forgejoPullRequestMergeMethodSchema = a.picklist(["merge", "rebase", "rebase-merge", "squash", "manual"] as const)
const forgejoPullRequestMergeOptionsSchema = a.object({
  method: a.optional(forgejoPullRequestMergeMethodSchema),
  mergeMethod: a.optional(forgejoPullRequestMergeMethodSchema),
  delete: a.optional(a.boolean()),
  deleteBranchAfterMerge: a.optional(a.boolean()),
  title: a.optional(a.nullable(a.string())),
  message: a.optional(a.nullable(a.string())),
})

export { forgejoPullRequestMergeOptionsSchema }
export type ForgejoPullRequestMergeOptions = a.InferOutput<typeof forgejoPullRequestMergeOptionsSchema>
