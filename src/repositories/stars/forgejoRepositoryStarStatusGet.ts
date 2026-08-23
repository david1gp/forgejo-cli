import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryGet } from "../forgejoRepositoryGet.js"
import { forgejoRepositoryReferenceParse } from "../forgejoRepositoryReferenceParse.js"

export async function forgejoRepositoryStarStatusGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<boolean>> {
  const op = "forgejoRepositoryStarStatusGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request({
    path: `/api/v1/user/starred/${encodeURIComponent(repository.data.owner)}/${encodeURIComponent(repository.data.name)}`,
  })
  if (response.success) return createResult(true)
  if (response.statusCode !== 404) return response
  const repositoryResponse = await forgejoRepositoryGet(transport, repository.data)
  if (!repositoryResponse.success) return createResultError(op, repositoryResponse.errorMessage)
  return createResult(false)
}
