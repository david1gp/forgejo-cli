import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoReleaseListOptionsSchema, type ForgejoReleaseListOptions } from "./forgejoReleaseListOptionsSchema.js"
import { forgejoReleaseSchema, type ForgejoRelease } from "./forgejoReleaseSchema.js"

export async function forgejoReleaseList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoRelease[]>> {
  const op = "forgejoReleaseList"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoReleaseListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoReleaseListOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/releases`,
    query: {
      ...(options.q === undefined ? {} : { q: options.q }),
      ...(options.preRelease === undefined ? {} : { pre_release: options.preRelease }),
      ...(options.draft === undefined ? {} : { draft: options.draft }),
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  })
  if (!response.success) return response
  const releases = a.safeParse(a.array(forgejoReleaseSchema), response.data.data)
  if (!releases.success) return createResultError(op, a.summarize(releases.issues))
  return createResult(releases.output)
}
