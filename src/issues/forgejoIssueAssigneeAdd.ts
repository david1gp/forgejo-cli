import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoIssueAssigneesOptionsSchema,
  type ForgejoIssueAssigneesOptions,
} from "./forgejoIssueAssigneesOptionsSchema.js"
import { forgejoIssueGet } from "./forgejoIssueGet.js"
import { forgejoIssueEdit } from "./forgejoIssueEdit.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export async function forgejoIssueAssigneeAdd(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoIssue>> {
  const op = "forgejoIssueAssigneeAdd"
  const parsed = a.safeParse(
    forgejoIssueAssigneesOptionsSchema,
    Array.isArray(optionsInput) ? { users: optionsInput } : optionsInput,
  )
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const issue = await forgejoIssueGet(transport, issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const options: ForgejoIssueAssigneesOptions = parsed.output
  const existing = (issue.data.assignees ?? []).flatMap((user) => (user.login ? [user.login] : []))
  const assignees = [...existing, ...options.users]
    .map((user) => user.toLowerCase())
    .filter((user, index, all) => all.indexOf(user) === index)
  return forgejoIssueEdit(transport, issueInput, { assignees })
}
