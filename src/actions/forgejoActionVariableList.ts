import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoActionVariableSchema, type ForgejoActionVariable } from "./forgejoActionVariableSchema.js"

export async function forgejoActionVariableList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoActionVariable[]>> {
  const op = "forgejoActionVariableList"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/actions/variables`,
  })
  if (!response.success) return response
  const variables = a.safeParse(a.array(forgejoActionVariableSchema), response.data.data)
  if (!variables.success) return createResultError(op, a.summarize(variables.issues))
  return createResult(variables.output)
}
