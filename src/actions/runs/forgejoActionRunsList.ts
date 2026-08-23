import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../../repositories/forgejoRepositoryReferenceParse.js"
import {
  forgejoActionRunsListOptionsSchema,
  type ForgejoActionRunsListOptions,
} from "./forgejoActionRunsListOptionsSchema.js"
import { forgejoActionRunsResponseSchema, type ForgejoActionRunsResponse } from "./forgejoActionRunsResponseSchema.js"

export async function forgejoActionRunsList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoActionRunsResponse>> {
  const op = "forgejoActionRunsList"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const options = a.safeParse(forgejoActionRunsListOptionsSchema, optionsInput)
  if (!options.success) return createResultError(op, a.summarize(options.issues), optionsInput as string)
  const values: ForgejoActionRunsListOptions = options.output
  const event = Array.isArray(values.event) ? values.event.join(",") : values.event
  const status = Array.isArray(values.status) ? values.status.join(",") : values.status
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/actions/runs`,
    query: {
      ...(event === undefined ? {} : { event }),
      ...(status === undefined ? {} : { status }),
      ...(values.runNumber === undefined ? {} : { run_number: values.runNumber }),
      ...(values.headSha === undefined ? {} : { head_sha: values.headSha }),
      ...(values.ref === undefined ? {} : { ref: values.ref }),
      ...(values.workflowId === undefined ? {} : { workflow_id: values.workflowId }),
      page: values.page,
      limit: values.limit,
    },
  })
  if (!response.success) return response
  const parsed = a.safeParse(forgejoActionRunsResponseSchema, response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
