import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoReleaseGet } from "./forgejoReleaseGet.js"
import { forgejoReleaseReferenceParse } from "./forgejoReleaseReferenceParse.js"
import type { ForgejoReleaseReference } from "./forgejoReleaseReferenceSchema.js"

async function forgejoReleaseIdResolve(
  transport: ForgejoRestTransport,
  repository: unknown,
  releaseInput: unknown,
  op: string,
): Promise<ForgejoResult<number>> {
  const reference = forgejoReleaseReferenceParse(releaseInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const id = forgejoReleaseReferenceIdGet(reference.data)
  if (id !== undefined) return createResult(id)
  const release = await forgejoReleaseGet(transport, repository, reference.data)
  if (!release.success) return createResultError(op, release.errorMessage)
  if (release.data.id === undefined || release.data.id === null)
    return createResultError(op, "Release does not have an id")
  return createResult(release.data.id)
}

function forgejoReleaseReferenceIdGet(reference: ForgejoReleaseReference): number | undefined {
  if (typeof reference === "number") return reference
  if (typeof reference === "object" && "id" in reference) return reference.id
  return undefined
}

export { forgejoReleaseIdResolve }
