import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoRepositoryLabelCreateOptionsSchema,
  type ForgejoRepositoryLabelCreateOptions,
} from "./forgejoRepositoryLabelCreateOptionsSchema.js"
import { forgejoRepositoryLabelResponseParse } from "./forgejoRepositoryLabelResponseParse.js"
import { forgejoRepositoryPathCreate } from "./forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"
import type { ForgejoRepositoryLabel } from "./forgejoRepositoryLabelSchema.js"

export async function forgejoRepositoryLabelCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoRepositoryLabel>> {
  const op = "forgejoRepositoryLabelCreate"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoRepositoryLabelCreateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryLabelCreateOptions = parsed.output
  const { archived, ...rest } = options
  const body = { ...rest, ...(archived === undefined ? {} : { is_archived: archived }) }
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/labels`,
    method: "POST",
    body,
  })
  if (!response.success) return response
  return forgejoRepositoryLabelResponseParse(response.data.data, op)
}
