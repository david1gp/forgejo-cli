import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryLabelIdResolve } from "./forgejoRepositoryLabelIdResolve.js"
import { forgejoRepositoryPathCreate } from "../forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../forgejoRepositoryReferenceParse.js"

export async function forgejoRepositoryLabelDelete(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  labelInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoRepositoryLabelDelete"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const labelId = await forgejoRepositoryLabelIdResolve(transport, repository.data, labelInput)
  if (!labelId.success) return createResultError(op, labelId.errorMessage)
  const response = await transport.request<null>({
    path: `${forgejoRepositoryPathCreate(repository.data)}/labels/${labelId.data}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
