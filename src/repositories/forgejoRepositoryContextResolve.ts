import { execFile as nodeExecFile } from "node:child_process"
import { promisify } from "node:util"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoBaseUrlParse } from "../hosts/forgejoBaseUrlParse.js"
import type { ForgejoBaseUrl } from "../hosts/forgejoBaseUrlSchema.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"
import type { ForgejoHost } from "../hosts/forgejoHostSchema.js"
import { forgejoRemoteParse } from "../remotes/forgejoRemoteParse.js"
import type { ForgejoRemote } from "../remotes/forgejoRemoteSchema.js"
import { forgejoRepositoryIdentifierParse } from "./forgejoRepositoryIdentifierParse.js"
import type { ForgejoRepositoryIdentifier } from "./forgejoRepositoryIdentifierSchema.js"

type ForgejoProcessCommand = {
  command: string
  args: readonly string[]
  cwd?: string
  stdin?: string
}

type ForgejoProcessExecute = (input: ForgejoProcessCommand) => Promise<ForgejoResult<string>>

type ForgejoRepositoryContext = {
  baseUrl: ForgejoBaseUrl
  host: ForgejoHost
  repository: ForgejoRepositoryIdentifier
  remote?: ForgejoRemote
}

type ForgejoRepositoryContextResolveOptions = {
  repository?: unknown
  host?: unknown
  remote?: unknown
  cwd?: string
  env?: Record<string, string | undefined>
  execute?: ForgejoProcessExecute
}

const forgejoExecFile = promisify(nodeExecFile)

const forgejoProcessExecute: ForgejoProcessExecute = async ({ command, args, cwd }) => {
  try {
    const result = await forgejoExecFile(command, [...args], { cwd, encoding: "utf8" })
    return createResult(result.stdout)
  } catch {
    return createResultError("forgejoRepositoryContextResolve", "Unable to inspect the current Git repository")
  }
}

function forgejoRemoteHost(remote: ForgejoRemote): string {
  return new URL(remote.baseUrl).host
}

function forgejoRemoteOutputParse(output: string): ForgejoResult<ForgejoRemote> {
  const remoteUrl = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  if (!remoteUrl) return createResultError("forgejoRepositoryContextResolve", "Git remote has no URL")
  const remote = forgejoRemoteParse(remoteUrl)
  if (!remote.success)
    return createResultError("forgejoRepositoryContextResolve", "Git remote URL is not a Forgejo URL")
  return remote
}

async function forgejoGitRemoteGet(
  name: string,
  options: ForgejoRepositoryContextResolveOptions,
  execute: ForgejoProcessExecute,
): Promise<ForgejoResult<ForgejoRemote>> {
  const result = await execute({ command: "git", args: ["remote", "get-url", name], cwd: options.cwd })
  if (!result.success) return result
  return forgejoRemoteOutputParse(result.data)
}

