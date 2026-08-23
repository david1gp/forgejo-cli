import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestPathCreate } from "../forgejoPullRequestPathCreate.js"
import { forgejoPullRequestReferenceResolve } from "../forgejoPullRequestReferenceResolve.js"
import { forgejoPullRequestCommitSchema, type ForgejoPullRequestCommit } from "./forgejoPullRequestCommitSchema.js"
import {
  forgejoPullRequestCommitsListOptionsSchema,
  type ForgejoPullRequestCommitsListOptions,
} from "./forgejoPullRequestCommitsListOptionsSchema.js"

export async function forgejoPullRequestCommitsList(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoPullRequestCommit[]>> {
  const op = "forgejoPullRequestCommitsList"
  const reference = await forgejoPullRequestReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const parsed = a.safeParse(forgejoPullRequestCommitsListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoPullRequestCommitsListOptions = parsed.output
  const commits: ForgejoPullRequestCommit[] = []
  let page = options.page

  while (true) {
    const response = await transport.request({
      path: `${forgejoPullRequestPathCreate(reference.data.repository, reference.data.pullRequest.number)}/commits`,
      query: {
        files: false,
        ...(options.all === true || page !== undefined ? { page: page ?? 1 } : {}),
        ...(options.all === true || options.limit !== undefined ? { limit: options.limit ?? 50 } : {}),
      },
    })
    if (!response.success) return response
    const parsedCommits = a.safeParse(a.array(forgejoPullRequestCommitSchema), response.data.data)
    if (!parsedCommits.success) return createResultError(op, a.summarize(parsedCommits.issues))
    commits.push(...parsedCommits.output)
    const currentPage = page ?? 1
    const pageLimit = options.limit ?? 50
    const moreByCount =
      response.data.pagination?.totalCount !== undefined &&
      currentPage * pageLimit < response.data.pagination.totalCount
    if (options.all !== true || (response.data.pagination?.next === undefined && !moreByCount)) break
    page = (page ?? 1) + 1
  }

  return createResult(commits)
}
