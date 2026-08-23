import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueEdit } from "./forgejoIssueEdit.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export function forgejoIssueBodyEdit(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  bodyInput: unknown,
): Promise<ForgejoResult<ForgejoIssue>> {
  const options =
    typeof bodyInput === "object" && bodyInput !== null && "body" in bodyInput ? bodyInput : { body: bodyInput }
  return forgejoIssueEdit(transport, issueInput, options)
}
