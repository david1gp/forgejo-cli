import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"

export async function forgejoActionVariableDelete(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  nameInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoActionVariableDelete"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  if (typeof nameInput !== "string" || nameInput.trim().length === 0)
    return createResultError(op, "Variable name must be a non-empty string", nameInput as string)
  const response = await transport.request<null>({
    path: `${forgejoRepositoryPathCreate(repository.data)}/actions/variables/${encodeURIComponent(nameInput.trim())}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
