import { createResult, createResultError } from "#result"
import { readdir } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { forgejoUserActivityList } from "../users/activity/forgejoUserActivityList.js"
import { forgejoUserBlock } from "../users/social/forgejoUserBlock.js"
import { forgejoUserCurrentGet } from "../users/forgejoUserCurrentGet.js"
import { forgejoUserEmailsAdd } from "../users/emails/forgejoUserEmailsAdd.js"
import { forgejoUserEmailsDelete } from "../users/emails/forgejoUserEmailsDelete.js"
import { forgejoUserFollow } from "../users/social/forgejoUserFollow.js"
import { forgejoUserFollowersList } from "../users/social/forgejoUserFollowersList.js"
import { forgejoUserFollowingList } from "../users/social/forgejoUserFollowingList.js"
import { forgejoUserGet } from "../users/forgejoUserGet.js"
import { forgejoUserGpgKeyDelete } from "../users/gpgKeys/forgejoUserGpgKeyDelete.js"
import { forgejoUserGpgKeyGet } from "../users/gpgKeys/forgejoUserGpgKeyGet.js"
import { forgejoUserGpgKeyUpload } from "../users/gpgKeys/forgejoUserGpgKeyUpload.js"
import { forgejoUserGpgKeyVerify } from "../users/gpgKeys/forgejoUserGpgKeyVerify.js"
import { forgejoUserGpgKeysList } from "../users/gpgKeys/forgejoUserGpgKeysList.js"
import { forgejoUserGpgVerificationTokenGet } from "../users/gpgKeys/forgejoUserGpgVerificationTokenGet.js"
import { forgejoUserOrganizationsList } from "../users/organizations/forgejoUserOrganizationsList.js"
import { forgejoUserProfileEdit } from "../users/forgejoUserProfileEdit.js"
import { forgejoUserRepositoriesList } from "../users/repositories/forgejoUserRepositoriesList.js"
import { forgejoUserSearch } from "../users/forgejoUserSearch.js"
import { forgejoUserSshKeyDelete } from "../users/sshKeys/forgejoUserSshKeyDelete.js"
import { forgejoUserSshKeyGet } from "../users/sshKeys/forgejoUserSshKeyGet.js"
import { forgejoUserSshKeyUpload } from "../users/sshKeys/forgejoUserSshKeyUpload.js"
import { forgejoUserSshKeysList } from "../users/sshKeys/forgejoUserSshKeysList.js"
import { forgejoUserUnblock } from "../users/social/forgejoUserUnblock.js"
import { forgejoUserUnfollow } from "../users/social/forgejoUserUnfollow.js"
import { forgejoEnvironmentDefaultsResolve } from "../configuration/forgejoEnvironmentDefaults.js"
import type { ForgejoCliInvocation } from "./forgejoCliParse.js"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoCliEditorOpen } from "./forgejoCliEditorOpen.js"
import { forgejoCliBrowserOpen } from "./forgejoCliBrowserOpen.js"
import { forgejoCliHostClient } from "./forgejoCliHostClient.js"
import { forgejoCliProcessExecute } from "./forgejoCliProcessExecute.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"
import { forgejoCliResourceOutput } from "./forgejoCliResourceOutput.js"
import { forgejoCliTextRead } from "./forgejoCliTextRead.js"

type ForgejoCliUserInvocation = Extract<ForgejoCliInvocation, { kind: `user-${string}` }>
type ForgejoCliUserRunOptions = ForgejoCliRunOptions & { env: Record<string, string | undefined> }

function forgejoCliUserOutput(value: unknown, invocation: ForgejoCliUserInvocation, options: ForgejoCliUserRunOptions) {
  return forgejoCliResourceOutput(value, {
    json: invocation.json,
    style: invocation.style,
    verbose: "verbose" in invocation && invocation.verbose === true,
    outputWrite: options.outputWrite,
  })
}

