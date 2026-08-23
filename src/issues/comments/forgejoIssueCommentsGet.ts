import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoIssueCommentsListOptionsSchema,
  type ForgejoIssueCommentsListOptions,
} from "./forgejoIssueCommentsListOptionsSchema.js"
import { forgejoIssueCommentSchema, type ForgejoIssueComment } from "./forgejoIssueCommentSchema.js"
import { forgejoIssuePathCreate } from "../forgejoIssuePathCreate.js"
import { forgejoIssueReferenceResolve } from "../forgejoIssueReferenceResolve.js"

export async function forgejoIssueCommentsGet(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoIssueComment[]>> {
  const op = "forgejoIssueCommentsGet"
  const issue = forgejoIssueReferenceResolve(issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const parsed = a.safeParse(forgejoIssueCommentsListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoIssueCommentsListOptions = parsed.output
  const query = {
    ...(options.since === undefined ? {} : { since: options.since }),
    ...(options.before === undefined ? {} : { before: options.before }),
    ...(options.page === undefined ? {} : { page: options.page }),
    ...(options.limit === undefined ? {} : { limit: options.limit }),
  }
  const response = await transport.request({
    path: `${forgejoIssuePathCreate(issue.data.repository, issue.data.issue.number)}/comments`,
    query,
  })
  if (!response.success) return response
  const comments = a.safeParse(a.array(forgejoIssueCommentSchema), response.data.data)
  if (!comments.success) return createResultError(op, a.summarize(comments.issues))
  return createResult(comments.output)
}
