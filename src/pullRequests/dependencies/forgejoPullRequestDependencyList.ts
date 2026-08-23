import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import type { ForgejoIssue } from "../../issues/forgejoIssueSchema.js"
import { forgejoPullRequestDependenciesGet } from "./forgejoPullRequestDependenciesGet.js"

export function forgejoPullRequestDependencyList(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
): Promise<ForgejoResult<ForgejoIssue[]>> {
  return forgejoPullRequestDependenciesGet(transport, pullRequestInput)
}
