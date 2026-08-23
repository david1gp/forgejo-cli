import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import {
  forgejoActionWorkflowDispatchOptionsSchema,
  type ForgejoActionWorkflowDispatchOptions,
} from "./forgejoActionWorkflowDispatchOptionsSchema.js"
import {
  forgejoActionWorkflowDispatchRunSchema,
  type ForgejoActionWorkflowDispatchRun,
} from "./forgejoActionWorkflowDispatchRunSchema.js"

export async function forgejoActionWorkflowDispatch(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  input: unknown,
  refInput?: unknown,
  inputsInput?: unknown,
): Promise<ForgejoResult<ForgejoActionWorkflowDispatchRun | null>> {
  const op = "forgejoActionWorkflowDispatch"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const optionsInput =
    typeof input === "string" && typeof refInput === "string"
      ? { name: input, ref: refInput, ...(inputsInput === undefined ? {} : { inputs: inputsInput }) }
      : input
  const parsed = a.safeParse(forgejoActionWorkflowDispatchOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoActionWorkflowDispatchOptions = parsed.output
  const workflowName = options.name ?? options.workflow
  if (workflowName === undefined) return createResultError(op, "Workflow name is required")
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/actions/workflows/${encodeURIComponent(workflowName)}/dispatches`,
    method: "POST",
    body: {
      inputs: options.inputs,
      ref: options.ref,
      return_run_info: options.returnRunInfo,
    },
  })
  if (!response.success) return response
  if (response.data.data === null) return createResult(null)
  const run = a.safeParse(forgejoActionWorkflowDispatchRunSchema, response.data.data)
  if (!run.success) return createResultError(op, a.summarize(run.issues))
  return createResult(run.output)
}
