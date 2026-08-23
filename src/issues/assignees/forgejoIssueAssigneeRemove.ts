import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoIssueAssigneesOptionsSchema,
  type ForgejoIssueAssigneesOptions,
} from "./forgejoIssueAssigneesOptionsSchema.js"
import { forgejoIssueGet } from "../forgejoIssueGet.js"
import { forgejoIssueEdit } from "../forgejoIssueEdit.js"
import type { ForgejoIssue } from "../forgejoIssueSchema.js"

export async function forgejoIssueAssigneeRemove(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoIssue>> {
  const op = "forgejoIssueAssigneeRemove"
  const parsed = a.safeParse(
    forgejoIssueAssigneesOptionsSchema,
    Array.isArray(optionsInput) ? { users: optionsInput } : optionsInput,
  )
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const issue = await forgejoIssueGet(transport, issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const options: ForgejoIssueAssigneesOptions = parsed.output
  const remove = new Set(options.users.map((user) => user.toLowerCase()))
  const assignees = (issue.data.assignees ?? [])
    .flatMap((user) => (user.login ? [user.login] : []))
    .filter((user) => !remove.has(user.toLowerCase()))
  return forgejoIssueEdit(transport, issueInput, { assignees })
}