async function forgejoCliUserConfirm(
  message: string,
  yes: boolean,
  options: ForgejoCliUserRunOptions,
): Promise<ForgejoResult<boolean>> {
  if (yes) return createResult(true)
  if (options.confirm) return createResult(await options.confirm(message))
  if (!options.stdinRead && !process.stdin.isTTY)
    return createResultError("forgejoCliUserRun", "Confirmation is required; use --yes or --force")
  const prompt = options.promptWrite
    ? options.promptWrite(`${message} [y/N] `)
    : (() => {
        try {
          process.stderr.write(`${message} [y/N] `)
          return createResult(null)
        } catch {
          return createResultError("forgejoCliUserRun", "Unable to write confirmation prompt")
        }
      })()
  if (!prompt.success) return prompt
  const input = options.stdinRead
    ? await options.stdinRead()
    : await new Promise<ForgejoResult<string>>((resolve) => {
        process.stdin.once("data", (data) => resolve(createResult(String(data))))
      })
  if (!input.success) return createResultError("forgejoCliUserRun", input.errorMessage)
  return createResult(/^y(es)?$/i.test(input.data.trim()))
}

function forgejoCliUserName(user: Record<string, unknown>): string | undefined {
  const login = user.login ?? user.username
  return typeof login === "string" ? login : undefined
}

async function forgejoCliUserGpgExport(key: string, options: ForgejoCliUserRunOptions): Promise<ForgejoResult<string>> {
  const execute = options.execute ?? forgejoCliProcessExecute
  return execute({ command: "gpg", args: ["--export", "--armor", key] })
}

async function forgejoCliUserRunEdit(
  invocation: Extract<ForgejoCliUserInvocation, { kind: "user-edit" }>,
  transport: Parameters<typeof forgejoUserCurrentGet>[0],
  options: ForgejoCliUserRunOptions,
) {
  const edit = invocation.edit
  if (edit.field === "email") {
    let result: unknown
    if (edit.visibility !== undefined) {
      const profile = await forgejoUserProfileEdit(transport, { hideEmail: edit.visibility === "hidden" })
      if (!profile.success) return createResultError("forgejoCliUserRun", profile.errorMessage)
      result = profile.data
    }
    if (edit.add && edit.add.length > 0) {
      const added = await forgejoUserEmailsAdd(transport, { emails: edit.add })
      if (!added.success) return createResultError("forgejoCliUserRun", added.errorMessage)
      result = added.data
    }
    if (edit.remove && edit.remove.length > 0) {
      const removed = await forgejoUserEmailsDelete(transport, { emails: edit.remove })
      if (!removed.success) return createResultError("forgejoCliUserRun", removed.errorMessage)
      result = { removed: edit.remove }
    }
    if (result === undefined) return createResultError("forgejoCliUserRun", "Provide --visibility, --add, or --rm")
    return forgejoCliUserOutput(result, invocation, options)
  }
  if (edit.field === "activity") {
    const updated = await forgejoUserProfileEdit(transport, { hideActivity: edit.visibility === "hidden" })
    if (!updated.success) return createResultError("forgejoCliUserRun", updated.errorMessage)
    return forgejoCliUserOutput(updated.data, invocation, options)
  }
  let value = edit.value
  if (edit.field === "bio" && value === undefined) {
    const current = await forgejoUserCurrentGet(transport)
    if (!current.success) return createResultError("forgejoCliUserRun", current.errorMessage)
    const edited = await (options.editor ?? ((initial) => forgejoCliEditorOpen(initial, options.env)))(
      current.data.description ?? "",
      "md",
    )
    if (!edited.success) return createResultError("forgejoCliUserRun", edited.errorMessage)
    value = edited.data
  }
  if (value === undefined && !edit.unset)
    return createResultError("forgejoCliUserRun", "A value or --unset is required")
  if (value === "" && !edit.unset && edit.field !== "bio")
    return forgejoCliUserOutput(
      { changed: false, hint: `Use --unset to clear the ${edit.field}.` },
      invocation,
      options,
    )
  const fieldMap: Record<string, string> = {
    bio: "description",
    name: "fullName",
    pronouns: "pronouns",
    location: "location",
    website: "website",
  }
  const updated = await forgejoUserProfileEdit(transport, {
    [fieldMap[edit.field] ?? edit.field]: edit.unset ? null : value,
  })
  if (!updated.success) return createResultError("forgejoCliUserRun", updated.errorMessage)
  return forgejoCliUserOutput(updated.data, invocation, options)
}

