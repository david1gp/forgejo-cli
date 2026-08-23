import { randomBytes } from "node:crypto"
import { createResult, createResultError } from "#result"
import { forgejoAuthWhoami } from "../auth/forgejoAuthWhoami.js"
import { forgejoOAuthAuthorizationCodePkceCreate } from "../auth/forgejoOAuthAuthorizationCodePkceCreate.js"
import { forgejoOAuthAuthorizationCodePkceExchange } from "../auth/forgejoOAuthAuthorizationCodePkceExchange.js"
import { forgejoOAuthClientIdResolve } from "../auth/forgejoOAuthClientIdResolve.js"
import { forgejoOAuthLoopbackReceiverCreate } from "../auth/forgejoOAuthLoopbackReceiverCreate.js"
import { forgejoClientCreate } from "../client/forgejoClientCreate.js"
import { forgejoEnvironmentDefaultsResolve } from "../configuration/forgejoEnvironmentDefaults.js"
import { forgejoConfigurationPathResolve } from "../configuration/forgejoConfigurationPathResolve.js"
import { forgejoCredentialsDefaultSshSet } from "../credentials/forgejoCredentialsDefaultSshSet.js"
import { forgejoCredentialsList } from "../credentials/forgejoCredentialsList.js"
import { forgejoCredentialsLogout } from "../credentials/forgejoCredentialsLogout.js"
import { forgejoCredentialsOAuthStore } from "../credentials/forgejoCredentialsOAuthStore.js"
import { forgejoCredentialsStore } from "../credentials/forgejoCredentialsStore.js"
import type { ForgejoOAuthLoopbackReceiver } from "../auth/forgejoOAuthLoopbackReceiverCreate.js"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRepository } from "../repositories/forgejoRepositorySchema.js"
import { forgejoCliVersion } from "../forgejoCliVersion.js"
import { forgejoRepositoryContextResolve } from "../repositories/forgejoRepositoryContextResolve.js"
import { forgejoRepositoryCloneMetadataGet } from "../repositories/forgejoRepositoryCloneMetadataGet.js"
import { forgejoRepositoryCreate } from "../repositories/forgejoRepositoryCreate.js"
import { forgejoRepositoryDelete } from "../repositories/forgejoRepositoryDelete.js"
import { forgejoRepositoryEdit } from "../repositories/forgejoRepositoryEdit.js"
import { forgejoRepositoryAvatarDelete } from "../repositories/forgejoRepositoryAvatarDelete.js"
import { forgejoRepositoryAvatarUpdate } from "../repositories/forgejoRepositoryAvatarUpdate.js"
import { forgejoRepositoryFork } from "../repositories/forgejoRepositoryFork.js"
import { forgejoRepositoryGet } from "../repositories/forgejoRepositoryGet.js"
import { forgejoRepositoryLabelCreate } from "../repositories/forgejoRepositoryLabelCreate.js"
import { forgejoRepositoryLabelDelete } from "../repositories/forgejoRepositoryLabelDelete.js"
import { forgejoRepositoryLabelEdit } from "../repositories/forgejoRepositoryLabelEdit.js"
import { forgejoRepositoryLabelsGet } from "../repositories/forgejoRepositoryLabelsGet.js"
import { forgejoRepositoryMigrate } from "../repositories/forgejoRepositoryMigrate.js"
import { forgejoRepositoryReadmeGet } from "../repositories/forgejoRepositoryReadmeGet.js"
import { forgejoRepositoryStar } from "../repositories/forgejoRepositoryStar.js"
import { forgejoRepositoryStarStatusGet } from "../repositories/forgejoRepositoryStarStatusGet.js"
import { forgejoRepositoryUnstar } from "../repositories/forgejoRepositoryUnstar.js"
import { forgejoRepositoryUnitsEdit } from "../repositories/forgejoRepositoryUnitsEdit.js"
import { forgejoRepositoryUnwatch } from "../repositories/forgejoRepositoryUnwatch.js"
import { forgejoRepositoryWatch } from "../repositories/forgejoRepositoryWatch.js"
import { forgejoRepositoryWatchStatusGet } from "../repositories/forgejoRepositoryWatchStatusGet.js"
import { forgejoSshUrlApplyBase } from "../urls/forgejoSshUrlApplyBase.js"
import { forgejoActionSecretCreate } from "../actions/forgejoActionSecretCreate.js"
import { forgejoActionSecretDelete } from "../actions/forgejoActionSecretDelete.js"
import { forgejoActionSecretList } from "../actions/forgejoActionSecretList.js"
import { forgejoActionTasksList } from "../actions/forgejoActionTasksList.js"
import { forgejoActionVariableCreate } from "../actions/forgejoActionVariableCreate.js"
import { forgejoActionVariableDelete } from "../actions/forgejoActionVariableDelete.js"
import { forgejoActionVariableList } from "../actions/forgejoActionVariableList.js"
import { forgejoActionWorkflowDispatch } from "../actions/forgejoActionWorkflowDispatch.js"
import { forgejoWikiCloneMetadataGet } from "../wiki/forgejoWikiCloneMetadataGet.js"
import { forgejoWikiContentsGet } from "../wiki/forgejoWikiContentsGet.js"
import { forgejoWikiPageGet } from "../wiki/forgejoWikiPageGet.js"
import { forgejoCliCompletionGenerate } from "./forgejoCliCompletionGenerate.js"
import { forgejoCliBrowserOpen } from "./forgejoCliBrowserOpen.js"
import { forgejoCliHelpRender } from "./forgejoCliHelpRender.js"
import { forgejoCliHostResolve } from "./forgejoCliHostResolve.js"
import { forgejoCliIssueRun } from "./forgejoCliIssueRun.js"
import { forgejoCliEditorOpen } from "./forgejoCliEditorOpen.js"
import { forgejoCliPullRequestRun } from "./forgejoCliPullRequestRun.js"
import { forgejoCliReleaseRun } from "./forgejoCliReleaseRun.js"
import { forgejoCliTagRun } from "./forgejoCliTagRun.js"
import { forgejoCliOrganizationRun } from "./forgejoCliOrganizationRun.js"
import { forgejoCliUserRun } from "./forgejoCliUserRun.js"
import { forgejoCliParse } from "./forgejoCliParse.js"
import { forgejoCliProcessExecute } from "./forgejoCliProcessExecute.js"
import { forgejoCliSshCommandCreate } from "./forgejoCliSshCommandCreate.js"
import { forgejoCliAvatarFileRead } from "./forgejoCliAvatarFileRead.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"

type ForgejoCliEnvironment = Record<string, string | undefined>

