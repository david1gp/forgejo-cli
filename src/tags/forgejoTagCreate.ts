import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoTagCreateOptionsSchema, type ForgejoTagCreateOptions } from "./forgejoTagCreateOptionsSchema.js"
import { forgejoTagResponseParse } from "./forgejoTagResponseParse.js"
import type { ForgejoTag } from "./forgejoTagSchema.js"

export async function forgejoTagCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoTag>> {
  const op = "forgejoTagCreate"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoTagCreateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoTagCreateOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/tags`,
    method: "POST",
    body: {
      tag_name: options.tagName,
      ...(options.message === undefined ? {} : { message: options.message }),
      ...(options.target === undefined ? {} : { target: options.target }),
    },
  })
  if (!response.success) return response
  return forgejoTagResponseParse(response.data.data, op)
}
