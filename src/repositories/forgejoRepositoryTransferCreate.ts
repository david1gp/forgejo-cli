import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "./forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"
import { forgejoRepositoryResponseParse } from "./forgejoRepositoryResponseParse.js"
import type { ForgejoRepository } from "./forgejoRepositorySchema.js"
import {
  forgejoRepositoryTransferCreateOptionsSchema,
  type ForgejoRepositoryTransferCreateOptions,
} from "./forgejoRepositoryTransferCreateOptionsSchema.js"

export async function forgejoRepositoryTransferCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoRepository>> {
  const op = "forgejoRepositoryTransferCreate"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoRepositoryTransferCreateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryTransferCreateOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/transfer`,
    method: "POST",
    body: {
      new_owner: options.newOwner,
      ...(options.teamIds === undefined ? {} : { team_ids: options.teamIds }),
    },
  })
  if (!response.success) return response
  return forgejoRepositoryResponseParse(response.data.data, op)
}
