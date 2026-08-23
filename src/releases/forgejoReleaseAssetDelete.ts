import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoReleaseAssetResolve } from "./forgejoReleaseAssetResolve.js"
import { forgejoReleaseIdResolve } from "./forgejoReleaseIdResolve.js"

export async function forgejoReleaseAssetDelete(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  releaseInput: unknown,
  assetInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoReleaseAssetDelete"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const asset = await forgejoReleaseAssetResolve(transport, repository.data, releaseInput, assetInput, op)
  if (!asset.success) return asset
  const release = await forgejoReleaseIdResolve(transport, repository.data, releaseInput, op)
  if (!release.success) return release
  const response = await transport.request<null>({
    path: `${forgejoRepositoryPathCreate(repository.data)}/releases/${release.data}/assets/${asset.data.id}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