async function forgejoCliCwdApply(cwd: string | undefined) {
  if (cwd === undefined) return createResult(null)
  try {
    process.chdir(cwd)
    return createResult(null)
  } catch {
    return createResultError("forgejoCliRun", `Unable to change directory to '${cwd}'`)
  }
}

function forgejoCliOutputWrite(output: string, outputWrite?: ForgejoCliRunOptions["outputWrite"]) {
  if (outputWrite) return outputWrite(output)
  try {
    process.stdout.write(output)
    return createResult(null)
  } catch {
    return createResultError("forgejoCliRun", "Unable to write command output")
  }
}

function forgejoCliStylePrefix(style: "fancy" | "minimal", symbol: string): string {
  return style === "fancy" ? `${symbol} ` : ""
}

function forgejoCliOAuthStateCreate(): ForgejoResult<string> {
  try {
    return createResult(randomBytes(32).toString("base64url"))
  } catch {
    return createResultError("forgejoCliRun", "Unable to create OAuth state")
  }
}

async function forgejoCliOAuthReceiverClose(receiver: ForgejoOAuthLoopbackReceiver): Promise<void> {
  try {
    await receiver.close()
  } catch {
    // Receiver cleanup must not replace the authentication result.
  }
}

async function forgejoCliHostForInvocation(
  host: string | undefined,
  remote: string | undefined,
  cwd: string | undefined,
  env: ForgejoCliEnvironment,
) {
  return forgejoCliHostResolve({ host, remote, cwd, env })
}

async function forgejoCliWhoamiRun(
  host: string | undefined,
  remote: string | undefined,
  cwd: string | undefined,
  env: ForgejoCliEnvironment,
  style: "fancy" | "minimal",
) {
  const resolved = await forgejoCliHostForInvocation(host, remote, cwd, env)
  if (!resolved.success) return createResultError("forgejoCliRun", resolved.errorMessage)
  const client = await forgejoClientCreate({ baseUrl: resolved.data.baseUrl, env })
  if (!client.success) return createResultError("forgejoCliRun", client.errorMessage)
  const user = await forgejoAuthWhoami(client.data.transport)
  if (!user.success) return createResultError("forgejoCliRun", user.errorMessage)
  const name = user.data.login ?? user.data.username ?? user.data.full_name
  if (!name) return createResultError("forgejoCliRun", "Forgejo returned a user without a login name")
  const output = `${forgejoCliStylePrefix(style, "●")}${name} @ ${resolved.data.host}\n`
  return forgejoCliOutputWrite(output)
}

async function forgejoCliVersionRun(verbose: boolean, style: "fancy" | "minimal") {
  const lines = [`${forgejoCliStylePrefix(style, "◆")}fj v${forgejoCliVersion}`]
  if (verbose) {
    lines.push(`user agent: @adaptive-ds/forgejo-cli/${forgejoCliVersion}`)
    lines.push(`runtime: ${typeof Bun === "undefined" ? "node" : `bun ${Bun.version}`}`)
  }
  return forgejoCliOutputWrite(`${lines.join("\n")}\n`)
}

async function forgejoCliTokenStoreRun(
  host: string | undefined,
  cwd: string | undefined,
  token: string | undefined,
  env: ForgejoCliEnvironment,
  style: "fancy" | "minimal",
) {
  if (token === undefined) return createResultError("forgejoCliRun", "An application token is required")
  const resolved = await forgejoCliHostForInvocation(host, undefined, cwd, env)
  if (!resolved.success) return createResultError("forgejoCliRun", resolved.errorMessage)
  const stored = await forgejoCredentialsStore(resolved.data.baseUrl, token, {
    env,
    configurationPath: forgejoConfigurationPathResolve({ env }),
  })
  if (!stored.success) return createResultError("forgejoCliRun", stored.errorMessage)
  return forgejoCliOutputWrite(`${forgejoCliStylePrefix(style, "✓")}Stored token for ${resolved.data.host}\n`)
}

async function forgejoCliLoginRun(
  host: string | undefined,
  cwd: string | undefined,
  token: string | undefined,
  clientId: string | undefined,
  env: ForgejoCliEnvironment,
  style: "fancy" | "minimal",
  options: ForgejoCliRunOptions,
) {
  if (token !== undefined) return forgejoCliTokenStoreRun(host, cwd, token, env, style)

  const resolved = await forgejoCliHostForInvocation(host, undefined, cwd, env)
  if (!resolved.success) return createResultError("forgejoCliRun", resolved.errorMessage)
  const configurationPath = forgejoConfigurationPathResolve({ env })
  const resolvedClientId = await forgejoOAuthClientIdResolve({
    baseUrl: resolved.data.baseUrl,
    clientId,
    configurationPath,
    env,
  })
  if (!resolvedClientId.success) return createResultError("forgejoCliRun", resolvedClientId.errorMessage)

  const state = forgejoCliOAuthStateCreate()
  if (!state.success) return state
  const receiver = await (options.oauthLoopbackReceiverCreate ?? forgejoOAuthLoopbackReceiverCreate)({
    expectedState: state.data,
  })
  if (!receiver.success) return createResultError("forgejoCliRun", receiver.errorMessage)

  const pkce = forgejoOAuthAuthorizationCodePkceCreate({
    baseUrl: resolved.data.baseUrl,
    clientId: resolvedClientId.data,
    redirectUri: receiver.data.redirectUri,
    state: state.data,
  })
  if (!pkce.success) {
    await forgejoCliOAuthReceiverClose(receiver.data)
    return createResultError("forgejoCliRun", pkce.errorMessage)
  }

  const opened = await (options.browserOpen ?? forgejoCliBrowserOpen)(pkce.data.authorizationUrl)
  if (!opened.success) {
    await forgejoCliOAuthReceiverClose(receiver.data)
    return createResultError("forgejoCliRun", opened.errorMessage)
  }

  const callback = await receiver.data.wait()
  await forgejoCliOAuthReceiverClose(receiver.data)
  if (!callback.success) return createResultError("forgejoCliRun", callback.errorMessage)
  const exchanged = await forgejoOAuthAuthorizationCodePkceExchange({
    baseUrl: resolved.data.baseUrl,
    clientId: resolvedClientId.data,
    redirectUri: receiver.data.redirectUri,
    code: callback.data,
    codeVerifier: pkce.data.codeVerifier,
    fetch: options.fetch,
  })
  if (!exchanged.success) return createResultError("forgejoCliRun", exchanged.errorMessage)

  const client = await forgejoClientCreate({
    baseUrl: resolved.data.baseUrl,
    token: exchanged.data.access_token,
    env,
    fetch: options.fetch,
  })
  if (!client.success) return createResultError("forgejoCliRun", client.errorMessage)
  const user = await forgejoAuthWhoami(client.data.transport)
  if (!user.success) return createResultError("forgejoCliRun", user.errorMessage)
  const name = user.data.login ?? user.data.username ?? user.data.full_name
  if (!name) return createResultError("forgejoCliRun", "Forgejo returned a user without a login name")

  const stored = await forgejoCredentialsOAuthStore(
    resolved.data.baseUrl,
    { access_token: exchanged.data.access_token },
    { env, configurationPath },
  )
  if (!stored.success) return createResultError("forgejoCliRun", stored.errorMessage)
  return forgejoCliOutputWrite(
    `${forgejoCliStylePrefix(style, "✓")}Logged in as ${name} @ ${resolved.data.host}\n`,
    options.outputWrite,
  )
}

