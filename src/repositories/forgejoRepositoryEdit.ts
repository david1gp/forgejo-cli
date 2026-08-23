import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoRepositoryEditOptionsSchema,
  type ForgejoRepositoryEditOptions,
} from "./forgejoRepositoryEditOptionsSchema.js"
import { forgejoRepositoryPathCreate } from "./forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"
import { forgejoRepositoryResponseParse } from "./forgejoRepositoryResponseParse.js"
import type { ForgejoRepository } from "./forgejoRepositorySchema.js"

export async function forgejoRepositoryEdit(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoRepository>> {
  const op = "forgejoRepositoryEdit"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoRepositoryEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryEditOptions = parsed.output
  const { defaultBranch, enablePrune, mirrorInterval, ...rest } = options
  const body = {
    ...rest,
    ...(defaultBranch === undefined ? {} : { default_branch: defaultBranch }),
    ...(enablePrune === undefined ? {} : { enable_prune: enablePrune }),
    ...(mirrorInterval === undefined ? {} : { mirror_interval: mirrorInterval }),
  }
  const response = await transport.request({
    path: forgejoRepositoryPathCreate(repository.data),
    method: "PATCH",
    body,
  })
  if (!response.success) return response
  return forgejoRepositoryResponseParse(response.data.data, op)
}
