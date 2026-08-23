import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryGet } from "../repositories/forgejoRepositoryGet.js"
import { forgejoWikiCloneMetadataSchema, type ForgejoWikiCloneMetadata } from "./forgejoWikiCloneMetadataSchema.js"

function forgejoWikiCloneUrlCreate(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value
  const base = value.endsWith(".git") ? value.slice(0, -4) : value
  return `${base}.wiki.git`
}

export async function forgejoWikiCloneMetadataGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoWikiCloneMetadata>> {
  const op = "forgejoWikiCloneMetadataGet"
  const repository = await forgejoRepositoryGet(transport, repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoWikiCloneMetadataSchema, {
    name: repository.data.name,
    fullName: repository.data.full_name,
    cloneUrl: forgejoWikiCloneUrlCreate(repository.data.clone_url),
    sshUrl: forgejoWikiCloneUrlCreate(repository.data.ssh_url),
  })
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