async function forgejoCliLogoutRun(
  host: string | undefined,
  cwd: string | undefined,
  env: ForgejoCliEnvironment,
  style: "fancy" | "minimal",
) {
  const resolved = await forgejoCliHostForInvocation(host, undefined, cwd, env)
  if (!resolved.success) return createResultError("forgejoCliRun", resolved.errorMessage)
  const loggedOut = await forgejoCredentialsLogout(resolved.data.baseUrl, {
    env,
    configurationPath: forgejoConfigurationPathResolve({ env }),
  })
  if (!loggedOut.success) return createResultError("forgejoCliRun", loggedOut.errorMessage)
  return forgejoCliOutputWrite(`${forgejoCliStylePrefix(style, "✓")}Logged out of ${resolved.data.host}\n`)
}

async function forgejoCliUseSshRun(
  host: string | undefined,
  cwd: string | undefined,
  useSsh: boolean,
  env: ForgejoCliEnvironment,
  style: "fancy" | "minimal",
) {
  const resolved = await forgejoCliHostForInvocation(host, undefined, cwd, env)
  if (!resolved.success) return createResultError("forgejoCliRun", resolved.errorMessage)
  const updated = await forgejoCredentialsDefaultSshSet(resolved.data.baseUrl, useSsh, {
    env,
    configurationPath: forgejoConfigurationPathResolve({ env }),
  })
  if (!updated.success) return createResultError("forgejoCliRun", updated.errorMessage)
  const state = useSsh ? "enabled" : "disabled"
  return forgejoCliOutputWrite(
    `${forgejoCliStylePrefix(style, "✓")}SSH preference ${state} for ${resolved.data.host}\n`,
  )
}

async function forgejoCliAuthListRun(env: ForgejoCliEnvironment, style: "fancy" | "minimal") {
  const hosts = await forgejoCredentialsList({
    env,
    configurationPath: forgejoConfigurationPathResolve({ env }),
  })
  if (!hosts.success) return createResultError("forgejoCliRun", hosts.errorMessage)
  if (hosts.data.length === 0)
    return forgejoCliOutputWrite(`${forgejoCliStylePrefix(style, "·")}No stored Forgejo credentials.\n`)
  return forgejoCliOutputWrite(
    `${hosts.data.map((host) => `${forgejoCliStylePrefix(style, "•")}${host}`).join("\n")}\n`,
  )
}

type ForgejoCliInvocation = Extract<ReturnType<typeof forgejoCliParse>, { success: true }>["data"]

type ForgejoCliRepositoryInvocation = Extract<ForgejoCliInvocation, { kind: `repo-${string}` }>
type ForgejoCliRepositoryRunOptions = ForgejoCliRunOptions & { env: ForgejoCliEnvironment }

function forgejoCliJsonWrite(value: unknown, outputWrite?: ForgejoCliRunOptions["outputWrite"]) {
  try {
    return forgejoCliOutputWrite(`${JSON.stringify(value)}\n`, outputWrite)
  } catch {
    return createResultError("forgejoCliRun", "Unable to serialize command output")
  }
}

function forgejoCliHumanMessage(
  message: string,
  style: "fancy" | "minimal",
  outputWrite?: ForgejoCliRunOptions["outputWrite"],
) {
  return forgejoCliOutputWrite(`${forgejoCliStylePrefix(style, "✓")}${message}\n`, outputWrite)
}

function forgejoCliRepositoryHuman(repository: Record<string, unknown>, style: "fancy" | "minimal"): string {
  const fullName =
    typeof repository.full_name === "string"
      ? repository.full_name
      : typeof repository.name === "string"
        ? repository.name
        : "repository"
  const lines = [`${forgejoCliStylePrefix(style, "●")}${fullName}`]
  if (typeof repository.description === "string" && repository.description.length > 0)
    lines.push(repository.description)
  const stats = [
    ["stars", repository.stars_count],
    ["watchers", repository.watchers_count],
    ["forks", repository.forks_count],
    ["issues", repository.open_issues_count],
    ["pull requests", repository.open_pr_counter],
    ["releases", repository.release_counter],
  ]
    .filter(([, value]) => typeof value === "number")
    .map(([name, value]) => `${name}: ${value}`)
  if (stats.length > 0) lines.push(stats.join(" · "))
  if (repository.archived === true) lines.push("archived")
  if (typeof repository.html_url === "string") lines.push(repository.html_url)
  return `${lines.join("\n")}\n`
}

function forgejoCliRepositoryWrite(
  value: unknown,
  style: "fancy" | "minimal",
  json: boolean | undefined,
  outputWrite?: ForgejoCliRunOptions["outputWrite"],
) {
  if (json) return forgejoCliJsonWrite(value, outputWrite)
  if (typeof value === "string") return forgejoCliOutputWrite(value.endsWith("\n") ? value : `${value}\n`, outputWrite)
  if (typeof value === "boolean") return forgejoCliOutputWrite(`${value ? "true" : "false"}\n`, outputWrite)
  if (value === null || value === undefined) return forgejoCliHumanMessage("Done", style, outputWrite)
  if (Array.isArray(value)) {
    return forgejoCliOutputWrite(
      value
        .map((item) => {
          if (typeof item !== "object" || item === null) return String(item)
          const record = item as Record<string, unknown>
          return typeof record.full_name === "string"
            ? record.full_name
            : typeof record.name === "string"
              ? record.name
              : JSON.stringify(item)
        })
        .join("\n") + (value.length > 0 ? "\n" : ""),
      outputWrite,
    )
  }
  if (typeof value === "object")
    return forgejoCliOutputWrite(forgejoCliRepositoryHuman(value as Record<string, unknown>, style), outputWrite)
  return forgejoCliOutputWrite(`${String(value)}\n`, outputWrite)
}

function forgejoCliActionWrite(
  value: Record<string, unknown>,
  message: string,
  style: "fancy" | "minimal",
  json: boolean | undefined,
  outputWrite?: ForgejoCliRunOptions["outputWrite"],
) {
  if (json) return forgejoCliJsonWrite(value, outputWrite)
  return forgejoCliHumanMessage(message, style, outputWrite)
}

