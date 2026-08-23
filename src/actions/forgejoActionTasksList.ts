import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import {
  forgejoActionTasksListOptionsSchema,
  type ForgejoActionTasksListOptions,
} from "./forgejoActionTasksListOptionsSchema.js"
import {
  forgejoActionTasksResponseSchema,
  type ForgejoActionTasksResponse,
} from "./forgejoActionTasksResponseSchema.js"

export async function forgejoActionTasksList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoActionTasksResponse>> {
  const op = "forgejoActionTasksList"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const options = a.safeParse(forgejoActionTasksListOptionsSchema, optionsInput)
  if (!options.success) return createResultError(op, a.summarize(options.issues), optionsInput as string)
  const values: ForgejoActionTasksListOptions = options.output
  const status = Array.isArray(values.status) ? values.status.join(",") : values.status
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/actions/tasks`,
    query: {
      ...(status === undefined ? {} : { status }),
      page: values.page,
      limit: values.limit,
    },
  })
  if (!response.success) return response
  const parsed = a.safeParse(forgejoActionTasksResponseSchema, response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
