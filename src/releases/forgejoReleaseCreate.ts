import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import {
  forgejoReleaseCreateOptionsSchema,
  type ForgejoReleaseCreateOptions,
} from "./forgejoReleaseCreateOptionsSchema.js"
import { forgejoReleaseResponseParse } from "./forgejoReleaseResponseParse.js"
import type { ForgejoRelease } from "./forgejoReleaseSchema.js"

export async function forgejoReleaseCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoRelease>> {
  const op = "forgejoReleaseCreate"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoReleaseCreateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoReleaseCreateOptions = parsed.output
  const { tagName, targetCommitish, hideArchiveLinks, ...rest } = options
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/releases`,
    method: "POST",
    body: {
      tag_name: tagName,
      ...rest,
      ...(targetCommitish === undefined ? {} : { target_commitish: targetCommitish }),
      ...(hideArchiveLinks === undefined ? {} : { hide_archive_links: hideArchiveLinks }),
    },
  })
  if (!response.success) return response
  return forgejoReleaseResponseParse(response.data.data, op)
}
