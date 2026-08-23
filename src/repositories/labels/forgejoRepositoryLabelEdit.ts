import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoRepositoryLabelEditOptionsSchema,
  type ForgejoRepositoryLabelEditOptions,
} from "./forgejoRepositoryLabelEditOptionsSchema.js"
import { forgejoRepositoryLabelIdResolve } from "./forgejoRepositoryLabelIdResolve.js"
import { forgejoRepositoryLabelResponseParse } from "./forgejoRepositoryLabelResponseParse.js"
import { forgejoRepositoryPathCreate } from "../forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../forgejoRepositoryReferenceParse.js"
import type { ForgejoRepositoryLabel } from "./forgejoRepositoryLabelSchema.js"

export async function forgejoRepositoryLabelEdit(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  labelInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoRepositoryLabel>> {
  const op = "forgejoRepositoryLabelEdit"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const labelId = await forgejoRepositoryLabelIdResolve(transport, repository.data, labelInput)
  if (!labelId.success) return createResultError(op, labelId.errorMessage)
  const parsed = a.safeParse(forgejoRepositoryLabelEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryLabelEditOptions = parsed.output
  const { archived, ...rest } = options
  const body = { ...rest, ...(archived === undefined ? {} : { is_archived: archived }) }
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/labels/${labelId.data}`,
    method: "PATCH",
    body,
  })
  if (!response.success) return response
  return forgejoRepositoryLabelResponseParse(response.data.data, op)
}
