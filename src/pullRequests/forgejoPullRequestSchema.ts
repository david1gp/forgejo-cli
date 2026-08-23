import * as a from "valibot"
import { forgejoRepositoryIdentifierSchema } from "../repositories/forgejoRepositoryIdentifierSchema.js"
import { forgejoIssueUserSchema } from "../issues/forgejoIssueUserSchema.js"

const forgejoPullRequestSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  number: a.optional(a.nullable(a.number())),
  title: a.optional(a.nullable(a.string())),
  body: a.optional(a.nullable(a.string())),
  state: a.optional(a.nullable(a.picklist(["open", "closed"] as const))),
  merged: a.optional(a.nullable(a.boolean())),
  merged_at: a.optional(a.nullable(a.string())),
  merged_by: a.optional(a.nullable(forgejoIssueUserSchema)),
  mergeable: a.optional(a.nullable(a.boolean())),
  draft: a.optional(a.nullable(a.boolean())),
  html_url: a.optional(a.nullable(a.string())),
  user: a.optional(a.nullable(forgejoIssueUserSchema)),
  assignees: a.optional(a.nullable(a.array(forgejoIssueUserSchema))),
  labels: a.optional(
    a.nullable(
      a.array(a.looseObject({ id: a.optional(a.nullable(a.number())), name: a.optional(a.nullable(a.string())) })),
    ),
  ),
  comments: a.optional(a.nullable(a.number())),
  base: a.optional(a.nullable(a.unknown())),
  head: a.optional(a.nullable(a.unknown())),
  pull_request: a.optional(a.nullable(a.unknown())),
  repo: a.optional(forgejoRepositoryIdentifierSchema),
})

export { forgejoPullRequestSchema }
export type ForgejoPullRequest = a.InferOutput<typeof forgejoPullRequestSchema>
