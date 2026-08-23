import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoReleaseEditOptionsSchema, type ForgejoReleaseEditOptions } from "./forgejoReleaseEditOptionsSchema.js"
import { forgejoReleaseIdResolve } from "./forgejoReleaseIdResolve.js"
import { forgejoReleaseResponseParse } from "./forgejoReleaseResponseParse.js"
import type { ForgejoRelease } from "./forgejoReleaseSchema.js"

export async function forgejoReleaseEdit(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  releaseInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoRelease>> {
  const op = "forgejoReleaseEdit"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const releaseId = await forgejoReleaseIdResolve(transport, repository.data, releaseInput, op)
  if (!releaseId.success) return releaseId
  const parsed = a.safeParse(forgejoReleaseEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoReleaseEditOptions = parsed.output
  const { tagName, targetCommitish, hideArchiveLinks, ...rest } = options
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/releases/${releaseId.data}`,
    method: "PATCH",
    body: {
      ...rest,
      ...(tagName === undefined ? {} : { tag_name: tagName }),
      ...(targetCommitish === undefined ? {} : { target_commitish: targetCommitish }),
      ...(hideArchiveLinks === undefined ? {} : { hide_archive_links: hideArchiveLinks }),
    },
  })
  if (!response.success) return response
  return forgejoReleaseResponseParse(response.data.data, op)
}