async function forgejoCliRepositoryContext(
  repository: string | undefined,
  host: string | undefined,
  remote: string | undefined,
  cwd: string | undefined,
  options: ForgejoCliRepositoryRunOptions,
) {
  const context = await forgejoRepositoryContextResolve({
    repository,
    host,
    remote,
    cwd,
    env: options.env,
    execute: options.execute,
  })
  if (!context.success) return createResultError("forgejoCliRun", context.errorMessage)
  const client = await forgejoClientCreate({ baseUrl: context.data.baseUrl, env: options.env, fetch: options.fetch })
  if (!client.success) return createResultError("forgejoCliRun", client.errorMessage)
  return createResult({ context: context.data, client: client.data })
}

async function forgejoCliHostClient(
  host: string | undefined,
  remote: string | undefined,
  cwd: string | undefined,
  options: ForgejoCliRepositoryRunOptions,
) {
  const resolved = await forgejoCliHostForInvocation(host, remote, cwd, options.env)
  if (!resolved.success) return createResultError("forgejoCliRun", resolved.errorMessage)
  const client = await forgejoClientCreate({ baseUrl: resolved.data.baseUrl, env: options.env, fetch: options.fetch })
  if (!client.success) return createResultError("forgejoCliRun", client.errorMessage)
  return createResult({ host: resolved.data, client: client.data })
}

function forgejoCliMigrateInclude(value: string | undefined): Record<string, boolean> | undefined {
  if (value === undefined) return undefined
  const include: Record<string, boolean> = {}
  for (const item of value.split(",")) {
    const name = item.trim()
    if (name.length === 0) continue
    const key = name === "pull-requests" ? "pullRequests" : name
    if (["lfs", "wiki", "issues", "pullRequests", "milestones", "labels", "releases"].includes(key)) include[key] = true
  }
  return include
}

async function forgejoCliConfirm(
  message: string,
  yes: boolean,
  options: ForgejoCliRepositoryRunOptions,
  outputWrite?: ForgejoCliRunOptions["outputWrite"],
): Promise<ForgejoResult<boolean>> {
  if (yes) return createResult(true)
  if (options.confirm) return createResult(await options.confirm(message))
  if (!process.stdin.isTTY)
    return createResultError("forgejoCliRun", "Confirmation is required; use --yes or --force in non-interactive mode")
  const prompt = forgejoCliOutputWrite(`${message} [y/N] `, outputWrite)
  if (!prompt.success) return prompt
  return await new Promise((resolve) => {
    process.stdin.once("data", (data) => resolve(createResult(/^y(es)?$/i.test(String(data).trim()))))
  })
}

