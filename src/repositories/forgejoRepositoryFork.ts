import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryForkOptionsSchema } from "./forgejoRepositoryForkOptionsSchema.js"
import { forgejoRepositoryPathCreate } from "./forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"
import { forgejoRepositoryResponseParse } from "./forgejoRepositoryResponseParse.js"
import type { ForgejoRepository } from "./forgejoRepositorySchema.js"

export async function forgejoRepositoryFork(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoRepository>> {
  const op = "forgejoRepositoryFork"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const options = a.safeParse(forgejoRepositoryForkOptionsSchema, optionsInput)
  if (!options.success) return createResultError(op, a.summarize(options.issues))
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/forks`,
    method: "POST",
    body: options.output,
  })
  if (!response.success) return response
  return forgejoRepositoryResponseParse(response.data.data, op)
}
