import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssuePathCreate } from "./forgejoIssuePathCreate.js"
import { forgejoIssueReferenceResolve } from "./forgejoIssueReferenceResolve.js"
import { forgejoIssueTargetParse } from "./forgejoIssueTargetParse.js"

export async function forgejoIssueDependencyRemove(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  targetInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoIssueDependencyRemove"
  const issue = forgejoIssueReferenceResolve(issueInput)
  if (!issue.success) return createResultError(op, issue.errorMessage)
  const targets = forgejoIssueTargetParse(targetInput)
  if (!targets.success) return createResultError(op, targets.errorMessage)
  for (const target of targets.data) {
    const targetRepository = target.repo ?? issue.data.repository
    const response = await transport.request<null>({
      path: `${forgejoIssuePathCreate(issue.data.repository, issue.data.issue.number)}/dependencies`,
      method: "DELETE",
      body: { index: target.number, owner: targetRepository.owner, repo: targetRepository.name },
      responseType: "empty",
    })
    if (!response.success) return response
  }
  return createResult(null)
}