async function forgejoCliRepositoryRun(
  invocation: ForgejoCliRepositoryInvocation,
  options: ForgejoCliRepositoryRunOptions,
): Promise<ForgejoResult<null>> {
  const outputWrite = options.outputWrite
  const style = invocation.style
  const json = invocation.json
  const execute = options.execute ?? forgejoCliProcessExecute
  const environmentDefaults = forgejoEnvironmentDefaultsResolve({ env: options.env, cwd: invocation.cwd })

  if (invocation.kind === "repo-create") {
    const host = await forgejoCliHostClient(invocation.host, invocation.remote, invocation.cwd, options)
    if (!host.success) return host
    const created = await forgejoRepositoryCreate(host.data.client.transport, {
      name: invocation.name,
      organization: invocation.organization ?? environmentDefaults.organization,
      description: invocation.description,
      private: invocation.private,
      autoInit: false,
      defaultBranch: "main",
      readme: "",
      template: false,
    })
    if (!created.success) return createResultError("forgejoCliRun", created.errorMessage)
    const localRemote = invocation.remote ?? (invocation.push ? "origin" : undefined)
    if (localRemote) {
      const selectedUrl = invocation.ssh === true ? created.data.ssh_url : created.data.clone_url
      if (typeof selectedUrl !== "string")
        return createResultError("forgejoCliRun", "Forgejo did not return a clone URL")
      const url =
        invocation.ssh === true ? forgejoSshUrlApplyBase(selectedUrl, environmentDefaults.sshBase) : selectedUrl
      const added = await execute({
        command: "git",
        args: ["remote", "add", localRemote, url],
        cwd: invocation.cwd,
      })
      if (!added.success) return createResultError("forgejoCliRun", added.errorMessage)
      if (invocation.push) {
        const pushed = await execute({ command: "git", args: ["push", localRemote, "HEAD"], cwd: invocation.cwd })
        if (!pushed.success) return createResultError("forgejoCliRun", pushed.errorMessage)
      }
    }
    return forgejoCliRepositoryWrite(created.data, style, json, outputWrite)
  }

  if (invocation.kind === "repo-migrate") {
    const host = await forgejoCliHostClient(invocation.host, undefined, invocation.cwd, options)
    if (!host.success) return host
    const migrated = await forgejoRepositoryMigrate(host.data.client.transport, {
      cloneAddr: invocation.cloneAddr,
      repoName: invocation.repoName,
      repoOwner: invocation.repoOwner ?? environmentDefaults.organization,
      mirror: invocation.mirror,
      private: invocation.private,
      service: invocation.service,
      lfsEndpoint: invocation.lfsEndpoint,
      mirrorInterval: invocation.mirrorInterval,
      authUsername: invocation.authUsername,
      authPassword: invocation.authPassword,
      authToken: invocation.authToken,
      include: forgejoCliMigrateInclude(invocation.include),
    })
    if (!migrated.success) return createResultError("forgejoCliRun", migrated.errorMessage)
    return forgejoCliRepositoryWrite(migrated.data, style, json, outputWrite)
  }

  if ((invocation.kind === "repo-star-status" || invocation.kind === "repo-watch-status") && invocation.list) {
    const host = await forgejoCliHostClient(invocation.host, invocation.remote, invocation.cwd, options)
    if (!host.success) return host
    const path = invocation.kind === "repo-star-status" ? "/api/v1/user/starred" : "/api/v1/user/subscriptions"
    const response = await host.data.client.transport.request({ path })
    if (!response.success) return createResultError("forgejoCliRun", response.errorMessage)
    return forgejoCliRepositoryWrite(response.data.data, style, json, outputWrite)
  }

  const repositoryInput = "repository" in invocation ? invocation.repository : undefined
  const remoteInput = "remote" in invocation ? invocation.remote : undefined
  const context = await forgejoCliRepositoryContext(
    repositoryInput,
    invocation.host,
    remoteInput,
    invocation.cwd,
    options,
  )
  if (!context.success) return context
  const repository = context.data.context.repository
  const transport = context.data.client.transport

  if (invocation.kind === "repo-fork") {
    const forked = await forgejoRepositoryFork(transport, repository, {
      name: invocation.name,
      organization: invocation.organization ?? environmentDefaults.organization,
    })
    if (!forked.success) return createResultError("forgejoCliRun", forked.errorMessage)
    return forgejoCliRepositoryWrite(forked.data, style, json, outputWrite)
  }
  if (invocation.kind === "repo-view") {
    const viewed = await forgejoRepositoryGet(transport, repository)
    if (!viewed.success) return createResultError("forgejoCliRun", viewed.errorMessage)
    return forgejoCliRepositoryWrite(viewed.data, style, json, outputWrite)
  }
  if (invocation.kind === "repo-readme") {
    const readme = await forgejoRepositoryReadmeGet(transport, repository)
    if (!readme.success) return createResultError("forgejoCliRun", readme.errorMessage)
    return forgejoCliRepositoryWrite(readme.data, style, json, outputWrite)
  }
  if (invocation.kind === "repo-browse") {
    const url = `${context.data.client.baseUrl}${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`
    const opened = await (options.browserOpen ?? forgejoCliBrowserOpen)(url)
    if (!opened.success) return createResultError("forgejoCliRun", opened.errorMessage)
    return forgejoCliActionWrite({ opened: true, url }, `Opened ${url}`, style, json, outputWrite)
  }
  if (invocation.kind === "repo-clone") {
    const metadata = await forgejoRepositoryCloneMetadataGet(transport, repository)
    if (!metadata.success) return createResultError("forgejoCliRun", metadata.errorMessage)
    const selectedUrl = invocation.ssh === true ? metadata.data.sshUrl : metadata.data.cloneUrl
    if (!selectedUrl) return createResultError("forgejoCliRun", "Forgejo did not return the requested clone URL")
    const url = invocation.ssh === true ? forgejoSshUrlApplyBase(selectedUrl, environmentDefaults.sshBase) : selectedUrl
    const cloneName = metadata.data.name ?? repository.name
    const destination = invocation.path ?? `./${cloneName}`
    const args = [
      "clone",
      ...(invocation.identityFile
        ? ["-c", `core.sshCommand=${forgejoCliSshCommandCreate(invocation.identityFile)}`]
        : []),
      url,
      destination,
    ]
    const cloned = await execute({ command: "git", args, cwd: invocation.cwd })
    if (!cloned.success) return createResultError("forgejoCliRun", cloned.errorMessage)
    if (typeof metadata.data.parent === "object" && metadata.data.parent !== null) {
      const parent = metadata.data.parent as Record<string, unknown>
      const upstreamUrl = invocation.ssh === true ? parent.ssh_url : parent.clone_url
      if (typeof upstreamUrl === "string") {
        const remoteUrl =
          invocation.ssh === true ? forgejoSshUrlApplyBase(upstreamUrl, environmentDefaults.sshBase) : upstreamUrl
        const upstream = await execute({
          command: "git",
          args: ["remote", "add", "upstream", remoteUrl],
          cwd: destination,
        })
        if (!upstream.success) return createResultError("forgejoCliRun", upstream.errorMessage)
      }
    }
    return forgejoCliActionWrite(
      { cloned: true, repository: metadata.data.fullName ?? repository.name, path: destination },
      `Cloned ${metadata.data.fullName ?? repository.name} into ${destination}`,
      style,
      json,
      outputWrite,
    )
  }
  if (
    invocation.kind === "repo-star" ||
    invocation.kind === "repo-unstar" ||
    invocation.kind === "repo-watch" ||
    invocation.kind === "repo-unwatch"
  ) {
    const action =
      invocation.kind === "repo-star"
        ? forgejoRepositoryStar
        : invocation.kind === "repo-unstar"
          ? forgejoRepositoryUnstar
          : invocation.kind === "repo-watch"
            ? forgejoRepositoryWatch
            : forgejoRepositoryUnwatch
    const changed = await action(transport, repository)
    if (!changed.success) return createResultError("forgejoCliRun", changed.errorMessage)
    const noun = invocation.kind.includes("star") ? "star" : "watch"
    const verb = invocation.kind.includes("un") ? `Removed ${noun} from` : `Added ${noun} to`
    return forgejoCliActionWrite(
      {
        action: noun,
        repository: `${repository.owner}/${repository.name}`,
        starred: invocation.kind === "repo-star",
        watched: invocation.kind === "repo-watch",
      },
      `${verb} ${repository.owner}/${repository.name}`,
      style,
      json,
      outputWrite,
    )
  }
  if (invocation.kind === "repo-star-status" || invocation.kind === "repo-watch-status") {
    const status =
      invocation.kind === "repo-star-status"
        ? await forgejoRepositoryStarStatusGet(transport, repository)
        : await forgejoRepositoryWatchStatusGet(transport, repository)
    if (!status.success) return createResultError("forgejoCliRun", status.errorMessage)
    return forgejoCliRepositoryWrite(status.data, style, json, outputWrite)
  }
  if (invocation.kind === "repo-delete") {
    const confirmation = await forgejoCliConfirm(
      `Delete ${repository.owner}/${repository.name}?`,
      invocation.yes,
      options,
      outputWrite,
    )
    if (!confirmation.success) return confirmation
    if (!confirmation.data) return forgejoCliActionWrite({ cancelled: true }, "Cancelled", style, json, outputWrite)
    const deleted = await forgejoRepositoryDelete(transport, repository)
    if (!deleted.success) return createResultError("forgejoCliRun", deleted.errorMessage)
    return forgejoCliActionWrite(
      { deleted: true, repository: `${repository.owner}/${repository.name}` },
      `Deleted ${repository.owner}/${repository.name}`,
      style,
      json,
      outputWrite,
    )
  }
  if (invocation.kind === "repo-label-view") {
    const labels = await forgejoRepositoryLabelsGet(transport, repository, { includeArchived: invocation.archived })
    if (!labels.success) return createResultError("forgejoCliRun", labels.errorMessage)
    if (json) return forgejoCliJsonWrite(labels.data, outputWrite)
    return forgejoCliOutputWrite(
      labels.data.map((label) => `${label.id ?? "-"}\t${label.name ?? ""}\t${label.color ?? ""}`).join("\n") +
        (labels.data.length > 0 ? "\n" : ""),
      outputWrite,
    )
  }
  if (invocation.kind === "repo-label-create") {
    const label = await forgejoRepositoryLabelCreate(transport, repository, {
      name: invocation.name,
      color: invocation.color,
      description: invocation.description,
      exclusive: invocation.exclusive,
      archived: invocation.archived,
    })
    if (!label.success) return createResultError("forgejoCliRun", label.errorMessage)
    return forgejoCliRepositoryWrite(label.data, style, json, outputWrite)
  }
  if (invocation.kind === "repo-label-delete") {
    const confirmation = await forgejoCliConfirm(
      `Delete label ${invocation.label}?`,
      invocation.yes,
      options,
      outputWrite,
    )
    if (!confirmation.success) return confirmation
    if (!confirmation.data) return forgejoCliActionWrite({ cancelled: true }, "Cancelled", style, json, outputWrite)
    const deleted = await forgejoRepositoryLabelDelete(transport, repository, invocation.label)
    if (!deleted.success) return createResultError("forgejoCliRun", deleted.errorMessage)
    return forgejoCliActionWrite(
      { deleted: true, label: invocation.label },
      `Deleted label ${invocation.label}`,
      style,
      json,
      outputWrite,
    )
  }
  if (invocation.kind === "repo-label-edit") {
    const label = await forgejoRepositoryLabelEdit(transport, repository, invocation.label, {
      name: invocation.name,
      color: invocation.color,
      description: invocation.description,
      exclusive: invocation.exclusive,
      archived: invocation.archived,
    })
    if (!label.success) return createResultError("forgejoCliRun", label.errorMessage)
    return forgejoCliRepositoryWrite(label.data, style, json, outputWrite)
  }
  if (invocation.kind === "repo-edit") {
    const { avatar, unsetAvatar, ...metadataOptions } = invocation.options
    let edited: ForgejoRepository | undefined
    if (Object.keys(metadataOptions).length > 0) {
      const metadata = await forgejoRepositoryEdit(transport, repository, metadataOptions)
      if (!metadata.success) return createResultError("forgejoCliRun", metadata.errorMessage)
      edited = metadata.data
    }
    if (typeof avatar === "string") {
      const file = await forgejoCliAvatarFileRead(avatar, options.fileRead)
      if (!file.success) return file
      const updated = await forgejoRepositoryAvatarUpdate(transport, repository, {
        image: Buffer.from(file.data).toString("base64"),
      })
      if (!updated.success) return createResultError("forgejoCliRun", updated.errorMessage)
    }
    if (unsetAvatar === true) {
      const deleted = await forgejoRepositoryAvatarDelete(transport, repository)
      if (!deleted.success) return createResultError("forgejoCliRun", deleted.errorMessage)
    }
    if (edited !== undefined) return forgejoCliRepositoryWrite(edited, style, json, outputWrite)
    if (typeof avatar !== "string" && unsetAvatar !== true)
      return forgejoCliRepositoryWrite(null, style, json, outputWrite)
    const action = {
      avatar: typeof avatar === "string" ? "updated" : "unset",
      repository: `${repository.owner}/${repository.name}`,
    }
    return forgejoCliActionWrite(action, `Updated avatar for ${action.repository}`, style, json, outputWrite)
  }
  if (invocation.kind === "repo-units") {
    const unitOptions: Record<string, unknown> = { ...invocation.options }
    if (unitOptions.enable !== undefined) {
      unitOptions[invocation.unit === "prs" ? "pullRequests" : invocation.unit] = unitOptions.enable
      delete unitOptions.enable
    }
    const edited = await forgejoRepositoryUnitsEdit(transport, repository, unitOptions)
    if (!edited.success) return createResultError("forgejoCliRun", edited.errorMessage)
    return forgejoCliRepositoryWrite(edited.data, style, json, outputWrite)
  }
  return createResultError("forgejoCliRun", `Unsupported repository command '${invocation.kind}'`)
}

