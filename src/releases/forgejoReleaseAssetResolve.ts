import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoReleaseGet } from "./forgejoReleaseGet.js"
import { forgejoReleaseAssetReferenceParse } from "./forgejoReleaseAssetReferenceParse.js"
import type { ForgejoReleaseAssetReference } from "./forgejoReleaseAssetReferenceSchema.js"
import type { ForgejoReleaseAsset } from "./forgejoReleaseAssetSchema.js"

type ForgejoReleaseAssetResolved = {
  id: number
  asset?: ForgejoReleaseAsset
}

async function forgejoReleaseAssetResolve(
  transport: ForgejoRestTransport,
  repository: unknown,
  release: unknown,
  assetInput: unknown,
  op: string,
): Promise<ForgejoResult<ForgejoReleaseAssetResolved>> {
  const asset = forgejoReleaseAssetReferenceParse(assetInput)
  if (!asset.success) return createResultError(op, asset.errorMessage)
  const id = forgejoReleaseAssetReferenceIdGet(asset.data)
  if (id !== undefined) return createResult({ id })
  const releaseResult = await forgejoReleaseGet(transport, repository, release)
  if (!releaseResult.success) return createResultError(op, releaseResult.errorMessage)
  const name =
    typeof asset.data === "string"
      ? asset.data
      : typeof asset.data === "object" && "name" in asset.data
        ? asset.data.name
        : ""
  const found = releaseResult.data.assets?.find((candidate) => candidate.name === name)
  if (!found || found.id === undefined || found.id === null)
    return createResultError(op, `Release asset ${name} was not found`)
  return createResult({ id: found.id, asset: found })
}

function forgejoReleaseAssetReferenceIdGet(reference: ForgejoReleaseAssetReference): number | undefined {
  if (typeof reference === "number") return reference
  if (typeof reference === "object" && "id" in reference) return reference.id
  return undefined
}

export { forgejoReleaseAssetResolve }
