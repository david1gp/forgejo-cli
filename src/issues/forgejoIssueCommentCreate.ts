import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoIssueCommentCreateOptionsSchema,
  type ForgejoIssueCommentCreateOptions,
} from "./forgejoIssueCommentCreateOptionsSchema.js"
import { forgejoIssueCommentResponseParse } from "./forgejoIssueCommentResponseParse.js"
import { forgejoIssuePathCreate } from "./forgejoIssuePathCreate.js"
import { forgejoIssueReferenceResolve } from "./forgejoIssueReferenceResolve.js"
import type { ForgejoIssueComment } from "./forgejoIssueCommentSchema.js"

export async function forgejoIssueCommentCreate(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoIssueComment>> {
  const op = "forgejoIssueCommentCreate"
  const issue = forgejoIssueReferenceResolve(issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const parsed = a.safeParse(
    forgejoIssueCommentCreateOptionsSchema,
    typeof optionsInput === "string" ? { body: optionsInput } : optionsInput,
  )
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoIssueCommentCreateOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoIssuePathCreate(issue.data.repository, issue.data.issue.number)}/comments`,
    method: "POST",
    body: options,
  })
  if (!response.success) return response
  return forgejoIssueCommentResponseParse(response.data.data, op)
}
