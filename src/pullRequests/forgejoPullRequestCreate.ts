import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryGet } from "../repositories/forgejoRepositoryGet.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import {
  forgejoPullRequestCreateOptionsSchema,
  type ForgejoPullRequestCreateOptions,
} from "./forgejoPullRequestCreateOptionsSchema.js"
import { forgejoPullRequestPathCreate } from "./forgejoPullRequestPathCreate.js"
import { forgejoPullRequestResponseParse } from "./forgejoPullRequestResponseParse.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

function forgejoPullRequestParentParse(
  input: unknown,
  host: string | undefined,
): ForgejoResult<{ owner: string; name: string; host?: string }> {
  if (typeof input !== "object" || input === null)
    return createResultError("forgejoPullRequestCreate", "Repository has no parent repository")
  const value = input as Record<string, unknown>
  if (typeof value.full_name === "string") {
    const parsed = forgejoRepositoryReferenceParse(value.full_name)
    if (!parsed.success) return parsed
    return createResult({ ...parsed.data, ...(host === undefined ? {} : { host }) })
  }
  const owner = value.owner
  const login = typeof owner === "object" && owner !== null && "login" in owner ? owner.login : undefined
  if (typeof login !== "string" || typeof value.name !== "string")
    return createResultError("forgejoPullRequestCreate", "Repository parent is missing owner or name")
  return createResult({ owner: login, name: value.name, ...(host === undefined ? {} : { host }) })
}

export async function forgejoPullRequestCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequest>> {
  const op = "forgejoPullRequestCreate"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoPullRequestCreateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoPullRequestCreateOptions = parsed.output
  const parentRequested = options.base?.startsWith("^") ?? false
  let target = repository.data
  let base = options.base?.replace(/^\^/, "")
  let defaultBranch: string | undefined
  if (parentRequested || base === undefined) {
    const current = await forgejoRepositoryGet(transport, repository.data)
    if (!current.success) return createResultError(op, current.errorMessage)
    defaultBranch = typeof current.data.default_branch === "string" ? current.data.default_branch : undefined
    if (parentRequested) {
      const parent = forgejoPullRequestParentParse(current.data.parent, repository.data.host)
      if (!parent.success) return parent
      target = parent.data
      const parentData = await forgejoRepositoryGet(transport, target)
      if (!parentData.success) return createResultError(op, parentData.errorMessage)
      defaultBranch =
        typeof parentData.data.default_branch === "string" ? parentData.data.default_branch : defaultBranch
    }
  }
  if (base === undefined) {
    if (defaultBranch === undefined) return createResultError(op, "Repository has no default branch")
    base = defaultBranch
  }
  const head =
    parentRequested && !options.head.includes(":") ? `${repository.data.owner}:${options.head}` : options.head
  const response = await transport.request({
    path: forgejoPullRequestPathCreate(target),
    method: "POST",
    body: { title: options.title, ...(options.body === undefined ? {} : { body: options.body }), base, head },
  })
  if (!response.success) return response
  return forgejoPullRequestResponseParse(response.data.data, op, target)
}