async function forgejoCliUserRunKey(
  invocation: Extract<ForgejoCliUserInvocation, { kind: `user-key-${string}` }>,
  transport: Parameters<typeof forgejoUserCurrentGet>[0],
  options: ForgejoCliUserRunOptions,
) {
  if (invocation.kind === "user-key-list") {
    const keys = await forgejoUserSshKeysList(transport)
    if (!keys.success) return createResultError("forgejoCliUserRun", keys.errorMessage)
    return forgejoCliUserOutput(keys.data, invocation, options)
  }
  if (invocation.kind === "user-key-view") {
    const key = await forgejoUserSshKeyGet(transport, invocation.id)
    if (!key.success) return createResultError("forgejoCliUserRun", key.errorMessage)
    return forgejoCliUserOutput(key.data, invocation, options)
  }
  if (invocation.kind === "user-key-delete") {
    const confirmation = await forgejoCliUserConfirm(
      `Delete SSH key ${invocation.id}?`,
      invocation.yes === true || invocation.force === true,
      options,
    )
    if (!confirmation.success) return confirmation
    if (!confirmation.data) return forgejoCliUserOutput({ cancelled: true }, invocation, options)
    const deleted = await forgejoUserSshKeyDelete(transport, invocation.id)
    if (!deleted.success) return createResultError("forgejoCliUserRun", deleted.errorMessage)
    return forgejoCliUserOutput({ deleted: true, id: invocation.id }, invocation, options)
  }
  let keyFile = invocation.keyFile
  if (keyFile === undefined) {
    const home = options.env.HOME ?? homedir()
    const directory = join(home, ".ssh")
    const entries = options.directoryRead
      ? await options.directoryRead(directory)
      : await (async () => {
          try {
            return createResult(await readdir(directory))
          } catch {
            return createResultError("forgejoCliUserRun", `Unable to read '${directory}'`)
          }
        })()
    if (!entries.success) return entries
    const candidate = entries.data.find((entry) => entry.startsWith("id_") && entry.endsWith(".pub"))
    if (!candidate) return createResultError("forgejoCliUserRun", "No SSH public key was found in ~/.ssh")
    keyFile = candidate.startsWith("/") ? candidate : join(directory, candidate)
    const confirmed = await forgejoCliUserConfirm(`Use SSH key file '${keyFile}'?`, false, options)
    if (!confirmed.success) return confirmed
    if (!confirmed.data) return forgejoCliUserOutput({ cancelled: true }, invocation, options)
  }
  const source = await forgejoCliTextRead(keyFile, {
    stdinRead: options.stdinRead,
    fileRead: options.fileRead,
  })
  if (!source.success) return createResultError("forgejoCliUserRun", source.errorMessage)
  const trimmed = source.data.trim()
  if (!invocation.force && (!trimmed.startsWith("ssh-") || trimmed.includes("\n")))
    return createResultError(
      "forgejoCliUserRun",
      "SSH key input must be one public ssh- line; use --force to bypass validation",
    )
  const guessedTitle = trimmed.split(/\s+/).at(-1)
  let title = invocation.title
  if (!title && guessedTitle) {
    const confirmation = await forgejoCliUserConfirm(`Use '${guessedTitle}' as the SSH key title?`, false, options)
    if (!confirmation.success) return confirmation
    if (!confirmation.data) return forgejoCliUserOutput({ cancelled: true }, invocation, options)
    title = guessedTitle
  }
  if (!title) return createResultError("forgejoCliUserRun", "An SSH key title is required")
  const uploaded = await forgejoUserSshKeyUpload(transport, { key: source.data, title, readOnly: invocation.readOnly })
  if (!uploaded.success) return createResultError("forgejoCliUserRun", uploaded.errorMessage)
  return forgejoCliUserOutput(uploaded.data, invocation, options)
}

