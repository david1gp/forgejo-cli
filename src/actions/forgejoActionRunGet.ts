import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoActionRunSchema, type ForgejoActionRun } from "./forgejoActionRunSchema.js"

const forgejoActionRunIdSchema = a.pipe(a.number(), a.integer(), a.minValue(1))

export async function forgejoActionRunGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  runIdInput: unknown,
): Promise<ForgejoResult<ForgejoActionRun>> {
  const op = "forgejoActionRunGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const runId = a.safeParse(forgejoActionRunIdSchema, runIdInput)
  if (!runId.success) return createResultError(op, a.summarize(runId.issues), String(runIdInput))
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/actions/runs/${runId.output}`,
  })
  if (!response.success) return response
  const parsed = a.safeParse(forgejoActionRunSchema, response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
