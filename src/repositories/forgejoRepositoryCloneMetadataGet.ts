import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoRepositoryCloneMetadataSchema,
  type ForgejoRepositoryCloneMetadata,
} from "./forgejoRepositoryCloneMetadataSchema.js"
import { forgejoRepositoryGet } from "./forgejoRepositoryGet.js"

export async function forgejoRepositoryCloneMetadataGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoRepositoryCloneMetadata>> {
  const op = "forgejoRepositoryCloneMetadataGet"
  const repository = await forgejoRepositoryGet(transport, repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const value = repository.data
  const parsed = a.safeParse(forgejoRepositoryCloneMetadataSchema, {
    name: value.name,
    fullName: value.full_name,
    htmlUrl: value.html_url,
    cloneUrl: value.clone_url,
    sshUrl: value.ssh_url,
    parent: value.parent,
  })
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
