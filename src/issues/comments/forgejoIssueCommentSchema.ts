import * as a from "valibot"
import { forgejoIssueUserSchema } from "../forgejoIssueUserSchema.js"

const forgejoIssueCommentSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  body: a.optional(a.nullable(a.string())),
  user: a.optional(a.nullable(forgejoIssueUserSchema)),
  html_url: a.optional(a.nullable(a.string())),
  created_at: a.optional(a.nullable(a.string())),
  updated_at: a.optional(a.nullable(a.string())),
})

export { forgejoIssueCommentSchema }
export type ForgejoIssueComment = a.InferOutput<typeof forgejoIssueCommentSchema>
