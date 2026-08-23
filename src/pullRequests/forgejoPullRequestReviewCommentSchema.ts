import * as a from "valibot"
import { forgejoIssueUserSchema } from "../issues/forgejoIssueUserSchema.js"

const forgejoPullRequestReviewCommentSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  body: a.optional(a.nullable(a.string())),
  user: a.optional(a.nullable(forgejoIssueUserSchema)),
  path: a.optional(a.nullable(a.string())),
  position: a.optional(a.nullable(a.number())),
  original_position: a.optional(a.nullable(a.number())),
  diff_hunk: a.optional(a.nullable(a.string())),
  created_at: a.optional(a.nullable(a.string())),
  updated_at: a.optional(a.nullable(a.string())),
  resolver: a.optional(a.nullable(forgejoIssueUserSchema)),
})

export { forgejoPullRequestReviewCommentSchema }
export type ForgejoPullRequestReviewComment = a.InferOutput<typeof forgejoPullRequestReviewCommentSchema>
