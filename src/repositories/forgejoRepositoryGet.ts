import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "./forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"
import { forgejoRepositoryResponseParse } from "./forgejoRepositoryResponseParse.js"
import type { ForgejoRepository } from "./forgejoRepositorySchema.js"

export async function forgejoRepositoryGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoRepository>> {
  const op = "forgejoRepositoryGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request({ path: forgejoRepositoryPathCreate(repository.data) })
  if (!response.success) return response
  return forgejoRepositoryResponseParse(response.data.data, op)
}
