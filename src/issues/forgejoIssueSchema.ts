import * as a from "valibot"
import { forgejoRepositoryIdentifierSchema } from "../repositories/forgejoRepositoryIdentifierSchema.js"
import { forgejoIssueUserSchema } from "./forgejoIssueUserSchema.js"

const forgejoIssueLabelSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  name: a.optional(a.nullable(a.string())),
  color: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
})

const forgejoIssueSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  number: a.optional(a.nullable(a.number())),
  title: a.optional(a.nullable(a.string())),
  body: a.optional(a.nullable(a.string())),
  state: a.optional(a.nullable(a.picklist(["open", "closed"] as const))),
  html_url: a.optional(a.nullable(a.string())),
  user: a.optional(a.nullable(forgejoIssueUserSchema)),
  assignees: a.optional(a.nullable(a.array(forgejoIssueUserSchema))),
  labels: a.optional(a.nullable(a.array(forgejoIssueLabelSchema))),
  comments: a.optional(a.nullable(a.number())),
  pull_request: a.optional(a.nullable(a.unknown())),
  repository: a.optional(a.nullable(a.unknown())),
  repo: a.optional(forgejoRepositoryIdentifierSchema),
})

export { forgejoIssueSchema }
export type ForgejoIssue = a.InferOutput<typeof forgejoIssueSchema>
