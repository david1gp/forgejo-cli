import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"

export async function forgejoRepositoryUnstar(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoRepositoryUnstar"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request<null>({
    path: `/api/v1/user/starred/${encodeURIComponent(repository.data.owner)}/${encodeURIComponent(repository.data.name)}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
