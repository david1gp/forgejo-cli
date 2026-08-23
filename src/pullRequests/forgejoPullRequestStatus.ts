import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoPullRequestPathCreate } from "./forgejoPullRequestPathCreate.js"
import { forgejoPullRequestReferenceResolve } from "./forgejoPullRequestReferenceResolve.js"
import { forgejoPullRequestResponseParse } from "./forgejoPullRequestResponseParse.js"
import { forgejoPullRequestStatusSchema, type ForgejoPullRequestStatus } from "./forgejoPullRequestStatusSchema.js"

export async function forgejoPullRequestStatus(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequestStatus>> {
  const op = "forgejoPullRequestStatus"
  const reference = await forgejoPullRequestReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const pullResponse = await transport.request({
    path: forgejoPullRequestPathCreate(reference.data.repository, reference.data.pullRequest.number),
  })
  if (!pullResponse.success) return pullResponse
  const pullRequest = forgejoPullRequestResponseParse(pullResponse.data.data, op, reference.data.repository)
  if (!pullRequest.success) return pullRequest
  if (pullRequest.data.merged === true) return createResult({ pullRequest: pullRequest.data, statuses: [] })
  const commits = await transport.request({
    path: `${forgejoPullRequestPathCreate(reference.data.repository, reference.data.pullRequest.number)}/commits`,
    query: { verification: false, files: false },
  })
  if (!commits.success) return commits
  const commitList = a.safeParse(
    a.array(
      a.looseObject({
        sha: a.optional(a.nullable(a.string())),
        created: a.optional(a.nullable(a.string())),
        created_at: a.optional(a.nullable(a.string())),
      }),
    ),
    commits.data.data,
  )
  if (!commitList.success) return createResultError(op, a.summarize(commitList.issues))
  const latest = [...commitList.output]
    .sort((left, right) =>
      String(left.created_at ?? left.created ?? "").localeCompare(String(right.created_at ?? right.created ?? "")),
    )
    .at(-1)
  if (!latest?.sha) return createResult({ pullRequest: pullRequest.data, statuses: [] })
  const status = await transport.request({
    path: `${forgejoRepositoryStatusPath(reference.data.repository)}/${encodeURIComponent(latest.sha)}/status`,
  })
  if (!status.success) return status
  const statuses = a.safeParse(
    a.object({
      statuses: a.optional(
        a.array(
          a.looseObject({
            context: a.optional(a.nullable(a.string())),
            state: a.optional(a.nullable(a.string())),
            status: a.optional(a.nullable(a.string())),
            target_url: a.optional(a.nullable(a.string())),
          }),
        ),
      ),
    }),
    status.data.data,
  )
  if (!statuses.success) return createResultError(op, a.summarize(statuses.issues))
  const result = { pullRequest: pullRequest.data, statuses: statuses.output.statuses ?? [] }
  const parsed = a.safeParse(forgejoPullRequestStatusSchema, result)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}

function forgejoRepositoryStatusPath(repository: { owner: string; name: string }): string {
  return `${forgejoRepositoryPathCreate(repository)}/commits`
}
