import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueEdit } from "./forgejoIssueEdit.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export function forgejoIssueStateEdit(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  stateInput: unknown,
): Promise<ForgejoResult<ForgejoIssue>> {
  const options =
    typeof stateInput === "object" && stateInput !== null && "state" in stateInput ? stateInput : { state: stateInput }
  return forgejoIssueEdit(transport, issueInput, options)
}
