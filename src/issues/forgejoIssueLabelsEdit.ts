import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryLabelsGet } from "../repositories/forgejoRepositoryLabelsGet.js"
import {
  forgejoIssueLabelsEditOptionsSchema,
  type ForgejoIssueLabelsEditOptions,
} from "./forgejoIssueLabelsEditOptionsSchema.js"
import { forgejoIssuePathCreate } from "./forgejoIssuePathCreate.js"
import { forgejoIssueReferenceResolve } from "./forgejoIssueReferenceResolve.js"

export async function forgejoIssueLabelsEdit(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoIssueLabelsEdit"
  const issue = forgejoIssueReferenceResolve(issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const parsed = a.safeParse(forgejoIssueLabelsEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoIssueLabelsEditOptions = parsed.output
  const path = `${forgejoIssuePathCreate(issue.data.repository, issue.data.issue.number)}/labels`
  if (options.add && options.add.length > 0) {
    const names = options.add.filter((label): label is string => typeof label === "string" && !/^\d+$/.test(label))
    const labels =
      names.length === 0
        ? undefined
        : await forgejoRepositoryLabelsGet(transport, issue.data.repository, { includeArchived: true })
    if (labels && !labels.success) return createResultError(op, labels.errorMessage)
    const addIds = options.add.map((label) => {
      if (typeof label === "number") return label
      if (/^\d+$/.test(label)) return Number(label)
      const match = labels?.data.find((candidate) => candidate.name === label)
      return match?.id ?? undefined
    })
    const missing = options.add.find((label, index) => addIds[index] === undefined)
    if (missing !== undefined) return createResultError(op, `Issue label was not found: ${missing}`)
    const added = await transport.request({ path, method: "POST", body: { labels: addIds } })
    if (!added.success) return added
  }
  for (const label of options.remove ?? options.rm ?? []) {
    const removed = await transport.request<null>({
      path: `${path}/${encodeURIComponent(String(label))}`,
      method: "DELETE",
      responseType: "empty",
    })
    if (!removed.success) return removed
  }
  return createResult(null)
}
