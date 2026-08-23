import * as a from "valibot"
import { forgejoPullRequestSchema } from "./forgejoPullRequestSchema.js"

const forgejoPullRequestCommitStatusSchema = a.looseObject({
  context: a.optional(a.nullable(a.string())),
  state: a.optional(a.nullable(a.string())),
  status: a.optional(a.nullable(a.string())),
  target_url: a.optional(a.nullable(a.string())),
})
const forgejoPullRequestStatusSchema = a.object({
  pullRequest: forgejoPullRequestSchema,
  statuses: a.array(forgejoPullRequestCommitStatusSchema),
})

export { forgejoPullRequestStatusSchema }
export type ForgejoPullRequestStatus = a.InferOutput<typeof forgejoPullRequestStatusSchema>
