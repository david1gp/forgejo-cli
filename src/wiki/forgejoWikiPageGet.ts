import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoWikiPageSchema, type ForgejoWikiPage } from "./forgejoWikiPageSchema.js"

const forgejoWikiPageNameSchema = a.pipe(a.string(), a.trim(), a.minLength(1))

export async function forgejoWikiPageGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  pageInput: unknown,
): Promise<ForgejoResult<ForgejoWikiPage>> {
  const op = "forgejoWikiPageGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const page = a.safeParse(forgejoWikiPageNameSchema, pageInput)
  if (!page.success) return createResultError(op, a.summarize(page.issues), pageInput as string)
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/wiki/page/${encodeURIComponent(page.output)}`,
  })
  if (!response.success) return response
  const parsed = a.safeParse(forgejoWikiPageSchema, response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
