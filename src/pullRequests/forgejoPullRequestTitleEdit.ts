import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestEdit } from "./forgejoPullRequestEdit.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export function forgejoPullRequestTitleEdit(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  titleInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequest>> {
  const options =
    typeof titleInput === "object" && titleInput !== null && "title" in titleInput ? titleInput : { title: titleInput }
  return forgejoPullRequestEdit(transport, pullRequestInput, options)
}
