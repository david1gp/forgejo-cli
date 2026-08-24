import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoClientCreate } from "../client/forgejoClientCreate.js"
import { forgejoDefaultsResolve } from "../configuration/forgejoDefaultsResolve.js"
import { forgejoPullRequestAssigneeAdd } from "../pullRequests/forgejoPullRequestAssigneeAdd.js"
import { forgejoPullRequestAssigneeRemove } from "../pullRequests/forgejoPullRequestAssigneeRemove.js"
import { forgejoPullRequestBlockedByAdd } from "../pullRequests/dependencies/forgejoPullRequestBlockedByAdd.js"
import { forgejoPullRequestBlockedByList } from "../pullRequests/dependencies/forgejoPullRequestBlockedByList.js"
import { forgejoPullRequestBlockedByRemove } from "../pullRequests/dependencies/forgejoPullRequestBlockedByRemove.js"
import { forgejoPullRequestCommentCreate } from "../pullRequests/comments/forgejoPullRequestCommentCreate.js"
import { forgejoPullRequestCommentEdit } from "../pullRequests/comments/forgejoPullRequestCommentEdit.js"
import { forgejoPullRequestCommentsGet } from "../pullRequests/comments/forgejoPullRequestCommentsGet.js"
import { forgejoPullRequestClose } from "../pullRequests/forgejoPullRequestClose.js"
import { forgejoPullRequestCreate } from "../pullRequests/forgejoPullRequestCreate.js"
import { forgejoPullRequestCommitsList } from "../pullRequests/commits/forgejoPullRequestCommitsList.js"
import { forgejoPullRequestDependenciesGet } from "../pullRequests/dependencies/forgejoPullRequestDependenciesGet.js"
import { forgejoPullRequestDependencyAdd } from "../pullRequests/dependencies/forgejoPullRequestDependencyAdd.js"
import { forgejoPullRequestDependencyRemove } from "../pullRequests/dependencies/forgejoPullRequestDependencyRemove.js"
import { forgejoPullRequestDiffGet } from "../pullRequests/forgejoPullRequestDiffGet.js"
import { forgejoPullRequestEdit } from "../pullRequests/forgejoPullRequestEdit.js"
import { forgejoPullRequestFilesList } from "../pullRequests/files/forgejoPullRequestFilesList.js"
import { forgejoPullRequestGet } from "../pullRequests/forgejoPullRequestGet.js"
import { forgejoPullRequestIssueReferenceResolve } from "../pullRequests/forgejoPullRequestIssueReferenceResolve.js"
import { forgejoPullRequestLabelsEdit } from "../pullRequests/forgejoPullRequestLabelsEdit.js"
import { forgejoPullRequestMerge } from "../pullRequests/forgejoPullRequestMerge.js"
import { forgejoPullRequestReviewCommentsList } from "../pullRequests/reviews/forgejoPullRequestReviewCommentsList.js"
import { forgejoPullRequestReviewsList } from "../pullRequests/reviews/forgejoPullRequestReviewsList.js"
import { forgejoPullRequestSearch } from "../pullRequests/forgejoPullRequestSearch.js"
import { forgejoPullRequestReferenceResolve } from "../pullRequests/forgejoPullRequestReferenceResolve.js"
import { forgejoPullRequestStatus } from "../pullRequests/forgejoPullRequestStatus.js"
import { forgejoPullRequestIdentifierParse } from "../pullRequests/forgejoPullRequestIdentifierParse.js"
import { forgejoRepositoryCloneMetadataGet } from "../repositories/forgejoRepositoryCloneMetadataGet.js"
import { forgejoRepositoryContextResolve } from "../repositories/forgejoRepositoryContextResolve.js"
import { forgejoRepositoryGet } from "../repositories/forgejoRepositoryGet.js"
import { forgejoSshUrlApplyBase } from "../urls/forgejoSshUrlApplyBase.js"
import { forgejoIssueReferenceParse } from "../issues/forgejoIssueReferenceParse.js"
import { forgejoCliBrowserOpen } from "./forgejoCliBrowserOpen.js"
import { forgejoCliEditorOpen } from "./forgejoCliEditorOpen.js"
import type { ForgejoCliInvocation } from "./forgejoCliParse.js"
import { forgejoCliTextRead } from "./forgejoCliTextRead.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"
import { forgejoCliSshCommandCreate } from "./forgejoCliSshCommandCreate.js"

type ForgejoCliPullRequestInvocation = Extract<ForgejoCliInvocation, { kind: `pr-${string}` }>
type ForgejoCliPullRequestRunOptions = ForgejoCliRunOptions & { env: Record<string, string | undefined> }
type ForgejoCliPullRequestReference = {
  number: number
  parent: boolean
  repo: { owner: string; name: string; host?: string }
}

function forgejoCliPullRequestWrite(output: string, options: ForgejoCliPullRequestRunOptions) {
  try {
    return options.outputWrite ? options.outputWrite(output) : (process.stdout.write(output), createResult(null))
  } catch {
    return createResultError("forgejoCliPullRequestRun", "Unable to write command output")
  }
}

