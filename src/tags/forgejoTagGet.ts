import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoTagResponseParse } from "./forgejoTagResponseParse.js"
import type { ForgejoTag } from "./forgejoTagSchema.js"

export async function forgejoTagGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  tagInput: unknown,
): Promise<ForgejoResult<ForgejoTag>> {
  const op = "forgejoTagGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const tag = a.safeParse(a.pipe(a.string(), a.trim(), a.minLength(1)), tagInput)
  if (!tag.success) return createResultError(op, a.summarize(tag.issues))
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/tags/${encodeURIComponent(tag.output)}`,
  })
  if (!response.success) return response
  return forgejoTagResponseParse(response.data.data, op)
}