async function forgejoCliUserRunGpg(
  invocation: Extract<ForgejoCliUserInvocation, { kind: `user-gpg-${string}` }>,
  transport: Parameters<typeof forgejoUserCurrentGet>[0],
  options: ForgejoCliUserRunOptions,
) {
  if (invocation.kind === "user-gpg-list") {
    const keys = await forgejoUserGpgKeysList(transport)
    if (!keys.success) return createResultError("forgejoCliUserRun", keys.errorMessage)
    return forgejoCliUserOutput(keys.data, invocation, options)
  }
  if (invocation.kind === "user-gpg-view") {
    const key = await forgejoUserGpgKeyGet(transport, invocation.id)
    if (!key.success) return createResultError("forgejoCliUserRun", key.errorMessage)
    return forgejoCliUserOutput(key.data, invocation, options)
  }
  if (invocation.kind === "user-gpg-delete") {
    const confirmation = await forgejoCliUserConfirm(
      `Delete GPG key ${invocation.id}?`,
      invocation.yes === true || invocation.force === true,
      options,
    )
    if (!confirmation.success) return confirmation
    if (!confirmation.data) return forgejoCliUserOutput({ cancelled: true }, invocation, options)
    const deleted = await forgejoUserGpgKeyDelete(transport, invocation.id)
    if (!deleted.success) return createResultError("forgejoCliUserRun", deleted.errorMessage)
    return forgejoCliUserOutput({ deleted: true, id: invocation.id }, invocation, options)
  }
  if (invocation.kind === "user-gpg-upload") {
    const exported = await forgejoCliUserGpgExport(invocation.key ?? "", options)
    if (!exported.success) return createResultError("forgejoCliUserRun", exported.errorMessage)
    if (exported.data.trim().length === 0)
      return createResultError("forgejoCliUserRun", "GPG did not export a public key")
    let signature: string | undefined
    if (!invocation.noVerify) {
      const token = await forgejoUserGpgVerificationTokenGet(transport)
      if (!token.success) return createResultError("forgejoCliUserRun", token.errorMessage)
      const execute = options.execute ?? forgejoCliProcessExecute
      const signed = await execute({
        command: "gpg",
        args: ["--armor", "--default-key", invocation.key ?? "", "--detach-sign"],
        stdin: token.data,
      })
      if (!signed.success) return createResultError("forgejoCliUserRun", signed.errorMessage)
      signature = signed.data
    }
    const uploaded = await forgejoUserGpgKeyUpload(transport, {
      armoredPublicKey: exported.data,
      armoredSignature: signature,
    })
    if (!uploaded.success) return createResultError("forgejoCliUserRun", uploaded.errorMessage)
    return forgejoCliUserOutput(uploaded.data, invocation, options)
  }
  const key = await forgejoUserGpgKeyGet(transport, invocation.id)
  if (!key.success) return createResultError("forgejoCliUserRun", key.errorMessage)
  const keyId = key.data.key_id
  if (!keyId) return createResultError("forgejoCliUserRun", "Forgejo did not return a GPG key ID")
  const token = await forgejoUserGpgVerificationTokenGet(transport)
  if (!token.success) return createResultError("forgejoCliUserRun", token.errorMessage)
  const execute = options.execute ?? forgejoCliProcessExecute
  const signed = await execute({
    command: "gpg",
    args: ["--armor", "--default-key", keyId, "--detach-sign"],
    stdin: token.data,
  })
  if (!signed.success) return createResultError("forgejoCliUserRun", signed.errorMessage)
  const verified = await forgejoUserGpgKeyVerify(transport, { keyId, armoredSignature: signed.data })
  if (!verified.success) return createResultError("forgejoCliUserRun", verified.errorMessage)
  return forgejoCliUserOutput({ verified: true, id: invocation.id, keyId }, invocation, options)
}