type ForgejoCliWikiInvocation = Extract<ForgejoCliInvocation, { kind: `wiki-${string}` }>
type ForgejoCliActionsInvocation = Extract<ForgejoCliInvocation, { kind: `actions-${string}` }>

function forgejoCliWikiContentDecode(value: string): ForgejoResult<string> {
  try {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0)
      return createResultError("forgejoCliRun", "Wiki page content is not valid base64")
    return createResult(Buffer.from(value, "base64").toString("utf8"))
  } catch {
    return createResultError("forgejoCliRun", "Unable to decode wiki page content")
  }
}

async function forgejoCliWikiRun(
  invocation: ForgejoCliWikiInvocation,
  options: ForgejoCliRepositoryRunOptions,
): Promise<ForgejoResult<null>> {
  const environmentDefaults = forgejoEnvironmentDefaultsResolve({ env: options.env, cwd: invocation.cwd })
  const context = await forgejoCliRepositoryContext(
    invocation.repository,
    invocation.host,
    invocation.remote,
    invocation.cwd,
    options,
  )
  if (!context.success) return context
  const repository = context.data.context.repository
  const transport = context.data.client.transport
  if (invocation.kind === "wiki-contents") {
    const pages = await forgejoWikiContentsGet(transport, repository)
    if (!pages.success) return createResultError("forgejoCliRun", pages.errorMessage)
    if (invocation.json) return forgejoCliJsonWrite(pages.data, options.outputWrite)
    const titles: string[] = []
    for (const page of pages.data) {
      if (!page.title) return createResultError("forgejoCliRun", "Wiki page does not have a title")
      titles.push(`${forgejoCliStylePrefix(invocation.style, "•")}${page.title}`)
    }
    return forgejoCliOutputWrite(`${titles.join("\n")}${titles.length > 0 ? "\n" : ""}`, options.outputWrite)
  }
  if (invocation.kind === "wiki-view" || invocation.kind === "wiki-browse") {
    const page = await forgejoWikiPageGet(transport, repository, invocation.page)
    if (!page.success) return createResultError("forgejoCliRun", page.errorMessage)
    if (invocation.kind === "wiki-browse") {
      if (!page.data.html_url) return createResultError("forgejoCliRun", "Wiki page does not have an HTML URL")
      const opened = await (options.browserOpen ?? forgejoCliBrowserOpen)(page.data.html_url)
      if (!opened.success) return createResultError("forgejoCliRun", opened.errorMessage)
      return forgejoCliActionWrite(
        { opened: true, url: page.data.html_url },
        `Opened ${page.data.html_url}`,
        invocation.style,
        invocation.json,
        options.outputWrite,
      )
    }
    if (invocation.json) return forgejoCliJsonWrite(page.data, options.outputWrite)
    if (!page.data.title) return createResultError("forgejoCliRun", "Wiki page does not have a title")
    if (!page.data.content_base64) return createResultError("forgejoCliRun", "Wiki page does not have content")
    const content = forgejoCliWikiContentDecode(page.data.content_base64)
    if (!content.success) return content
    return forgejoCliOutputWrite(
      `${page.data.title}\n\n${content.data}${content.data.endsWith("\n") ? "" : "\n"}`,
      options.outputWrite,
    )
  }
  const metadata = await forgejoWikiCloneMetadataGet(transport, repository)
  if (!metadata.success) return createResultError("forgejoCliRun", metadata.errorMessage)
  const selectedUrl = invocation.ssh === true ? metadata.data.sshUrl : metadata.data.cloneUrl
  if (!selectedUrl) return createResultError("forgejoCliRun", "Forgejo did not return the requested wiki clone URL")
  const url = invocation.ssh === true ? forgejoSshUrlApplyBase(selectedUrl, environmentDefaults.sshBase) : selectedUrl
  const destination = invocation.path ?? `./${metadata.data.name ?? repository.name}-wiki`
  const execute = options.execute ?? forgejoCliProcessExecute
  const cloned = await execute({
    command: "git",
    args: [
      "clone",
      ...(invocation.identityFile
        ? ["-c", `core.sshCommand=${forgejoCliSshCommandCreate(invocation.identityFile)}`]
        : []),
      url,
      destination,
    ],
    cwd: invocation.cwd,
  })
  if (!cloned.success) return createResultError("forgejoCliRun", cloned.errorMessage)
  return forgejoCliActionWrite(
    { cloned: true, repository: metadata.data.fullName ?? repository.name, path: destination },
    `Cloned ${metadata.data.fullName ?? repository.name} wiki into ${destination}`,
    invocation.style,
    invocation.json,
    options.outputWrite,
  )
}

