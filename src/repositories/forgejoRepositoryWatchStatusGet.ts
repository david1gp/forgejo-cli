import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"

export async function forgejoRepositoryWatchStatusGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<boolean>> {
  const op = "forgejoRepositoryWatchStatusGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request({
    path: `/api/v1/user/subscriptions/${encodeURIComponent(repository.data.owner)}/${encodeURIComponent(repository.data.name)}`,
  })
  if (response.success) return createResult(true)
  if (response.statusCode === 404) return createResult(false)
  return response
}
