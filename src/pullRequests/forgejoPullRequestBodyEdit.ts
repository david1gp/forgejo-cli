import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestEdit } from "./forgejoPullRequestEdit.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export function forgejoPullRequestBodyEdit(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  bodyInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequest>> {
  const options =
    typeof bodyInput === "object" && bodyInput !== null && "body" in bodyInput ? bodyInput : { body: bodyInput }
  return forgejoPullRequestEdit(transport, pullRequestInput, options)
}
