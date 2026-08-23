import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"

export async function forgejoRepositoryUnwatch(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoRepositoryUnwatch"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request<null>({
    path: `/api/v1/user/subscriptions/${encodeURIComponent(repository.data.owner)}/${encodeURIComponent(repository.data.name)}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
