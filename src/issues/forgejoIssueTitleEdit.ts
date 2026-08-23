import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoIssueEdit } from "./forgejoIssueEdit.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export function forgejoIssueTitleEdit(
  transport: ForgejoRestTransport,
  issueInput: unknown,
  titleInput: unknown,
): Promise<ForgejoResult<ForgejoIssue>> {
  const options =
    typeof titleInput === "object" && titleInput !== null && "title" in titleInput ? titleInput : { title: titleInput }
  return forgejoIssueEdit(transport, issueInput, options)
}