function forgejoCliPullRequestJson(value: unknown, options: ForgejoCliPullRequestRunOptions) {
  try {
    return forgejoCliPullRequestWrite(`${JSON.stringify(value)}\n`, options)
  } catch {
    return createResultError("forgejoCliPullRequestRun", "Unable to serialize pull request output")
  }
}

function forgejoCliPullRequestPrefix(style: "fancy" | "minimal", symbol: string) {
  return style === "fancy" ? `${symbol} ` : ""
}

function forgejoCliPullRequestValueWrite(
  value: unknown,
  invocation: ForgejoCliPullRequestInvocation,
  options: ForgejoCliPullRequestRunOptions,
) {
  if (invocation.json) return forgejoCliPullRequestJson(value, options)
  if (typeof value === "string")
    return forgejoCliPullRequestWrite(`${value}${value.endsWith("\n") ? "" : "\n"}`, options)
  if (Array.isArray(value)) {
    const lines = value.map((item) => {
      if (typeof item !== "object" || item === null) return String(item)
      const record = item as Record<string, unknown>
      if (typeof record.login === "string") return record.login
      if (typeof record.number === "number") return `#${record.number}\t${String(record.title ?? "")}`
      if (typeof record.name === "string") return record.name
      return JSON.stringify(item)
    })
    return forgejoCliPullRequestWrite(`${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`, options)
  }
  return forgejoCliPullRequestWrite(`${JSON.stringify(value)}\n`, options)
}

function forgejoCliPullRequestStderrWrite(output: string, options: ForgejoCliPullRequestRunOptions) {
  try {
    if (options.stderrWrite) return options.stderrWrite(output)
    process.stderr.write(output)
    return createResult(null)
  } catch {
    return createResultError("forgejoCliPullRequestRun", "Unable to write command warning")
  }
}

function forgejoCliPullRequestFileText(file: Record<string, unknown>) {
  const additions = typeof file.additions === "number" ? file.additions : 0
  const deletions = typeof file.deletions === "number" ? file.deletions : 0
  const name = typeof file.filename === "string" ? file.filename : "???"
  return { additions, deletions, name }
}

function forgejoCliPullRequestFilesWrite(
  files: readonly Record<string, unknown>[],
  invocation: ForgejoCliPullRequestInvocation,
  options: ForgejoCliPullRequestRunOptions,
) {
  if (invocation.json) return forgejoCliPullRequestJson(files, options)
  const values = files.map(forgejoCliPullRequestFileText)
  const additionsWidth = Math.max(1, ...values.map((file) => String(file.additions).length))
  const deletionsWidth = Math.max(1, ...values.map((file) => String(file.deletions).length))
  const lines = values.map(
    (file) =>
      `+${String(file.additions).padEnd(additionsWidth)} -${String(file.deletions).padEnd(deletionsWidth)} ${file.name}`,
  )
  return forgejoCliPullRequestWrite(`${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`, options)
}

function forgejoCliPullRequestCommitText(commit: Record<string, unknown>) {
  const stats = (commit.stats as Record<string, unknown> | null | undefined) ?? {}
  const details = (commit.commit as Record<string, unknown> | null | undefined) ?? {}
  const author = (details.author as Record<string, unknown> | null | undefined) ?? {}
  const message = typeof details.message === "string" && details.message.length > 0 ? details.message : "[no msg]"
  const sha = typeof commit.sha === "string" ? commit.sha : "?"
  const additions = typeof stats.additions === "number" ? stats.additions : 0
  const deletions = typeof stats.deletions === "number" ? stats.deletions : 0
  const date =
    (typeof commit.created === "string" && commit.created) ||
    (typeof commit.created_at === "string" && commit.created_at) ||
    (typeof author.date === "string" && author.date) ||
    "?"
  return {
    additions,
    authorEmail: typeof author.email === "string" ? author.email : "?",
    authorName: typeof author.name === "string" ? author.name : "?",
    date,
    deletions,
    message,
    sha,
  }
}

function forgejoCliPullRequestCommitsWrite(
  commits: readonly Record<string, unknown>[],
  invocation: ForgejoCliPullRequestInvocation,
  options: ForgejoCliPullRequestRunOptions,
) {
  if (invocation.json) return forgejoCliPullRequestJson(commits, options)
  const values = commits.map(forgejoCliPullRequestCommitText)
  const additionsWidth = Math.max(1, ...values.map((commit) => String(commit.additions).length))
  const deletionsWidth = Math.max(1, ...values.map((commit) => String(commit.deletions).length))
  if ("oneline" in invocation && invocation.oneline) {
    const lines = values.map(
      (commit) =>
        `${commit.sha.slice(0, 7)} +${String(commit.additions).padEnd(additionsWidth)} -${String(commit.deletions).padEnd(deletionsWidth)} ${commit.message.split("\n", 1)[0]}`,
    )
    return forgejoCliPullRequestWrite(`${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`, options)
  }
  const lines: string[] = []
  for (const commit of values) {
    lines.push(
      `commit ${commit.sha} (+${commit.additions}, -${commit.deletions})`,
      `Author: ${commit.authorName} <${commit.authorEmail}>`,
      `Date:   ${commit.date}`,
      "",
      ...commit.message.split("\n").map((line) => `    ${line}`),
      "",
    )
  }
  return forgejoCliPullRequestWrite(`${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`, options)
}

