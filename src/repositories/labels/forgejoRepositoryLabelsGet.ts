import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoRepositoryLabelsListOptionsSchema,
  type ForgejoRepositoryLabelsListOptions,
} from "./forgejoRepositoryLabelsListOptionsSchema.js"
import { forgejoRepositoryLabelSchema, type ForgejoRepositoryLabel } from "./forgejoRepositoryLabelSchema.js"
import { forgejoRepositoryPathCreate } from "../forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../forgejoRepositoryReferenceParse.js"

export async function forgejoRepositoryLabelsGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoRepositoryLabel[]>> {
  const op = "forgejoRepositoryLabelsGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoRepositoryLabelsListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryLabelsListOptions = parsed.output
  const query = {
    ...(options.includeArchived === undefined ? {} : { include_archived: options.includeArchived }),
    ...(options.page === undefined ? {} : { page: options.page }),
    ...(options.limit === undefined ? {} : { limit: options.limit }),
  }
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/labels`,
    query,
  })
  if (!response.success) return response
  const labels = a.safeParse(a.array(forgejoRepositoryLabelSchema), response.data.data)
  if (!labels.success) return createResultError(op, a.summarize(labels.issues))
  return createResult(labels.output)
}