async function forgejoGitRemotesGet(
  options: ForgejoRepositoryContextResolveOptions,
  execute: ForgejoProcessExecute,
): Promise<ForgejoResult<{ name: string; remote: ForgejoRemote }[]>> {
  const result = await execute({ command: "git", args: ["remote"], cwd: options.cwd })
  if (!result.success) return result
  const names = [
    ...new Set(
      result.data
        .split(/\r?\n/)
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ]
  const remotes: { name: string; remote: ForgejoRemote }[] = []
  for (const name of names) {
    const remote = await forgejoGitRemoteGet(name, options, execute)
    if (remote.success) remotes.push({ name, remote: remote.data })
  }
  return createResult(remotes)
}

function forgejoRemoteSelection(
  remotes: { name: string; remote: ForgejoRemote }[],
  host: ForgejoHost | undefined,
): { name: string; remote: ForgejoRemote } | undefined {
  const candidates = host ? remotes.filter(({ remote }) => forgejoRemoteHost(remote) === host) : remotes
  if (candidates.length === 0) return undefined
  if (candidates.length === 1) return candidates[0]
  return candidates.find(({ name }) => name === "upstream")
}

function forgejoRepositoryWithHost(
  repository: ForgejoRepositoryIdentifier,
  host: ForgejoHost,
): ForgejoRepositoryIdentifier {
  return { ...repository, host }
}

function forgejoRepositoryContextBaseUrl(
  hostInput: unknown,
): ForgejoResult<{ baseUrl: ForgejoBaseUrl; host: ForgejoHost }> {
  const baseUrl = forgejoBaseUrlParse(hostInput)
  if (!baseUrl.success) return createResultError("forgejoRepositoryContextResolve", "Forgejo host is invalid")
  const host = forgejoHostParse(baseUrl.data)
  if (!host.success) return createResultError("forgejoRepositoryContextResolve", "Forgejo host is invalid")
  return createResult({ baseUrl: baseUrl.data, host: host.data })
}

async function forgejoExplicitRemoteResolve(
  input: unknown,
  options: ForgejoRepositoryContextResolveOptions,
  execute: ForgejoProcessExecute,
): Promise<ForgejoResult<ForgejoRemote>> {
  const parsed = forgejoRemoteParse(input)
  if (parsed.success) return parsed
  if (typeof input !== "string" || !/^[A-Za-z0-9._-]+$/.test(input.trim()))
    return createResultError("forgejoRepositoryContextResolve", "Explicit Git remote is invalid")
  return forgejoGitRemoteGet(input.trim(), options, execute)
}

export async function forgejoRepositoryContextResolve(
  options: ForgejoRepositoryContextResolveOptions = {},
): Promise<ForgejoResult<ForgejoRepositoryContext>> {
  const op = "forgejoRepositoryContextResolve"
  const env = options.env ?? process.env
  const execute = options.execute ?? forgejoProcessExecute
  const repository = options.repository === undefined ? undefined : forgejoRepositoryIdentifierParse(options.repository)
  if (repository && !repository.success) return createResultError(op, repository.errorMessage)

  const explicitHost = options.host === undefined ? undefined : forgejoRepositoryContextBaseUrl(options.host)
  if (explicitHost && !explicitHost.success) return explicitHost
  const fallbackHostInput = env.FJ_FALLBACK_HOST
  const fallbackHost =
    explicitHost || !fallbackHostInput || fallbackHostInput.trim().length === 0
      ? undefined
      : forgejoRepositoryContextBaseUrl(fallbackHostInput)
  if (fallbackHost && !fallbackHost.success) return fallbackHost

  const explicitRemote =
    options.remote === undefined ? undefined : await forgejoExplicitRemoteResolve(options.remote, options, execute)
  if (explicitRemote && !explicitRemote.success)
    return createResultError(op, "Explicit Git remote could not be resolved")

  let selectedRemote: { name?: string; remote: ForgejoRemote } | undefined = explicitRemote?.success
    ? { remote: explicitRemote.data }
    : undefined
  const repositoryData = repository?.success ? repository.data : undefined
  const repositoryHost = repositoryData?.host ? forgejoRepositoryContextBaseUrl(repositoryData.host) : undefined
  if (repositoryHost && !repositoryHost.success) return repositoryHost
  const hostHint = explicitHost?.success
    ? explicitHost.data.host
    : repositoryHost?.data.host
      ? repositoryHost.data.host
      : fallbackHost?.data.host

  if (explicitHost?.success && repositoryHost?.success && explicitHost.data.host !== repositoryHost.data.host)
    return createResultError(op, "Repository does not match the requested Forgejo host")

  if (!selectedRemote && (!repositoryData || hostHint === undefined)) {
    const remotes = await forgejoGitRemotesGet(options, execute)
    if (!remotes.success) return createResultError(op, "Unable to inspect the current Git repository")
    const selection = forgejoRemoteSelection(remotes.data, hostHint)
    if (selection) selectedRemote = selection
    if (!selectedRemote && remotes.data.length > 0)
      return createResultError(op, "Unable to resolve a unique Forgejo Git remote")
  }

  if (selectedRemote && hostHint && forgejoRemoteHost(selectedRemote.remote) !== hostHint)
    return createResultError(op, "Git remote does not match the requested Forgejo host")

  const resolvedHost = hostHint ?? (selectedRemote ? forgejoRemoteHost(selectedRemote.remote) : undefined)
  if (!resolvedHost) return createResultError(op, "A Forgejo host or Git remote is required")
  const baseUrl = explicitHost?.success
    ? createResult(explicitHost.data)
    : repositoryHost?.success
      ? createResult(repositoryHost.data)
      : selectedRemote
        ? createResult({ baseUrl: selectedRemote.remote.baseUrl, host: resolvedHost })
        : fallbackHost?.success
          ? createResult(fallbackHost.data)
          : forgejoRepositoryContextBaseUrl(resolvedHost)
  if (!baseUrl.success) return baseUrl
  if (repositoryData) {
    return createResult({
      baseUrl: baseUrl.data.baseUrl,
      host: baseUrl.data.host,
      repository: forgejoRepositoryWithHost(repositoryData, baseUrl.data.host),
      ...(selectedRemote ? { remote: selectedRemote.remote } : {}),
    })
  }
  if (!selectedRemote) return createResultError(op, "A repository could not be resolved from Git")
  return createResult({
    baseUrl: baseUrl.data.baseUrl,
    host: baseUrl.data.host,
    repository: forgejoRepositoryWithHost(selectedRemote.remote.repository, baseUrl.data.host),
    remote: selectedRemote.remote,
  })
}

export type {
  ForgejoProcessCommand,
  ForgejoProcessExecute,
  ForgejoRepositoryContext,
  ForgejoRepositoryContextResolveOptions,
}
