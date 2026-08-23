import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueList } from "./forgejoIssueList.js"
import type { ForgejoIssueListOptions } from "./forgejoIssueListOptionsSchema.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export function forgejoIssueSearch(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: ForgejoIssueListOptions | unknown = {},
): Promise<ForgejoResult<ForgejoIssue[]>> {
  return forgejoIssueList(transport, repositoryInput, optionsInput)
}
