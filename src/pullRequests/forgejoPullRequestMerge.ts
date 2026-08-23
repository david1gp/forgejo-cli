import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoPullRequestMergeOptionsSchema,
  type ForgejoPullRequestMergeOptions,
} from "./forgejoPullRequestMergeOptionsSchema.js"
import { forgejoPullRequestGet } from "./forgejoPullRequestGet.js"
import { forgejoPullRequestPathCreate } from "./forgejoPullRequestPathCreate.js"
import { forgejoPullRequestReferenceResolve } from "./forgejoPullRequestReferenceResolve.js"
import { forgejoPullRequestResponseParse } from "./forgejoPullRequestResponseParse.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export async function forgejoPullRequestMerge(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoPullRequest>> {
  const op = "forgejoPullRequestMerge"
  const reference = await forgejoPullRequestReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const parsed = a.safeParse(forgejoPullRequestMergeOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoPullRequestMergeOptions = parsed.output
  const method = options.method ?? options.mergeMethod ?? "merge"
  if (options.title !== undefined && ["rebase", "manual"].includes(method))
    return createResultError(op, `${method} does not support a merge title`)
  const response = await transport.request({
    path: `${forgejoPullRequestPathCreate(reference.data.repository, reference.data.pullRequest.number)}/merge`,
    method: "POST",
    body: {
      do: method === "manual" ? "manually-merged" : method,
      merge_commit_id: null,
      merge_message_field: options.message ?? null,
      merge_title_field: options.title ?? null,
      delete_branch_after_merge: options.deleteBranchAfterMerge ?? options.delete ?? false,
      force_merge: null,
      head_commit_id: null,
      merge_when_checks_succeed: null,
    },
  })
  if (!response.success) return response
  if (response.data.data === null) return forgejoPullRequestGet(transport, pullRequestInput)
  return forgejoPullRequestResponseParse(response.data.data, op, reference.data.repository)
}
