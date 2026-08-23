import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestList } from "./forgejoPullRequestList.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"
import type { ForgejoPullRequestListOptions } from "./forgejoPullRequestListOptionsSchema.js"

export function forgejoPullRequestSearch(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: ForgejoPullRequestListOptions | unknown = {},
): Promise<ForgejoResult<ForgejoPullRequest[]>> {
  return forgejoPullRequestList(transport, repositoryInput, optionsInput)
}
