import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import {
  forgejoPullRequestListOptionsSchema,
  type ForgejoPullRequestListOptions,
} from "./forgejoPullRequestListOptionsSchema.js"
import { forgejoPullRequestPathCreate } from "./forgejoPullRequestPathCreate.js"
import { forgejoPullRequestSchema, type ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export async function forgejoPullRequestList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoPullRequest[]>> {
  const op = "forgejoPullRequestList"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoPullRequestListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoPullRequestListOptions = parsed.output
  const labels = Array.isArray(options.labels) ? options.labels.join(",") : options.labels
  const response = await transport.request({
    path: `${forgejoPullRequestPathCreate(repository.data).replace(/\/pulls$/, "/issues")}`,
    query: {
      type: "pulls",
      ...(options.q === undefined ? {} : { q: options.q }),
      ...(labels === undefined ? {} : { labels }),
      ...(options.createdBy === undefined ? {} : { created_by: options.createdBy }),
      ...(options.assignedBy === undefined ? {} : { assigned_by: options.assignedBy }),
      ...(options.state === undefined ? {} : { state: options.state }),
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  })
  if (!response.success) return response
  const list = a.safeParse(a.array(forgejoPullRequestSchema), response.data.data)
  if (!list.success) return createResultError(op, a.summarize(list.issues))
  return createResult(list.output.map((item) => (item.repo === undefined ? { ...item, repo: repository.data } : item)))
}
