import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../../repositories/forgejoRepositoryReferenceParse.js"

export async function forgejoActionSecretDelete(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  nameInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoActionSecretDelete"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  if (typeof nameInput !== "string" || nameInput.trim().length === 0)
    return createResultError(op, "Secret name must be a non-empty string", nameInput as string)
  const response = await transport.request<null>({
    path: `${forgejoRepositoryPathCreate(repository.data)}/actions/secrets/${encodeURIComponent(nameInput.trim())}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
