import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"

export async function forgejoTagDelete(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  tagInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoTagDelete"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const tag = a.safeParse(a.pipe(a.string(), a.trim(), a.minLength(1)), tagInput)
  if (!tag.success) return createResultError(op, a.summarize(tag.issues))
  const response = await transport.request<null>({
    path: `${forgejoRepositoryPathCreate(repository.data)}/tags/${encodeURIComponent(tag.output)}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
