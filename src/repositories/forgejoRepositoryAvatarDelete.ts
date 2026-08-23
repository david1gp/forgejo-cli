import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "./forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"

export async function forgejoRepositoryAvatarDelete(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoRepositoryAvatarDelete"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request<null>({
    path: `${forgejoRepositoryPathCreate(repository.data)}/avatar`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
