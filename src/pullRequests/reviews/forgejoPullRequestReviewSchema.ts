import * as a from "valibot"
import { forgejoIssueUserSchema } from "../../issues/forgejoIssueUserSchema.js"

const forgejoPullRequestReviewSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  state: a.optional(a.nullable(a.string())),
  body: a.optional(a.nullable(a.string())),
  user: a.optional(a.nullable(forgejoIssueUserSchema)),
  team: a.optional(a.nullable(a.looseObject({ name: a.optional(a.nullable(a.string())) }))),
  comments_count: a.optional(a.nullable(a.number())),
  stale: a.optional(a.nullable(a.boolean())),
  dismissed: a.optional(a.nullable(a.boolean())),
  updated_at: a.optional(a.nullable(a.string())),
  submitted_at: a.optional(a.nullable(a.string())),
})

export { forgejoPullRequestReviewSchema }
export type ForgejoPullRequestReview = a.InferOutput<typeof forgejoPullRequestReviewSchema>