async function forgejoCliUserRun(invocation: ForgejoCliUserInvocation, options: ForgejoCliUserRunOptions) {
  const environmentDefaults = forgejoEnvironmentDefaultsResolve({ env: options.env, cwd: invocation.cwd })
  const host = await forgejoCliHostClient({
    ...options,
    host: invocation.host,
    remote: invocation.remote,
    cwd: invocation.cwd,
  })
  if (!host.success) return host
  const transport = host.data.client.transport
  if (invocation.kind === "user-search") {
    const users = await forgejoUserSearch(transport, { query: invocation.query, page: invocation.page, limit: 20 })
    if (!users.success) return createResultError("forgejoCliUserRun", users.errorMessage)
    return forgejoCliUserOutput(users.data, invocation, options)
  }
  if (invocation.kind === "user-view" || invocation.kind === "user-browse") {
    const userTarget = invocation.user ?? environmentDefaults.user
    const user =
      userTarget === undefined ? await forgejoUserCurrentGet(transport) : await forgejoUserGet(transport, userTarget)
    if (!user.success) return createResultError("forgejoCliUserRun", user.errorMessage)
    if (invocation.kind === "user-browse") {
      const username = forgejoCliUserName(user.data)
      if (!username) return createResultError("forgejoCliUserRun", "Forgejo user has no username")
      const url = `${host.data.host.baseUrl}${encodeURIComponent(username)}`
      const opened = await (options.browserOpen ?? forgejoCliBrowserOpen)(url)
      if (!opened.success) return createResultError("forgejoCliUserRun", opened.errorMessage)
      return forgejoCliUserOutput({ opened: true, url }, invocation, options)
    }
    return forgejoCliUserOutput(user.data, invocation, options)
  }
  if (
    invocation.kind === "user-follow" ||
    invocation.kind === "user-unfollow" ||
    invocation.kind === "user-block" ||
    invocation.kind === "user-unblock"
  ) {
    const action =
      invocation.kind === "user-follow"
        ? forgejoUserFollow
        : invocation.kind === "user-unfollow"
          ? forgejoUserUnfollow
          : invocation.kind === "user-block"
            ? forgejoUserBlock
            : forgejoUserUnblock
    const changed = await action(transport, invocation.user)
    if (!changed.success) return createResultError("forgejoCliUserRun", changed.errorMessage)
    return forgejoCliUserOutput(
      { action: invocation.kind.slice("user-".length), user: invocation.user },
      invocation,
      options,
    )
  }
  if (invocation.kind === "user-following" || invocation.kind === "user-followers") {
    const userTarget = invocation.user ?? environmentDefaults.user
    const users =
      invocation.kind === "user-following"
        ? await forgejoUserFollowingList(transport, userTarget)
        : await forgejoUserFollowersList(transport, userTarget)
    if (!users.success) return createResultError("forgejoCliUserRun", users.errorMessage)
    return forgejoCliUserOutput(users.data, invocation, options)
  }
  if (invocation.kind === "user-repos") {
    const userTarget = invocation.user ?? environmentDefaults.user
    const repos = await forgejoUserRepositoriesList(transport, userTarget, {
      starred: invocation.starred,
      page: invocation.page,
      limit: 50,
      ...(invocation.sort === undefined
        ? {}
        : { sort: invocation.sort, order: invocation.sort === "name" ? "asc" : "desc" }),
    })
    if (!repos.success) return createResultError("forgejoCliUserRun", repos.errorMessage)
    return forgejoCliUserOutput(repos.data, invocation, options)
  }
  if (invocation.kind === "user-orgs") {
    const orgs = await forgejoUserOrganizationsList(transport, invocation.user ?? environmentDefaults.user)
    if (!orgs.success) return createResultError("forgejoCliUserRun", orgs.errorMessage)
    return forgejoCliUserOutput(orgs.data, invocation, options)
  }
  if (invocation.kind === "user-activity") {
    const activities = await forgejoUserActivityList(transport, invocation.user ?? environmentDefaults.user, {
      onlyPerformedBy: true,
    })
    if (!activities.success) return createResultError("forgejoCliUserRun", activities.errorMessage)
    return forgejoCliUserOutput(activities.data, invocation, options)
  }
  if (invocation.kind === "user-edit") return forgejoCliUserRunEdit(invocation, transport, options)
  if (invocation.kind.startsWith("user-key-"))
    return forgejoCliUserRunKey(
      invocation as Extract<ForgejoCliUserInvocation, { kind: `user-key-${string}` }>,
      transport,
      options,
    )
  return forgejoCliUserRunGpg(
    invocation as Extract<ForgejoCliUserInvocation, { kind: `user-gpg-${string}` }>,
    transport,
    options,
  )
}

export { forgejoCliUserRun }
