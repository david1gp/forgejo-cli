import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import {
  forgejoActionVariableCreateOptionsSchema,
  type ForgejoActionVariableCreateOptions,
} from "./forgejoActionVariableCreateOptionsSchema.js"

export async function forgejoActionVariableCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  input: unknown,
  dataInput?: unknown,
  forceInput?: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoActionVariableCreate"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const valueInput =
    typeof input === "string"
      ? { name: input, data: dataInput, ...(forceInput === undefined ? {} : { force: forceInput }) }
      : input
  const parsed = a.safeParse(forgejoActionVariableCreateOptionsSchema, valueInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), valueInput as string)
  const options: ForgejoActionVariableCreateOptions = parsed.output
  const value = options.value ?? options.data
  if (value === undefined) return createResultError(op, "Variable data is required")
  const path = `${forgejoRepositoryPathCreate(repository.data)}/actions/variables/${encodeURIComponent(options.name)}`
  const response = await transport.request<null>({
    path,
    method: "POST",
    body: { value },
    responseType: "empty",
  })
  if (response.success) return createResult(response.data.data)
  if (!options.force || (response.code !== "forgejo.conflict" && response.statusCode !== 409)) return response
  const updated = await transport.request<null>({
    path,
    method: "PUT",
    body: { name: null, value },
    responseType: "empty",
  })
  if (!updated.success) return updated
  return createResult(updated.data.data)
}