function forgejoCliActionsTaskText(task: Record<string, unknown>, style: "fancy" | "minimal"): string {
  const status = typeof task.status === "string" ? task.status : "?"
  const run = typeof task.run_number === "number" ? `#${task.run_number}` : "#0"
  const sha = typeof task.head_sha === "string" ? task.head_sha.slice(0, 10) : ""
  const name = typeof task.name === "string" ? task.name : ""
  const event = typeof task.event === "string" ? task.event : ""
  const title = typeof task.display_title === "string" ? task.display_title : ""
  const start = typeof task.run_started_at === "string" ? Date.parse(task.run_started_at) : Number.NaN
  const end = typeof task.updated_at === "string" ? Date.parse(task.updated_at) : Number.NaN
  const duration =
    Number.isFinite(start) && Number.isFinite(end) && end >= start ? ` ${Math.round((end - start) / 1000)}s` : ""
  const marker =
    style === "fancy"
      ? status === "success"
        ? "✓"
        : status === "failure"
          ? "×"
          : status === "running"
            ? "●"
            : "!"
      : status
  return `${run}${sha ? ` (${sha})` : ""} ${marker} ${name}${duration} ${event}: ${title}`.trimEnd()
}

async function forgejoCliActionsRun(
  invocation: ForgejoCliActionsInvocation,
  options: ForgejoCliRepositoryRunOptions,
): Promise<ForgejoResult<null>> {
  const context = await forgejoCliRepositoryContext(
    invocation.repository,
    invocation.host,
    invocation.remote,
    invocation.cwd,
    options,
  )
  if (!context.success) return context
  const repository = context.data.context.repository
  const transport = context.data.client.transport
  if (invocation.kind === "actions-tasks") {
    const tasks = await forgejoActionTasksList(transport, repository, { page: invocation.page, limit: 20 })
    if (!tasks.success) return createResultError("forgejoCliRun", tasks.errorMessage)
    if (invocation.json) return forgejoCliJsonWrite(tasks.data, options.outputWrite)
    const runs = tasks.data.workflow_runs ?? []
    const count = tasks.data.total_count ?? 0
    const lines = [
      `${count} ${count === 1 ? "task" : "tasks"}`,
      ...runs.map((task) => forgejoCliActionsTaskText(task, invocation.style)),
    ]
    return forgejoCliOutputWrite(`${lines.join("\n")}\n`, options.outputWrite)
  }
  if (invocation.kind === "actions-variables-list") {
    const variables = await forgejoActionVariableList(transport, repository)
    if (!variables.success) return createResultError("forgejoCliRun", variables.errorMessage)
    if (invocation.json) return forgejoCliJsonWrite(variables.data, options.outputWrite)
    const lines = variables.data.map((variable) => {
      const name = variable.name ?? "?"
      const value = invocation.verbose && variable.data !== undefined ? ` = ${variable.data}` : ""
      const ids = invocation.verbose ? `(${variable.owner_id ?? "?"}, ${variable.repo_id ?? "?"}) ` : ""
      return `${ids}${name}${value}`
    })
    return forgejoCliOutputWrite(`${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`, options.outputWrite)
  }
  if (invocation.kind === "actions-secrets-list") {
    const secrets = await forgejoActionSecretList(transport, repository)
    if (!secrets.success) return createResultError("forgejoCliRun", secrets.errorMessage)
    if (invocation.json) return forgejoCliJsonWrite(secrets.data, options.outputWrite)
    const lines = secrets.data.map((secret) => `(${secret.created_at ?? "?"}) ${secret.name ?? "?"}`)
    return forgejoCliOutputWrite(`${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`, options.outputWrite)
  }
  if (invocation.kind === "actions-variables-create") {
    const data =
      invocation.data === undefined
        ? await (options.editor ?? ((initial, extension) => forgejoCliEditorOpen(initial, options.env)))(
            "",
            "variable_content.txt",
          )
        : createResult(invocation.data)
    if (!data.success) return data
    const created = await forgejoActionVariableCreate(
      transport,
      repository,
      invocation.name,
      data.data,
      invocation.force,
    )
    if (!created.success) return createResultError("forgejoCliRun", created.errorMessage)
    return forgejoCliActionWrite(
      { created: true, variable: invocation.name, forced: invocation.force },
      `Created variable ${invocation.name}`,
      invocation.style,
      invocation.json,
      options.outputWrite,
    )
  }
  if (invocation.kind === "actions-variables-delete" || invocation.kind === "actions-secrets-delete") {
    const confirmation = await forgejoCliConfirm(
      `Delete ${invocation.kind.includes("variables") ? "variable" : "secret"} ${invocation.name}?`,
      invocation.yes,
      options,
      options.outputWrite,
    )
    if (!confirmation.success) return confirmation
    if (!confirmation.data)
      return forgejoCliActionWrite(
        { cancelled: true },
        "Cancelled",
        invocation.style,
        invocation.json,
        options.outputWrite,
      )
    const deleted =
      invocation.kind === "actions-variables-delete"
        ? await forgejoActionVariableDelete(transport, repository, invocation.name)
        : await forgejoActionSecretDelete(transport, repository, invocation.name)
    if (!deleted.success) return createResultError("forgejoCliRun", deleted.errorMessage)
    const kind = invocation.kind.includes("variables") ? "variable" : "secret"
    return forgejoCliActionWrite(
      { deleted: true, [kind]: invocation.name },
      `Deleted ${kind} ${invocation.name}`,
      invocation.style,
      invocation.json,
      options.outputWrite,
    )
  }
  if (invocation.kind === "actions-secrets-create") {
    const created = await forgejoActionSecretCreate(transport, repository, invocation.name, invocation.data)
    if (!created.success) return createResultError("forgejoCliRun", created.errorMessage)
    return forgejoCliActionWrite(
      { created: true, secret: invocation.name },
      `Created secret ${invocation.name}`,
      invocation.style,
      invocation.json,
      options.outputWrite,
    )
  }
  const dispatched = await forgejoActionWorkflowDispatch(
    transport,
    repository,
    invocation.name,
    invocation.ref,
    invocation.inputs,
  )
  if (!dispatched.success) return createResultError("forgejoCliRun", dispatched.errorMessage)
  return forgejoCliActionWrite(
    {
      dispatched: true,
      workflow: invocation.name,
      ref: invocation.ref,
      inputs: Object.keys(invocation.inputs).length,
      run: dispatched.data,
    },
    `Dispatched ${invocation.name} at ${invocation.ref} with ${Object.keys(invocation.inputs).length} input(s)`,
    invocation.style,
    invocation.json,
    options.outputWrite,
  )
}

