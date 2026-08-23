import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueDependenciesGet } from "./forgejoIssueDependenciesGet.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export function forgejoIssueDependencyList(
  transport: ForgejoRestTransport,
  issueInput: unknown,
): Promise<ForgejoResult<ForgejoIssue[]>> {
  return forgejoIssueDependenciesGet(transport, issueInput)
}
