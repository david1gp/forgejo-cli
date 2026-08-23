import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import { forgejoIssueCommentSchema, type ForgejoIssueComment } from "./forgejoIssueCommentSchema.js"

export function forgejoIssueCommentResponseParse(
  input: unknown,
  op = "forgejoIssueCommentResponseParse",
): ForgejoResult<ForgejoIssueComment> {
  const parsed = a.safeParse(forgejoIssueCommentSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