async function forgejoCliInvocationRun(
  invocation: ForgejoCliInvocation,
  env: ForgejoCliEnvironment,
  options: ForgejoCliRunOptions = {},
): Promise<ForgejoResult<null>> {
  if (invocation.kind === "help") return forgejoCliOutputWrite(forgejoCliHelpRender(invocation.path))
  if (invocation.kind === "version") return forgejoCliVersionRun(invocation.verbose, invocation.style)
  if (invocation.kind === "whoami")
    return forgejoCliWhoamiRun(invocation.host, invocation.remote, invocation.cwd, env, invocation.style)
  if (invocation.kind === "completion")
    return forgejoCliOutputWrite(forgejoCliCompletionGenerate(invocation.shell, invocation.binName))
  if (invocation.kind === "auth-add-token")
    return forgejoCliTokenStoreRun(invocation.host, invocation.cwd, invocation.token, env, invocation.style)
  if (invocation.kind === "auth-login")
    return forgejoCliLoginRun(
      invocation.host,
      invocation.cwd,
      invocation.token,
      invocation.clientId,
      env,
      invocation.style,
      { ...options, env },
    )
  if (invocation.kind === "auth-logout")
    return forgejoCliLogoutRun(invocation.host, invocation.cwd, env, invocation.style)
  if (invocation.kind === "auth-use-ssh")
    return forgejoCliUseSshRun(invocation.host, invocation.cwd, invocation.useSsh, env, invocation.style)
  if (invocation.kind.startsWith("repo-"))
    return forgejoCliRepositoryRun(invocation as ForgejoCliRepositoryInvocation, { ...options, env })
  if (invocation.kind === "auth-list") return forgejoCliAuthListRun(env, invocation.style)
  if (invocation.kind.startsWith("issue-"))
    return forgejoCliIssueRun(invocation as Extract<ForgejoCliInvocation, { kind: `issue-${string}` }>, {
      ...options,
      env,
    })
  if (invocation.kind.startsWith("pr-"))
    return forgejoCliPullRequestRun(invocation as Extract<ForgejoCliInvocation, { kind: `pr-${string}` }>, {
      ...options,
      env,
    })
  if (invocation.kind.startsWith("release-"))
    return forgejoCliReleaseRun(invocation as Extract<ForgejoCliInvocation, { kind: `release-${string}` }>, {
      ...options,
      env,
    })
  if (invocation.kind.startsWith("tag-"))
    return forgejoCliTagRun(invocation as Extract<ForgejoCliInvocation, { kind: `tag-${string}` }>, {
      ...options,
      env,
    })
  if (invocation.kind.startsWith("wiki-"))
    return forgejoCliWikiRun(invocation as ForgejoCliWikiInvocation, { ...options, env })
  if (invocation.kind.startsWith("actions-"))
    return forgejoCliActionsRun(invocation as ForgejoCliActionsInvocation, { ...options, env })
  if (invocation.kind.startsWith("user-"))
    return forgejoCliUserRun(invocation as Extract<ForgejoCliInvocation, { kind: `user-${string}` }>, {
      ...options,
      env,
    })
  if (invocation.kind.startsWith("org-"))
    return forgejoCliOrganizationRun(invocation as Extract<ForgejoCliInvocation, { kind: `org-${string}` }>, {
      ...options,
      env,
    })
  return createResultError("forgejoCliRun", `Unsupported command '${invocation.kind}'`)
}

export async function forgejoCliRun(
  argv: readonly string[],
  envOrOptions: ForgejoCliEnvironment | ForgejoCliRunOptions = process.env,
  options: ForgejoCliRunOptions = {},
): Promise<ForgejoResult<number>> {
  const isOptions =
    typeof envOrOptions === "object" &&
    ("env" in envOrOptions ||
      "fetch" in envOrOptions ||
      "execute" in envOrOptions ||
      "browserOpen" in envOrOptions ||
      "oauthLoopbackReceiverCreate" in envOrOptions ||
      "confirm" in envOrOptions ||
      "fileRead" in envOrOptions ||
      "directoryRead" in envOrOptions ||
      "fileWrite" in envOrOptions ||
      "sleep" in envOrOptions ||
      "outputWrite" in envOrOptions ||
      "promptWrite" in envOrOptions ||
      "stderrWrite" in envOrOptions ||
      "stdoutIsTty" in envOrOptions)
  const env: ForgejoCliEnvironment = isOptions
    ? ((envOrOptions as ForgejoCliRunOptions).env ?? process.env)
    : (envOrOptions as ForgejoCliEnvironment)
  const runOptions = isOptions ? (envOrOptions as ForgejoCliRunOptions) : options
  const parsed = forgejoCliParse(argv, { stdoutIsTty: runOptions.stdoutIsTty ?? Boolean(process.stdout.isTTY) })
  if (!parsed.success) return parsed
  const invocation = parsed.data
  const cwd = "cwd" in invocation ? invocation.cwd : undefined
  const changedDirectory = await forgejoCliCwdApply(cwd)
  if (!changedDirectory.success) return changedDirectory
  const result = await forgejoCliInvocationRun(invocation, env, runOptions)
  if (!result.success) return result
  return createResult(0)
}
