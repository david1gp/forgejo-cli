import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestGet } from "./forgejoPullRequestGet.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export function forgejoPullRequestView(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequest>> {
  return forgejoPullRequestGet(transport, pullRequestInput)
}
