import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestPathCreate } from "./forgejoPullRequestPathCreate.js"
import { forgejoPullRequestReferenceResolve } from "./forgejoPullRequestReferenceResolve.js"
import { forgejoPullRequestResponseParse } from "./forgejoPullRequestResponseParse.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export async function forgejoPullRequestGet(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequest>> {
  const op = "forgejoPullRequestGet"
  const pullRequest = await forgejoPullRequestReferenceResolve(transport, pullRequestInput)
  if (!pullRequest.success) return createResultError(op, pullRequest.errorMessage)
  const response = await transport.request({
    path: forgejoPullRequestPathCreate(pullRequest.data.repository, pullRequest.data.pullRequest.number),
  })
  if (!response.success) return response
  return forgejoPullRequestResponseParse(response.data.data, op, pullRequest.data.repository)
}
