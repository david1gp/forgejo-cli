import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../forgejoRepositoryReferenceParse.js"
import { forgejoRepositoryCommitSchema, type ForgejoRepositoryCommit } from "./forgejoRepositoryCommitSchema.js"
import {
  forgejoRepositoryCommitsListOptionsSchema,
  type ForgejoRepositoryCommitsListOptions,
} from "./forgejoRepositoryCommitsListOptionsSchema.js"

export async function forgejoRepositoryCommitsList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoRepositoryCommit[]>> {
  const op = "forgejoRepositoryCommitsList"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoRepositoryCommitsListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryCommitsListOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/commits`,
    query: {
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  })
  if (!response.success) return response
  const commits = a.safeParse(a.array(forgejoRepositoryCommitSchema), response.data.data)
  if (!commits.success) return createResultError(op, a.summarize(commits.issues))
  return createResult(commits.output)
}