async function forgejoCliPullRequestDiffRun(
  invocation: Extract<ForgejoCliPullRequestInvocation, { kind: "pr-view" }> & { view: "diff" },
  transport: Parameters<typeof forgejoPullRequestDiffGet>[0],
  input: { number: number; parent: boolean; repo: ForgejoCliPullRequestReference["repo"] },
  options: ForgejoCliPullRequestRunOptions,
) {
  const diff = await forgejoPullRequestDiffGet(transport, input, { format: invocation.patch ? "patch" : "diff" })
  if (!diff.success) return createResultError("forgejoCliPullRequestRun", diff.errorMessage)
  if (!invocation.editor) return forgejoCliPullRequestValueWrite(diff.data, invocation, options)
  const extension = invocation.patch ? "patch" : "diff"
  const edited = await (options.editor ?? ((text, suffix) => forgejoCliEditorOpen(text, options.env, suffix)))(
    diff.data,
    extension,
  )
  if (!edited.success) return edited
  if (edited.data !== diff.data)
    return forgejoCliPullRequestStderrWrite(
      "Warning: edited diff view is volatile and will not be uploaded or persisted.\n",
      options,
    )
  return createResult(null)
}

function forgejoCliPullRequestActionWrite(
  value: Record<string, unknown>,
  message: string,
  invocation: ForgejoCliPullRequestInvocation,
  options: ForgejoCliPullRequestRunOptions,
) {
  if (invocation.json) return forgejoCliPullRequestJson(value, options)
  return forgejoCliPullRequestWrite(`${forgejoCliPullRequestPrefix(invocation.style, "✓")}${message}\n`, options)
}

function forgejoCliPullRequestHuman(pullRequest: Record<string, unknown>, invocation: ForgejoCliPullRequestInvocation) {
  const number = typeof pullRequest.number === "number" ? `#${pullRequest.number}` : "pull request"
  const title = typeof pullRequest.title === "string" ? pullRequest.title : ""
  const state = typeof pullRequest.state === "string" ? pullRequest.state : ""
  const author =
    typeof (pullRequest.user as Record<string, unknown> | undefined)?.login === "string"
      ? ` by ${(pullRequest.user as Record<string, unknown>).login}`
      : ""
  const lines = [
    `${forgejoCliPullRequestPrefix(invocation.style, "●")}${number} ${title}${state ? ` (${state})` : ""}${author}`,
  ]
  if (typeof pullRequest.body === "string" && pullRequest.body.length > 0) lines.push("", pullRequest.body)
  if (typeof pullRequest.html_url === "string") lines.push("", pullRequest.html_url)
  return `${lines.join("\n")}\n`
}

async function forgejoCliPullRequestContext(
  invocation: ForgejoCliPullRequestInvocation,
  options: ForgejoCliPullRequestRunOptions,
  repository?: unknown,
) {
  const context = await forgejoRepositoryContextResolve({
    repository,
    host: invocation.host,
    remote: invocation.remote,
    cwd: invocation.cwd,
    env: options.env,
    execute: options.execute,
  })
  if (!context.success) return createResultError("forgejoCliPullRequestRun", context.errorMessage)
  const client = await forgejoClientCreate({
    baseUrl: context.data.baseUrl,
    env: options.env,
    fetch: options.fetch,
  })
  if (!client.success) return createResultError("forgejoCliPullRequestRun", client.errorMessage)
  return createResult({ context: context.data, client: client.data })
}

function forgejoCliPullRequestRepositoryString(repository: { host?: string; owner: string; name: string }) {
  return `${repository.host ? `${repository.host}/` : ""}${repository.owner}/${repository.name}`
}

async function forgejoCliPullRequestReferenceContext(
  invocation: ForgejoCliPullRequestInvocation & { pr: string },
  options: ForgejoCliPullRequestRunOptions,
) {
  const parsed = forgejoPullRequestIdentifierParse(invocation.pr)
  if (!parsed.success) return parsed
  const context = await forgejoCliPullRequestContext(
    invocation,
    options,
    parsed.data.repo ? forgejoCliPullRequestRepositoryString(parsed.data.repo) : invocation.repository,
  )
  if (!context.success) return context
  const reference: ForgejoCliPullRequestReference = {
    number: parsed.data.number,
    parent: parsed.data.parent,
    repo: parsed.data.repo ?? context.data.context.repository,
  }
  return createResult({ context, reference })
}

