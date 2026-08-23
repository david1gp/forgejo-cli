import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoBaseUrlParse } from "../hosts/forgejoBaseUrlParse.js"
import { forgejoRepositoryIdentifierParse } from "../repositories/forgejoRepositoryIdentifierParse.js"
import { type ForgejoRemote, forgejoRemoteSchema } from "./forgejoRemoteSchema.js"

export function forgejoRemoteParse(input: unknown): ForgejoResult<ForgejoRemote> {
  const op = "forgejoRemoteParse"
  if (typeof input !== "string") return createResultError(op, "Remote must be a string")

  const value = input.trim()
  const scpLike = /^(?<user>[^/@:]+)@(?<host>[^/:]+):(?<path>.+)$/.exec(value)
  const normalized = scpLike?.groups
    ? `ssh://${scpLike.groups.user}@${scpLike.groups.host}/${scpLike.groups.path}`
    : value
  const remoteUrl = a.safeParse(forgejoRemoteSchema.entries.url, normalized)
  if (!remoteUrl.success) return createResultError(op, a.summarize(remoteUrl.issues))

  const url = new URL(remoteUrl.output)
  const segments = url.pathname.split("/").filter(Boolean)
  if (segments.length < 2) return createResultError(op, "Remote URL must contain owner and repository name")

  const owner = segments.at(-2)
  const name = segments.at(-1)
  if (!owner || !name) return createResultError(op, "Remote URL must contain owner and repository name")

  const repository = forgejoRepositoryIdentifierParse(`${owner}/${name}`)
  if (!repository.success) return repository

  const prefix = segments.slice(0, -2).join("/")
  const baseUrl = forgejoBaseUrlParse(`https://${url.host}${prefix ? `/${prefix}` : ""}`)
  if (!baseUrl.success) return baseUrl

  const parsed = a.safeParse(forgejoRemoteSchema, {
    url: url.toString(),
    baseUrl: baseUrl.data,
    repository: repository.data,
    protocol: url.protocol.slice(0, -1).toLowerCase(),
  })
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
