import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoRepositoryAvatarUpdateOptionsSchema,
  type ForgejoRepositoryAvatarUpdateOptions,
} from "./forgejoRepositoryAvatarUpdateOptionsSchema.js"
import { forgejoRepositoryPathCreate } from "../forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../forgejoRepositoryReferenceParse.js"

export async function forgejoRepositoryAvatarUpdate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoRepositoryAvatarUpdate"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoRepositoryAvatarUpdateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryAvatarUpdateOptions = parsed.output
  const response = await transport.request<null>({
    path: `${forgejoRepositoryPathCreate(repository.data)}/avatar`,
    method: "POST",
    body: { image: options.image },
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
