import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoReleaseIdResolve } from "./forgejoReleaseIdResolve.js"
import { forgejoReleaseReferenceParse } from "./forgejoReleaseReferenceParse.js"

export async function forgejoReleaseDelete(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  releaseInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoReleaseDelete"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const reference = forgejoReleaseReferenceParse(releaseInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const tag = typeof reference.data === "object" && "tag" in reference.data ? reference.data.tag : undefined
  let path = ""
  if (tag !== undefined) {
    path = `${forgejoRepositoryPathCreate(repository.data)}/releases/tags/${encodeURIComponent(tag)}`
  }
  if (tag === undefined) {
    const releaseId = await forgejoReleaseIdResolve(transport, repository.data, reference.data, op)
    if (!releaseId.success) return releaseId
    path = `${forgejoRepositoryPathCreate(repository.data)}/releases/${releaseId.data}`
  }
  const response = await transport.request<null>({ path, method: "DELETE", responseType: "empty" })
  if (!response.success) return response
  return createResult(response.data.data)
}
