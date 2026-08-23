import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoActionSecretSchema, type ForgejoActionSecret } from "./forgejoActionSecretSchema.js"

export async function forgejoActionSecretList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoActionSecret[]>> {
  const op = "forgejoActionSecretList"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/actions/secrets`,
  })
  if (!response.success) return response
  const secrets = a.safeParse(a.array(forgejoActionSecretSchema), response.data.data)
  if (!secrets.success) return createResultError(op, a.summarize(secrets.issues))
  return createResult(secrets.output)
}
