import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoTagListOptionsSchema, type ForgejoTagListOptions } from "./forgejoTagListOptionsSchema.js"
import { forgejoTagSchema, type ForgejoTag } from "./forgejoTagSchema.js"

export async function forgejoTagList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoTag[]>> {
  const op = "forgejoTagList"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoTagListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoTagListOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/tags`,
    query: { page: options.page, limit: options.limit },
  })
  if (!response.success) return response
  const tags = a.safeParse(a.array(forgejoTagSchema), response.data.data)
  if (!tags.success) return createResultError(op, a.summarize(tags.issues))
  return createResult(tags.output)
}
