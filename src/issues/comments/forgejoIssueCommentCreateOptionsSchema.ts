import * as a from "valibot"

const forgejoIssueCommentCreateOptionsSchema = a.object({
  body: a.string(),
})

export { forgejoIssueCommentCreateOptionsSchema }
export type ForgejoIssueCommentCreateOptions = a.InferOutput<typeof forgejoIssueCommentCreateOptionsSchema>
