import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoReleaseAssetReferenceParse } from "./forgejoReleaseAssetReferenceParse.js"
import { forgejoReleaseAssetResolve } from "./forgejoReleaseAssetResolve.js"
import { forgejoReleaseGet } from "../forgejoReleaseGet.js"
import { forgejoReleaseIdResolve } from "../forgejoReleaseIdResolve.js"

export type ForgejoReleaseAssetRawData = Uint8Array

export async function forgejoReleaseAssetDownload(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  releaseInput: unknown,
  assetInput: unknown,
): Promise<ForgejoResult<ForgejoReleaseAssetRawData>> {
  const op = "forgejoReleaseAssetDownload"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const asset = forgejoReleaseAssetReferenceParse(assetInput)
  if (!asset.success) return createResultError(op, asset.errorMessage)
  const assetName =
    typeof asset.data === "string"
      ? asset.data
      : typeof asset.data === "object" && "name" in asset.data
        ? asset.data.name
        : undefined
  if (assetName === "source.zip" || assetName === "source.tar.gz") {
    const release = await forgejoReleaseGet(transport, repository.data, releaseInput)
    if (!release.success) return release
    if (!release.data.tag_name) return createResultError(op, "Release does not have a tag name")
    const archive = assetName === "source.zip" ? `${release.data.tag_name}.zip` : `${release.data.tag_name}.tar.gz`
    return forgejoReleaseAssetRawRequest(
      transport,
      `${forgejoRepositoryPathCreate(repository.data)}/archive/${encodeURIComponent(archive)}`,
      op,
    )
  }
  const resolved = await forgejoReleaseAssetResolve(transport, repository.data, releaseInput, assetInput, op)
  if (!resolved.success) return resolved
  const releaseId = await forgejoReleaseIdResolve(transport, repository.data, releaseInput, op)
  if (!releaseId.success) return releaseId
  return forgejoReleaseAssetRawRequest(
    transport,
    `${forgejoRepositoryPathCreate(repository.data)}/releases/${releaseId.data}/assets/${resolved.data.id}`,
    op,
  )
}

async function forgejoReleaseAssetRawRequest(
  transport: ForgejoRestTransport,
  path: string,
  op: string,
): Promise<ForgejoResult<ForgejoReleaseAssetRawData>> {
  const response = await transport.request<ForgejoReleaseAssetRawData>({ path, responseType: "binary" })
  if (!response.success) return response
  if (response.data.data === null) return createResultError(op, "Forgejo API returned no asset data")
  return createResult(response.data.data)
}
