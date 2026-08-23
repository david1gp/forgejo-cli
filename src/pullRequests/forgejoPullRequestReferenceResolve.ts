import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import type { ForgejoRepositoryIdentifier } from "../repositories/forgejoRepositoryIdentifierSchema.js"
import { forgejoPullRequestIdentifierParse } from "./forgejoPullRequestIdentifierParse.js"
import {
  forgejoPullRequestIdentifierSchema,
  type ForgejoPullRequestIdentifier,
} from "./forgejoPullRequestIdentifierSchema.js"

type ForgejoPullRequestReference = {
  pullRequest: ForgejoPullRequestIdentifier
  repository: ForgejoRepositoryIdentifier
}

function forgejoPullRequestIdentifierInputParse(input: unknown): ForgejoResult<ForgejoPullRequestIdentifier> {
  if (typeof input === "string") return forgejoPullRequestIdentifierParse(input)
  if (typeof input !== "object" || input === null)
    return createResultError("forgejoPullRequestReferenceResolve", "Pull request reference must be a string or object")
  const value = input as Record<string, unknown>
  const number = typeof value.number === "string" ? forgejoPullRequestIdentifierParse(value.number) : undefined
  if (number && !number.success) return number
  const repository = typeof value.repo === "string" ? forgejoRepositoryReferenceParse(value.repo) : undefined
  if (repository && !repository.success) return repository
  const parsed = a.safeParse(forgejoPullRequestIdentifierSchema, {
    ...value,
    ...(number ? { number: number.data.number, parent: number.data.parent } : {}),
    ...(repository ? { repo: repository.data } : {}),
    parent: value.parent ?? (number?.success ? number.data.parent : false),
  })
  if (!parsed.success) return createResultError("forgejoPullRequestReferenceResolve", a.summarize(parsed.issues))
  return createResult(parsed.output)
}

function forgejoPullRequestParentParse(
  input: unknown,
  host: string | undefined,
): ForgejoResult<ForgejoRepositoryIdentifier> {
  if (typeof input !== "object" || input === null)
    return createResultError("forgejoPullRequestReferenceResolve", "Repository has no parent repository")
  const value = input as Record<string, unknown>
  if (typeof value.full_name === "string") {
    const parsed = forgejoRepositoryReferenceParse(value.full_name)
    if (!parsed.success) return parsed
    return createResult({ ...parsed.data, ...(host === undefined ? {} : { host }) })
  }
  const owner = value.owner
  const login = typeof owner === "object" && owner !== null && "login" in owner ? owner.login : undefined
  if (typeof login !== "string" || typeof value.name !== "string")
    return createResultError("forgejoPullRequestReferenceResolve", "Repository parent is missing owner or name")
  return createResult({ owner: login, name: value.name, ...(host === undefined ? {} : { host }) })
}

export async function forgejoPullRequestReferenceResolve(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoPullRequestReference>> {
  const op = "forgejoPullRequestReferenceResolve"
  const parsed = forgejoPullRequestIdentifierInputParse(input)
  if (!parsed.success) return createResultError(op, parsed.errorMessage)
  if (parsed.data.repo === undefined) return createResultError(op, "Pull request reference must include a repository")
  if (!parsed.data.parent) return createResult({ pullRequest: parsed.data, repository: parsed.data.repo })

  const response = await transport.request<{ parent?: unknown }>({
    path: forgejoRepositoryPathCreate(parsed.data.repo),
  })
  if (!response.success) return response
  const parent = forgejoPullRequestParentParse(response.data.data?.parent, parsed.data.repo.host)
  if (!parent.success) return parent
  return createResult({ pullRequest: parsed.data, repository: parent.data })
}

export type { ForgejoPullRequestReference }
