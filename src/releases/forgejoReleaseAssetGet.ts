import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoReleaseAssetReferenceParse } from "./forgejoReleaseAssetReferenceParse.js"
import { forgejoReleaseAssetResolve } from "./forgejoReleaseAssetResolve.js"
import { forgejoReleaseAssetResponseParse } from "./forgejoReleaseAssetResponseParse.js"
import { forgejoReleaseIdResolve } from "./forgejoReleaseIdResolve.js"
import type { ForgejoReleaseAsset } from "./forgejoReleaseAssetSchema.js"

export async function forgejoReleaseAssetGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  releaseInput: unknown,
  assetInput: unknown,
): Promise<ForgejoResult<ForgejoReleaseAsset>> {
  const op = "forgejoReleaseAssetGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const asset = forgejoReleaseAssetReferenceParse(assetInput)
  if (!asset.success) return createResultError(op, asset.errorMessage)
  const id =
    typeof asset.data === "number"
      ? asset.data
      : typeof asset.data === "object" && "id" in asset.data
        ? asset.data.id
        : undefined
  if (id !== undefined) {
    const releaseId = await forgejoReleaseIdResolve(transport, repository.data, releaseInput, op)
    if (!releaseId.success) return releaseId
    const response = await transport.request({
      path: `${forgejoRepositoryPathCreate(repository.data)}/releases/${releaseId.data}/assets/${id}`,
    })
    if (!response.success) return response
    return forgejoReleaseAssetResponseParse(response.data.data, op)
  }
  const resolved = await forgejoReleaseAssetResolve(transport, repository.data, releaseInput, assetInput, op)
  if (!resolved.success) return resolved
  if (!resolved.data.asset) return createResultError(op, "Release asset metadata is unavailable")
  return createResult(resolved.data.asset)
}
