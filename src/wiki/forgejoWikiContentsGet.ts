import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoWikiPageSchema, type ForgejoWikiPage } from "./forgejoWikiPageSchema.js"

export async function forgejoWikiContentsGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoWikiPage[]>> {
  const op = "forgejoWikiContentsGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request({ path: `${forgejoRepositoryPathCreate(repository.data)}/wiki/pages` })
  if (!response.success) return response
  const pages = a.safeParse(a.array(forgejoWikiPageSchema), response.data.data)
  if (!pages.success) return createResultError(op, a.summarize(pages.issues))
  return createResult(pages.output)
}
