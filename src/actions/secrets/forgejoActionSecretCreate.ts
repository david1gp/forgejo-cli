import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../../repositories/forgejoRepositoryReferenceParse.js"
import {
  forgejoActionSecretCreateOptionsSchema,
  type ForgejoActionSecretCreateOptions,
} from "./forgejoActionSecretCreateOptionsSchema.js"

export async function forgejoActionSecretCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  input: unknown,
  dataInput?: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoActionSecretCreate"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const valueInput = typeof input === "string" ? { name: input, data: dataInput } : input
  const parsed = a.safeParse(forgejoActionSecretCreateOptionsSchema, valueInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), valueInput as string)
  const options: ForgejoActionSecretCreateOptions = parsed.output
  const response = await transport.request<null>({
    path: `${forgejoRepositoryPathCreate(repository.data)}/actions/secrets/${encodeURIComponent(options.name)}`,
    method: "PUT",
    body: { data: options.data },
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
