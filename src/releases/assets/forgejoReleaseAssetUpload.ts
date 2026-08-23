import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoReleaseGet } from "../forgejoReleaseGet.js"
import { forgejoReleaseIdResolve } from "../forgejoReleaseIdResolve.js"
import {
  forgejoReleaseAssetUploadOptionsSchema,
  type ForgejoReleaseAssetUploadOptions,
} from "./forgejoReleaseAssetUploadOptionsSchema.js"
import { forgejoReleaseAssetResponseParse } from "./forgejoReleaseAssetResponseParse.js"
import type { ForgejoReleaseAsset } from "./forgejoReleaseAssetSchema.js"

export async function forgejoReleaseAssetUpload(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  releaseInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoReleaseAsset>> {
  const op = "forgejoReleaseAssetUpload"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoReleaseAssetUploadOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoReleaseAssetUploadOptions = parsed.output
  if (options.overwrite) {
    const release = await forgejoReleaseGet(transport, repository.data, releaseInput)
    if (!release.success) return release
    const existing = release.data.assets?.filter((asset) => asset.name === options.name) ?? []
    const releaseId = release.data.id
    if (releaseId === undefined || releaseId === null) return createResultError(op, "Release does not have an id")
    for (const asset of existing) {
      if (asset.id === undefined || asset.id === null) continue
      const deleted = await transport.request<null>({
        path: `${forgejoRepositoryPathCreate(repository.data)}/releases/${releaseId}/assets/${asset.id}`,
        method: "DELETE",
        responseType: "empty",
      })
      if (!deleted.success) return deleted
    }
  }
  const releaseId = await forgejoReleaseIdResolve(transport, repository.data, releaseInput, op)
  if (!releaseId.success) return releaseId
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/releases/${releaseId.data}/assets`,
    method: "POST",
    query: { name: options.name },
    headers: { "Content-Type": options.contentType ?? "application/octet-stream" },
    body: options.data,
  })
  if (!response.success) return response
  return forgejoReleaseAssetResponseParse(response.data.data, op)
}