async function forgejoCliPullRequestInput(
  value: string | undefined,
  bodyFile: string | undefined,
  stdin: boolean,
  editor: boolean,
  initial: string,
  options: ForgejoCliPullRequestRunOptions,
  required = true,
): Promise<ForgejoResult<string | undefined>> {
  const sources = [value !== undefined, bodyFile !== undefined, stdin, editor].filter(Boolean).length
  if (sources > 1) return createResultError("forgejoCliPullRequestRun", "Input was provided more than once")
  if (value !== undefined) return createResult(value)
  if (bodyFile !== undefined) return forgejoCliTextRead(bodyFile, { stdinRead: options.stdinRead })
  if (stdin) return forgejoCliTextRead("-", { stdinRead: options.stdinRead })
  if (editor) return (options.editor ?? ((text) => forgejoCliEditorOpen(text, options.env)))(initial, "md")
  if (!required) return createResult(undefined)
  return createResultError(
    "forgejoCliPullRequestRun",
    "Input is required; provide text, --body-file, --stdin, or --editor",
  )
}

async function forgejoCliPullRequestConfirm(
  message: string,
  invocation: ForgejoCliPullRequestInvocation,
  options: ForgejoCliPullRequestRunOptions,
): Promise<ForgejoResult<boolean>> {
  if (options.confirm) return createResult(await options.confirm(message))
  if (!process.stdin.isTTY)
    return createResultError("forgejoCliPullRequestRun", "Confirmation is required; use --yes in non-interactive mode")
  const prompt = forgejoCliPullRequestWrite(
    `${forgejoCliPullRequestPrefix(invocation.style, "?")}${message} [y/N] `,
    options,
  )
  if (!prompt.success) return prompt
  return await new Promise((resolve) => {
    process.stdin.once("data", (data) => resolve(createResult(/^y(es)?$/i.test(String(data).trim()))))
  })
}

function forgejoCliPullRequestReferenceInput(reference: ForgejoCliPullRequestReference) {
  return { number: reference.number, parent: reference.parent, repo: reference.repo }
}

async function forgejoCliPullRequestCreateRun(
  invocation: Extract<ForgejoCliPullRequestInvocation, { kind: "pr-create" }>,
  options: ForgejoCliPullRequestRunOptions,
) {
  const context = await forgejoCliPullRequestContext(invocation, options, invocation.repository)
  if (!context.success) return context
  const execute = options.execute
  let head = invocation.head
  if (!head) {
    if (!execute)
      return createResultError("forgejoCliPullRequestRun", "--head is required when Git cannot be inspected")
    const branch = await execute({ command: "git", args: ["symbolic-ref", "--short", "HEAD"], cwd: invocation.cwd })
    if (!branch.success || branch.data.trim().length === 0)
      return createResultError("forgejoCliPullRequestRun", "Unable to determine the current Git branch; provide --head")
    head = branch.data.trim()
  }
  const repository = context.data.context.repository
  if (invocation.web) {
    const metadata = await forgejoRepositoryCloneMetadataGet(context.data.client.transport, repository)
    if (!metadata.success) return createResultError("forgejoCliPullRequestRun", metadata.errorMessage)
    if (!metadata.data.htmlUrl)
      return createResultError("forgejoCliPullRequestRun", "Forgejo did not return a repository URL")
    let base = invocation.base?.replace(/^\^/, "")
    if (!base) {
      const repositoryData = await forgejoRepositoryGet(context.data.client.transport, repository)
      if (!repositoryData.success) return createResultError("forgejoCliPullRequestRun", repositoryData.errorMessage)
      base = repositoryData.data.default_branch ?? "main"
    }
    const url = `${metadata.data.htmlUrl.replace(/\/$/, "")}/compare/${base}...${head}`
    const opened = await (options.browserOpen ?? forgejoCliBrowserOpen)(url)
    if (!opened.success) return opened
    return forgejoCliPullRequestActionWrite({ opened: true, url }, `Opened ${url}`, invocation, options)
  }
  const title = invocation.title ?? (invocation.autofill ? head : undefined)
  if (!title) return createResultError("forgejoCliPullRequestRun", "A title is required; provide --title or --autofill")
  const body = await forgejoCliPullRequestInput(
    invocation.body,
    invocation.bodyFile,
    invocation.stdin,
    invocation.editor,
    "",
    options,
    false,
  )
  if (!body.success) return body
  const created = await forgejoPullRequestCreate(context.data.client.transport, repository, {
    title,
    base: invocation.base,
    head,
    body: body.data,
  })
  if (!created.success) return createResultError("forgejoCliPullRequestRun", created.errorMessage)
  if (invocation.json) return forgejoCliPullRequestJson(created.data, options)
  return forgejoCliPullRequestWrite(
    forgejoCliPullRequestHuman(created.data as Record<string, unknown>, invocation),
    options,
  )
}

