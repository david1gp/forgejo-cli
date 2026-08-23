import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoReleaseList } from "./forgejoReleaseList.js"
import { forgejoReleaseReferenceParse } from "./forgejoReleaseReferenceParse.js"
import { forgejoReleaseResponseParse } from "./forgejoReleaseResponseParse.js"
import type { ForgejoRelease } from "./forgejoReleaseSchema.js"

export async function forgejoReleaseGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  releaseInput: unknown,
): Promise<ForgejoResult<ForgejoRelease>> {
  const op = "forgejoReleaseGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const release = forgejoReleaseReferenceParse(releaseInput)
  if (!release.success) return createResultError(op, release.errorMessage)
  const reference = release.data
  const id =
    typeof reference === "number"
      ? reference
      : typeof reference === "object" && "id" in reference
        ? reference.id
        : undefined
  if (id !== undefined) {
    const response = await transport.request({
      path: `${forgejoRepositoryPathCreate(repository.data)}/releases/${id}`,
    })
    if (!response.success) return response
    return forgejoReleaseResponseParse(response.data.data, op)
  }
  const tag = typeof reference === "object" && "tag" in reference ? reference.tag : undefined
  if (tag !== undefined) {
    const response = await transport.request({
      path: `${forgejoRepositoryPathCreate(repository.data)}/releases/tags/${encodeURIComponent(tag)}`,
    })
    if (!response.success) return response
    return forgejoReleaseResponseParse(response.data.data, op)
  }
  const name =
    typeof reference === "string"
      ? reference
      : typeof reference === "object" && "name" in reference
        ? reference.name
        : ""
  const releases = await forgejoReleaseList(transport, repository.data)
  if (!releases.success) return releases
  const found = releases.data.find((candidate) => candidate.name === name)
  if (!found) return createResultError(op, `Release ${name} was not found`)
  return createResult(found)
}
