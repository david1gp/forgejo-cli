import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestEdit } from "./forgejoPullRequestEdit.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export function forgejoPullRequestStateEdit(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  stateInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequest>> {
  const options =
    typeof stateInput === "object" && stateInput !== null && "state" in stateInput ? stateInput : { state: stateInput }
  return forgejoPullRequestEdit(transport, pullRequestInput, options)
}
