import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositorySchema, type ForgejoRepository } from "../../repositories/forgejoRepositorySchema.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"
import {
  forgejoUserRepositoriesListOptionsSchema,
  type ForgejoUserRepositoriesListOptions,
} from "./forgejoUserRepositoriesListOptionsSchema.js"

export async function forgejoUserRepositoriesList(
  transport: ForgejoRestTransport,
  userInput?: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoRepository[]>> {
  const op = "forgejoUserRepositoriesList"
  const parsed = a.safeParse(forgejoUserRepositoriesListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserRepositoriesListOptions = parsed.output
  let path = "/api/v1/user/repos"
  if (options.starred) path = "/api/v1/user/starred"
  if (userInput !== undefined) {
    const user = forgejoUserReferenceParse(userInput)
    if (!user.success) return createResultError(op, user.errorMessage)
    path = `/api/v1/users/${encodeURIComponent(user.data)}/${options.starred ? "starred" : "repos"}`
  }
  const response = await transport.request({
    path,
    query: {
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
      ...(options.sort === undefined ? {} : { sort: options.sort }),
      ...(options.order === undefined ? {} : { order: options.order }),
    },
  })
  if (!response.success) return response
  const parsedRepositories = a.safeParse(a.array(forgejoRepositorySchema), response.data.data)
  if (!parsedRepositories.success) return createResultError(op, a.summarize(parsedRepositories.issues))
  return createResult(parsedRepositories.output)
}
