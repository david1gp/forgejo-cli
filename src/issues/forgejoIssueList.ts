import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoIssueListOptionsSchema, type ForgejoIssueListOptions } from "./forgejoIssueListOptionsSchema.js"
import { forgejoIssuePathCreate } from "./forgejoIssuePathCreate.js"
import { forgejoIssueSchema, type ForgejoIssue } from "./forgejoIssueSchema.js"

export async function forgejoIssueList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoIssue[]>> {
  const op = "forgejoIssueList"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoIssueListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoIssueListOptions = parsed.output
  const labels = Array.isArray(options.labels) ? options.labels.join(",") : options.labels
  const query = {
    ...(options.q === undefined ? {} : { q: options.q }),
    ...(labels === undefined ? {} : { labels }),
    ...(options.createdBy === undefined ? {} : { created_by: options.createdBy }),
    ...(options.assignedBy === undefined ? {} : { assigned_by: options.assignedBy }),
    ...(options.state === undefined ? {} : { state: options.state }),
    type: "issues",
    ...(options.page === undefined ? {} : { page: options.page }),
    ...(options.limit === undefined ? {} : { limit: options.limit }),
  }
  const response = await transport.request({ path: forgejoIssuePathCreate(repository.data), query })
  if (!response.success) return response
  const issues = a.safeParse(a.array(forgejoIssueSchema), response.data.data)
  if (!issues.success) return createResultError(op, a.summarize(issues.issues))
  return createResult(
    issues.output.map((issue) => (issue.repo === undefined ? { ...issue, repo: repository.data } : issue)),
  )
}