export async function forgejoCliPullRequestRun(
  invocation: ForgejoCliPullRequestInvocation,
  options: ForgejoCliPullRequestRunOptions,
): Promise<ForgejoResult<null>> {
  if (invocation.kind === "pr-create") return forgejoCliPullRequestCreateRun(invocation, options)
  if (invocation.kind === "pr-search") {
    const context = await forgejoCliPullRequestContext(invocation, options, invocation.repository)
    if (!context.success) return context
    const values = []
    let page = invocation.page
    do {
      const result = await forgejoPullRequestSearch(context.data.client.transport, context.data.context.repository, {
        q: invocation.query,
        labels: invocation.labels,
        createdBy: invocation.creator,
        assignedBy: invocation.assignee,
        state: invocation.state,
        page,
        limit: invocation.limit,
      })
      if (!result.success) return createResultError("forgejoCliPullRequestRun", result.errorMessage)
      values.push(...result.data)
      if (!invocation.all || result.data.length < invocation.limit) break
      page += 1
    } while (true)
    return forgejoCliPullRequestValueWrite(values, invocation, options)
  }

  const referenceInvocation = invocation as ForgejoCliPullRequestInvocation & { pr: string }
  const reference = await forgejoCliPullRequestReferenceContext(referenceInvocation, options)
  if (!reference.success) return reference
  const transport = reference.data.context.data.client.transport
  const input = forgejoCliPullRequestReferenceInput(reference.data.reference)

  if (invocation.kind === "pr-view" && invocation.view === "diff")
    return forgejoCliPullRequestDiffRun(
      invocation as Extract<ForgejoCliPullRequestInvocation, { kind: "pr-view" }> & { view: "diff" },
      transport,
      input,
      options,
    )

  if (invocation.kind === "pr-view" && invocation.view === "files") {
    const files = await forgejoPullRequestFilesList(transport, input, { all: true })
    if (!files.success) return createResultError("forgejoCliPullRequestRun", files.errorMessage)
    return forgejoCliPullRequestFilesWrite(files.data as Record<string, unknown>[], invocation, options)
  }

  if (invocation.kind === "pr-view" && invocation.view === "commits") {
    const commits = await forgejoPullRequestCommitsList(transport, input, { all: true })
    if (!commits.success) return createResultError("forgejoCliPullRequestRun", commits.errorMessage)
    return forgejoCliPullRequestCommitsWrite(commits.data as Record<string, unknown>[], invocation, options)
  }

  if (invocation.kind === "pr-view" || invocation.kind === "pr-browse") {
    const viewed = await forgejoPullRequestGet(transport, input)
    if (!viewed.success) return createResultError("forgejoCliPullRequestRun", viewed.errorMessage)
    if (invocation.kind === "pr-browse") {
      if (!viewed.data.html_url)
        return createResultError("forgejoCliPullRequestRun", "Forgejo did not return a pull request URL")
      const opened = await (options.browserOpen ?? forgejoCliBrowserOpen)(viewed.data.html_url)
      if (!opened.success) return opened
      return forgejoCliPullRequestActionWrite(
        { opened: true, url: viewed.data.html_url },
        `Opened ${viewed.data.html_url}`,
        invocation,
        options,
      )
    }
    if (!invocation.view)
      return invocation.json
        ? forgejoCliPullRequestJson(viewed.data, options)
        : forgejoCliPullRequestWrite(
            forgejoCliPullRequestHuman(viewed.data as Record<string, unknown>, invocation),
            options,
          )
    if (invocation.view === "body") return forgejoCliPullRequestValueWrite(viewed.data.body ?? "", invocation, options)
    if (invocation.view === "labels")
      return forgejoCliPullRequestValueWrite(viewed.data.labels ?? [], invocation, options)
    if (invocation.view === "assignees")
      return forgejoCliPullRequestValueWrite(viewed.data.assignees ?? [], invocation, options)
    const comments = await forgejoPullRequestCommentsGet(transport, input)
    if (!comments.success) return createResultError("forgejoCliPullRequestRun", comments.errorMessage)
    if (invocation.view === "comments") return forgejoCliPullRequestValueWrite(comments.data, invocation, options)
    const comment = comments.data[invocation.comment ?? -1]
    if (!comment) return createResultError("forgejoCliPullRequestRun", `Comment ${invocation.comment} was not found`)
    return forgejoCliPullRequestValueWrite(comment, invocation, options)
  }

  if (invocation.kind === "pr-status") {
    do {
      const status = await forgejoPullRequestStatus(transport, input)
      if (!status.success) return createResultError("forgejoCliPullRequestRun", status.errorMessage)
      const pending = status.data.statuses.some((item) =>
        ["pending", "running"].includes(String(item.state ?? item.status).toLowerCase()),
      )
      if (!invocation.wait || !pending || status.data.pullRequest.merged === true) {
        if (invocation.json) return forgejoCliPullRequestJson(status.data, options)
        const lines = [
          `${forgejoCliPullRequestPrefix(invocation.style, "●")}${status.data.pullRequest.state ?? "unknown"}`,
        ]
        for (const item of status.data.statuses)
          lines.push(`${item.context ?? "status"}: ${item.state ?? item.status ?? "unknown"}`)
        return forgejoCliPullRequestWrite(`${lines.join("\n")}\n`, options)
      }
      await (options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))))(5000)
    } while (true)
  }

  if (invocation.kind === "pr-checkout") {
    const execute = options.execute
    if (!execute) return createResultError("forgejoCliPullRequestRun", "Git execution is required for pr checkout")
    const clean = await execute({ command: "git", args: ["status", "--porcelain"], cwd: invocation.cwd })
    if (!clean.success) return createResultError("forgejoCliPullRequestRun", clean.errorMessage)
    if (clean.data.trim().length > 0)
      return createResultError("forgejoCliPullRequestRun", "Working tree is dirty; commit or stash changes first")
    const resolvedReference = await forgejoPullRequestReferenceResolve(transport, input)
    if (!resolvedReference.success) return createResultError("forgejoCliPullRequestRun", resolvedReference.errorMessage)
    const metadata = await forgejoRepositoryCloneMetadataGet(transport, resolvedReference.data.repository)
    if (!metadata.success) return createResultError("forgejoCliPullRequestRun", metadata.errorMessage)
    const ssh = invocation.ssh ?? false
    const selectedUrl = ssh ? metadata.data.sshUrl : metadata.data.cloneUrl
    if (!selectedUrl) return createResultError("forgejoCliPullRequestRun", "Forgejo did not return a clone URL")
    const defaults = await forgejoDefaultsResolve({ env: options.env, cwd: invocation.cwd })
    if (!defaults.success) return createResultError("forgejoCliPullRequestRun", defaults.errorMessage)
    const url = ssh ? forgejoSshUrlApplyBase(selectedUrl, defaults.data.sshBase) : selectedUrl
    const fetchArgs = [
      "fetch",
      ...(ssh && invocation.identityFile
        ? ["-c", `core.sshCommand=${forgejoCliSshCommandCreate(invocation.identityFile)}`]
        : []),
      url,
      `pull/${reference.data.reference.number}/head`,
    ]
    const fetched = await execute({ command: "git", args: fetchArgs, cwd: invocation.cwd })
    if (!fetched.success) return createResultError("forgejoCliPullRequestRun", fetched.errorMessage)
    const branch =
      invocation.branch ?? `pr-${resolvedReference.data.repository.owner}-${reference.data.reference.number}`
    const checkedOut = await execute({
      command: "git",
      args: ["checkout", "-B", branch, "FETCH_HEAD"],
      cwd: invocation.cwd,
    })
    if (!checkedOut.success) return createResultError("forgejoCliPullRequestRun", checkedOut.errorMessage)
    return forgejoCliPullRequestActionWrite(
      { checkedOut: true, branch, number: reference.data.reference.number },
      `Checked out #${reference.data.reference.number} as ${branch}`,
      invocation,
      options,
    )
  }

  if (invocation.kind === "pr-comment") {
    const body = await forgejoCliPullRequestInput(
      invocation.body,
      invocation.bodyFile,
      invocation.stdin,
      invocation.editor,
      "",
      options,
    )
    if (!body.success || body.data === undefined)
      return body.success ? createResultError("forgejoCliPullRequestRun", "Comment body is required") : body
    const comment = await forgejoPullRequestCommentCreate(transport, input, { body: body.data })
    if (!comment.success) return createResultError("forgejoCliPullRequestRun", comment.errorMessage)
    return invocation.json
      ? forgejoCliPullRequestJson(comment.data, options)
      : forgejoCliPullRequestActionWrite(
          { commented: true, number: reference.data.reference.number },
          "Comment added",
          invocation,
          options,
        )
  }

  if (invocation.kind === "pr-assign" || invocation.kind === "pr-unassign") {
    const changed =
      invocation.kind === "pr-assign"
        ? await forgejoPullRequestAssigneeAdd(transport, input, invocation.users)
        : await forgejoPullRequestAssigneeRemove(transport, input, invocation.users)
    if (!changed.success) return createResultError("forgejoCliPullRequestRun", changed.errorMessage)
    return invocation.json
      ? forgejoCliPullRequestJson(changed.data, options)
      : forgejoCliPullRequestActionWrite(
          { users: invocation.users, number: reference.data.reference.number },
          invocation.kind === "pr-assign" ? "Assignees added" : "Assignees removed",
          invocation,
          options,
        )
  }

  if (invocation.kind === "pr-close") {
    const confirmation = invocation.yes
      ? createResult(true)
      : await forgejoCliPullRequestConfirm(
          `Close pull request #${reference.data.reference.number}?`,
          invocation,
          options,
        )
    if (!confirmation.success) return confirmation
    if (!confirmation.data)
      return forgejoCliPullRequestActionWrite({ cancelled: true }, "Cancelled", invocation, options)
    let message = invocation.message
    if (
      message !== undefined &&
      (invocation.body !== undefined || invocation.bodyFile !== undefined || invocation.stdin || invocation.editor)
    )
      return createResultError("forgejoCliPullRequestRun", "Close message was provided more than once")
    if (
      message === undefined &&
      (invocation.body !== undefined || invocation.bodyFile !== undefined || invocation.stdin || invocation.editor)
    ) {
      const body = await forgejoCliPullRequestInput(
        invocation.body,
        invocation.bodyFile,
        invocation.stdin,
        invocation.editor,
        "",
        options,
      )
      if (!body.success) return body
      message = body.data
    }
    const closed = await forgejoPullRequestClose(transport, input, message)
    if (!closed.success) return createResultError("forgejoCliPullRequestRun", closed.errorMessage)
    return invocation.json
      ? forgejoCliPullRequestJson(closed.data, options)
      : forgejoCliPullRequestActionWrite(
          { closed: true, number: reference.data.reference.number },
          `Closed #${reference.data.reference.number}`,
          invocation,
          options,
        )
  }

  if (invocation.kind === "pr-merge") {
    const confirmation = invocation.yes
      ? createResult(true)
      : await forgejoCliPullRequestConfirm(
          `Merge pull request #${reference.data.reference.number}?`,
          invocation,
          options,
        )
    if (!confirmation.success) return confirmation
    if (!confirmation.data)
      return forgejoCliPullRequestActionWrite({ cancelled: true }, "Cancelled", invocation, options)
    let message = invocation.message
    if (invocation.editor) {
      const current = await forgejoPullRequestGet(transport, input)
      if (!current.success) return createResultError("forgejoCliPullRequestRun", current.errorMessage)
      const edited = await forgejoCliPullRequestInput(
        undefined,
        undefined,
        false,
        true,
        current.data.html_url ?? "",
        options,
      )
      if (!edited.success) return edited
      message = edited.data
    }
    const merged = await forgejoPullRequestMerge(transport, input, {
      method: invocation.method,
      delete: invocation.delete,
      title: invocation.title,
      message,
    })
    if (!merged.success) return createResultError("forgejoCliPullRequestRun", merged.errorMessage)
    return invocation.json
      ? forgejoCliPullRequestJson(merged.data, options)
      : forgejoCliPullRequestActionWrite(
          { merged: true, number: reference.data.reference.number },
          `Merged #${reference.data.reference.number}`,
          invocation,
          options,
        )
  }

  if (
    invocation.kind === "pr-edit-title" ||
    invocation.kind === "pr-edit-body" ||
    invocation.kind === "pr-edit-comment" ||
    invocation.kind === "pr-edit-labels" ||
    invocation.kind === "pr-edit"
  ) {
    let edited: ForgejoResult<unknown>
    if (invocation.kind === "pr-edit-title") {
      const current = invocation.editor ? await forgejoPullRequestGet(transport, input) : createResult({ title: "" })
      if (!current.success) return current
      const title = await forgejoCliPullRequestInput(
        invocation.value,
        undefined,
        false,
        invocation.editor,
        current.data.title ?? "",
        options,
      )
      if (!title.success || title.data === undefined)
        return title.success ? createResultError("forgejoCliPullRequestRun", "Title is required") : title
      edited = await forgejoPullRequestEdit(transport, input, { title: title.data })
    } else if (invocation.kind === "pr-edit-body") {
      const current = invocation.editor ? await forgejoPullRequestGet(transport, input) : createResult({ body: "" })
      if (!current.success) return current
      const body = await forgejoCliPullRequestInput(
        invocation.body,
        invocation.bodyFile,
        invocation.stdin,
        invocation.editor,
        current.data.body ?? "",
        options,
      )
      if (!body.success) return body
      edited = await forgejoPullRequestEdit(transport, input, { body: body.data ?? "" })
    } else if (invocation.kind === "pr-edit-comment") {
      const comments = await forgejoPullRequestCommentsGet(transport, input)
      if (!comments.success) return comments
      const current = comments.data[invocation.comment]
      const body = await forgejoCliPullRequestInput(
        invocation.body,
        invocation.bodyFile,
        invocation.stdin,
        invocation.editor,
        current?.body ?? "",
        options,
      )
      if (!body.success || body.data === undefined)
        return body.success ? createResultError("forgejoCliPullRequestRun", "Comment body is required") : body
      edited = await forgejoPullRequestCommentEdit(transport, input, invocation.comment, body.data)
    } else if (invocation.kind === "pr-edit-labels") {
      edited = await forgejoPullRequestLabelsEdit(transport, input, { add: invocation.add, remove: invocation.remove })
    } else {
      const hasChange =
        invocation.title !== undefined ||
        invocation.body !== undefined ||
        invocation.bodyFile !== undefined ||
        invocation.stdin ||
        invocation.editor ||
        invocation.state !== undefined ||
        invocation.assignees !== undefined ||
        invocation.labelAdd.length > 0 ||
        invocation.labelRemove.length > 0
      if (!hasChange)
        return createResultError("forgejoCliPullRequestRun", "Pull request edit requires at least one change")
      let body: string | undefined
      if (invocation.body !== undefined || invocation.bodyFile !== undefined || invocation.stdin || invocation.editor) {
        const current = invocation.editor ? await forgejoPullRequestGet(transport, input) : createResult({ body: "" })
        if (!current.success) return current
        const value = await forgejoCliPullRequestInput(
          invocation.body,
          invocation.bodyFile,
          invocation.stdin,
          invocation.editor,
          current.data.body ?? "",
          options,
        )
        if (!value.success) return value
        body = value.data
      }
      edited = await forgejoPullRequestEdit(transport, input, {
        title: invocation.title,
        body,
        state: invocation.state,
        assignees: invocation.assignees,
      })
      if (edited.success && (invocation.labelAdd.length > 0 || invocation.labelRemove.length > 0))
        edited = await forgejoPullRequestLabelsEdit(transport, input, {
          add: invocation.labelAdd,
          remove: invocation.labelRemove,
        })
    }
    if (!edited.success) return createResultError("forgejoCliPullRequestRun", edited.errorMessage)
    return invocation.json
      ? forgejoCliPullRequestJson(edited.data, options)
      : forgejoCliPullRequestActionWrite(
          { edited: true, number: reference.data.reference.number },
          `Edited #${reference.data.reference.number}`,
          invocation,
          options,
        )
  }

  if (invocation.kind.startsWith("pr-dependency-") || invocation.kind.startsWith("pr-block-")) {
    const relationInvocation = invocation as Extract<
      ForgejoCliInvocation,
      {
        kind:
          | "pr-dependency-add"
          | "pr-dependency-remove"
          | "pr-dependency-list"
          | "pr-block-add"
          | "pr-block-remove"
          | "pr-block-list"
      }
    >
    const relation = invocation.kind.includes("dependency") ? "dependency" : "block"
    const list = invocation.kind.endsWith("list")
    const targets = []
    for (const raw of relationInvocation.targets) {
      const parsed = forgejoIssueReferenceParse(
        raw.includes("#") ? raw : `${reference.data.reference.repo.owner}/${reference.data.reference.repo.name}#${raw}`,
      )
      if (!parsed.success) return createResultError("forgejoCliPullRequestRun", parsed.errorMessage)
      targets.push(parsed.data)
    }
    if (!list && invocation.kind.endsWith("remove")) {
      const confirmation = relationInvocation.yes
        ? createResult(true)
        : await forgejoCliPullRequestConfirm(
            `Remove ${relation} relationship(s) from #${reference.data.reference.number}?`,
            invocation,
            options,
          )
      if (!confirmation.success) return confirmation
      if (!confirmation.data)
        return forgejoCliPullRequestActionWrite({ cancelled: true }, "Cancelled", invocation, options)
    }
    const result = list
      ? relation === "dependency"
        ? await forgejoPullRequestDependenciesGet(transport, input)
        : await forgejoPullRequestBlockedByList(transport, input)
      : relation === "dependency"
        ? invocation.kind.endsWith("add")
          ? await Promise.all(targets.map((target) => forgejoPullRequestDependencyAdd(transport, input, target))).then(
              (results) => results.find((item) => !item.success) ?? createResult(null),
            )
          : await Promise.all(
              targets.map((target) => forgejoPullRequestDependencyRemove(transport, input, target)),
            ).then((results) => results.find((item) => !item.success) ?? createResult(null))
        : invocation.kind.endsWith("add")
          ? await Promise.all(targets.map((target) => forgejoPullRequestBlockedByAdd(transport, input, target))).then(
              (results) => results.find((item) => !item.success) ?? createResult(null),
            )
          : await Promise.all(
              targets.map((target) => forgejoPullRequestBlockedByRemove(transport, input, target)),
            ).then((results) => results.find((item) => !item.success) ?? createResult(null))
    if (!result.success) return createResultError("forgejoCliPullRequestRun", result.errorMessage)
    return list
      ? forgejoCliPullRequestValueWrite(result.data, invocation, options)
      : forgejoCliPullRequestActionWrite(
          { changed: true, number: reference.data.reference.number },
          "Pull request relationship updated",
          invocation,
          options,
        )
  }

  if (invocation.kind === "pr-review") {
    const reviews = await forgejoPullRequestReviewsList(transport, input, { all: invocation.all })
    if (!reviews.success) return createResultError("forgejoCliPullRequestRun", reviews.errorMessage)
    if (!invocation.comments) return forgejoCliPullRequestValueWrite(reviews.data, invocation, options)
    const withComments = []
    for (const review of reviews.data) {
      const comments =
        typeof review.id === "number"
          ? await forgejoPullRequestReviewCommentsList(transport, input, review.id)
          : createResult([])
      if (!comments.success) return createResultError("forgejoCliPullRequestRun", comments.errorMessage)
      withComments.push({ review, comments: comments.data })
    }
    return forgejoCliPullRequestValueWrite(withComments, invocation, options)
  }

  return createResultError("forgejoCliPullRequestRun", `Unsupported pull request command '${invocation.kind}'`)
}
