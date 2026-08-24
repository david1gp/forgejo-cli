import { execFile as nodeExecFile } from "node:child_process"
import { promisify } from "node:util"
import { createResult, createResultError } from "#result"
import { forgejoDefaultsResolve } from "../configuration/forgejoDefaultsResolve.js"
import { forgejoEnvironmentDefaultsResolve } from "../configuration/forgejoEnvironmentDefaults.js"
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
  preferredName?: string,
): { name: string; remote: ForgejoRemote } | undefined {
  const candidates = host ? remotes.filter(({ remote }) => forgejoRemoteHost(remote) === host) : remotes
  if (candidates.length === 0) return undefined
  if (candidates.length === 1) return candidates[0]
  if (preferredName) {
    const preferred = candidates.find(({ name }) => name === preferredName)
    if (preferred) return preferred
  }
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
  const environmentDefaults = forgejoEnvironmentDefaultsResolve({ env, cwd: options.cwd })
  const defaults = await forgejoDefaultsResolve({ env, cwd: options.cwd })
  if (!defaults.success) return createResultError(op, defaults.errorMessage)
  const repository = options.repository === undefined ? undefined : forgejoRepositoryIdentifierParse(options.repository)
  if (repository && !repository.success) return createResultError(op, repository.errorMessage)
  const repositoryData = repository?.success ? repository.data : undefined
  const repositoryHost = repositoryData?.host ? forgejoRepositoryContextBaseUrl(repositoryData.host) : undefined
  if (repositoryHost && !repositoryHost.success) return repositoryHost

  const explicitHost = options.host === undefined ? undefined : forgejoRepositoryContextBaseUrl(options.host)
  if (explicitHost && !explicitHost.success) return explicitHost
  const forceHost =
    explicitHost || repositoryHost || !defaults.data.host
      ? undefined
      : forgejoRepositoryContextBaseUrl(defaults.data.host)
  if (forceHost && !forceHost.success) return forceHost

  const explicitRemote =
    options.remote === undefined ? undefined : await forgejoExplicitRemoteResolve(options.remote, options, execute)
  if (explicitRemote && !explicitRemote.success)
    return createResultError(op, "Explicit Git remote could not be resolved")

  let selectedRemote: { name?: string; remote: ForgejoRemote } | undefined = explicitRemote?.success
    ? { remote: explicitRemote.data }
    : undefined
  const preferredRemoteName = options.remote === undefined ? defaults.data.remote : undefined
  const hostHint = explicitHost?.success
    ? explicitHost.data.host
    : repositoryHost?.data.host
      ? repositoryHost.data.host
      : forceHost?.data.host

  if (explicitHost?.success && repositoryHost?.success && explicitHost.data.host !== repositoryHost.data.host)
    return createResultError(op, "Repository does not match the requested Forgejo host")

  const directoryRepositoryAvailable =
    environmentDefaults.repository !== undefined && defaults.data.organization !== undefined
  if (!selectedRemote && (!repositoryData || hostHint === undefined)) {
    const remotes = await forgejoGitRemotesGet(options, execute)
    if (!remotes.success) {
      if (
        !directoryRepositoryAvailable &&
        !repositoryData &&
        defaults.data.fallbackHost === undefined &&
        defaults.data.defaultHost === undefined
      )
        return createResultError(op, "Unable to inspect the current Git repository")
    } else {
      const selection = forgejoRemoteSelection(remotes.data, hostHint, preferredRemoteName)
      if (selection) selectedRemote = selection
      if (!selectedRemote && remotes.data.length > 0)
        return createResultError(op, "Unable to resolve a unique Forgejo Git remote")
    }
  }

  if (selectedRemote && hostHint && forgejoRemoteHost(selectedRemote.remote) !== hostHint)
    return createResultError(op, "Git remote does not match the requested Forgejo host")

  let resolvedRepository = repositoryData
  if (!resolvedRepository && !selectedRemote && directoryRepositoryAvailable) {
    const directoryRepository = forgejoRepositoryIdentifierParse(
      `${defaults.data.organization}/${environmentDefaults.repository}`,
    )
    if (!directoryRepository.success) return createResultError(op, directoryRepository.errorMessage)
    resolvedRepository = directoryRepository.data
  }

  const resolvedHost = hostHint ?? (selectedRemote ? forgejoRemoteHost(selectedRemote.remote) : undefined)
  let fallbackHost: ForgejoResult<{ baseUrl: ForgejoBaseUrl; host: ForgejoHost }> | undefined
  let defaultHost: ForgejoResult<{ baseUrl: ForgejoBaseUrl; host: ForgejoHost }> | undefined
  if (!explicitHost && !repositoryHost && !forceHost && !selectedRemote) {
    fallbackHost = defaults.data.fallbackHost ? forgejoRepositoryContextBaseUrl(defaults.data.fallbackHost) : undefined
    if (fallbackHost && !fallbackHost.success) return fallbackHost
    defaultHost =
      !fallbackHost && defaults.data.defaultHost
        ? forgejoRepositoryContextBaseUrl(defaults.data.defaultHost)
        : undefined
    if (defaultHost && !defaultHost.success) return defaultHost
  }
  const fallbackResolvedHost = fallbackHost?.success
    ? fallbackHost.data.host
    : defaultHost?.success
      ? defaultHost.data.host
      : undefined
  const finalHost = resolvedHost ?? fallbackResolvedHost
  if (!finalHost) return createResultError(op, "A Forgejo host or Git remote is required")
  const baseUrl = explicitHost?.success
    ? createResult(explicitHost.data)
    : repositoryHost?.success
      ? createResult(repositoryHost.data)
      : forceHost?.success
        ? createResult(forceHost.data)
        : selectedRemote
          ? createResult({ baseUrl: selectedRemote.remote.baseUrl, host: finalHost })
          : fallbackHost?.success
            ? createResult(fallbackHost.data)
            : defaultHost?.success
              ? createResult(defaultHost.data)
              : forgejoRepositoryContextBaseUrl(finalHost)
  if (!baseUrl.success) return baseUrl
  if (resolvedRepository) {
    return createResult({
      baseUrl: baseUrl.data.baseUrl,
      host: baseUrl.data.host,
      repository: forgejoRepositoryWithHost(resolvedRepository, baseUrl.data.host),
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
