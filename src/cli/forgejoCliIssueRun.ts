import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoClientCreate } from "../client/forgejoClientCreate.js"
import { forgejoIssueAssigneeAdd } from "../issues/assignees/forgejoIssueAssigneeAdd.js"
import { forgejoIssueAssigneeRemove } from "../issues/assignees/forgejoIssueAssigneeRemove.js"
import { forgejoIssueBlockedByAdd } from "../issues/dependencies/forgejoIssueBlockedByAdd.js"
import { forgejoIssueBlockedByList } from "../issues/dependencies/forgejoIssueBlockedByList.js"
import { forgejoIssueBlockedByRemove } from "../issues/dependencies/forgejoIssueBlockedByRemove.js"
import { forgejoIssueCommentCreate } from "../issues/comments/forgejoIssueCommentCreate.js"
import { forgejoIssueCommentEdit } from "../issues/comments/forgejoIssueCommentEdit.js"
import { forgejoIssueCommentGet } from "../issues/comments/forgejoIssueCommentGet.js"
import { forgejoIssueCommentsGet } from "../issues/comments/forgejoIssueCommentsGet.js"
import { forgejoIssueCreate } from "../issues/forgejoIssueCreate.js"
import { forgejoIssueDependencyAdd } from "../issues/dependencies/forgejoIssueDependencyAdd.js"
import { forgejoIssueDependencyList } from "../issues/dependencies/forgejoIssueDependencyList.js"
import { forgejoIssueDependencyRemove } from "../issues/dependencies/forgejoIssueDependencyRemove.js"
import { forgejoIssueEdit } from "../issues/forgejoIssueEdit.js"
import { forgejoIssueGet } from "../issues/forgejoIssueGet.js"
import { forgejoIssueLabelsEdit } from "../issues/labels/forgejoIssueLabelsEdit.js"
import { forgejoIssueSearch } from "../issues/forgejoIssueSearch.js"
import { forgejoIssueTemplatesGet } from "../issues/templates/forgejoIssueTemplatesGet.js"
import { forgejoIssueReferenceParse } from "../issues/forgejoIssueReferenceParse.js"
import { forgejoRepositoryContextResolve } from "../repositories/forgejoRepositoryContextResolve.js"
import { forgejoRepositoryGet } from "../repositories/forgejoRepositoryGet.js"
import { forgejoCliBrowserOpen } from "./forgejoCliBrowserOpen.js"
import { forgejoCliEditorOpen } from "./forgejoCliEditorOpen.js"
import type { ForgejoCliInvocation } from "./forgejoCliParse.js"
import { forgejoCliTextRead } from "./forgejoCliTextRead.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"

type ForgejoCliIssueInvocation = Extract<ForgejoCliInvocation, { kind: `issue-${string}` }>
type ForgejoCliIssueRunOptions = ForgejoCliRunOptions & { env: Record<string, string | undefined> }

function forgejoCliIssuePrefix(style: "fancy" | "minimal", symbol: string) {
  return style === "fancy" ? `${symbol} ` : ""
}

function forgejoCliIssueRepositoryString(repository: { host?: string; owner: string; name: string }): string {
  return `${repository.host ? `${repository.host}/` : ""}${repository.owner}/${repository.name}`
}

function forgejoCliIssueWrite(output: string, options: ForgejoCliIssueRunOptions): ForgejoResult<null> {
  try {
    return options.outputWrite ? options.outputWrite(output) : (process.stdout.write(output), createResult(null))
  } catch {
    return createResultError("forgejoCliIssueRun", "Unable to write command output")
  }
}

function forgejoCliIssueJson(
  value: unknown,
  invocation: ForgejoCliIssueInvocation,
  options: ForgejoCliIssueRunOptions,
) {
  try {
    return forgejoCliIssueWrite(`${JSON.stringify(value)}\n`, options)
  } catch {
    return createResultError("forgejoCliIssueRun", `Unable to serialize ${invocation.kind}`)
  }
}

function forgejoCliIssueValueWrite(
  value: unknown,
  invocation: ForgejoCliIssueInvocation,
  options: ForgejoCliIssueRunOptions,
) {
  if (invocation.json) return forgejoCliIssueJson(value, invocation, options)
  if (typeof value === "string") return forgejoCliIssueWrite(`${value}${value.endsWith("\n") ? "" : "\n"}`, options)
  if (Array.isArray(value)) {
    const lines = value.map((item) => {
      if (typeof item !== "object" || item === null) return String(item)
      const record = item as Record<string, unknown>
      if (typeof record.login === "string") return record.login
      if (typeof record.number === "number") return `#${record.number}\t${String(record.title ?? "")}`
      return JSON.stringify(item)
    })
    return forgejoCliIssueWrite(`${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`, options)
  }
  return forgejoCliIssueWrite(`${JSON.stringify(value)}\n`, options)
}

function forgejoCliIssueActionWrite(
  value: Record<string, unknown>,
  message: string,
  invocation: ForgejoCliIssueInvocation,
  options: ForgejoCliIssueRunOptions,
) {
  if (invocation.json) return forgejoCliIssueJson(value, invocation, options)
  return forgejoCliIssueWrite(`${forgejoCliIssuePrefix(invocation.style, "✓")}${message}\n`, options)
}

async function forgejoCliIssueContext(
  invocation: ForgejoCliIssueInvocation,
  options: ForgejoCliIssueRunOptions,
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
  if (!context.success) return createResultError("forgejoCliIssueRun", context.errorMessage)
  const client = await forgejoClientCreate({ baseUrl: context.data.baseUrl, env: options.env, fetch: options.fetch })
  if (!client.success) return createResultError("forgejoCliIssueRun", client.errorMessage)
  return createResult({ context: context.data, client: client.data })
}

function forgejoCliIssueNumberReference(
  raw: string,
  repository: ForgejoCliIssueInvocation["repository"],
  fallback: unknown,
) {
  const parsed = forgejoIssueReferenceParse(raw)
  if (!parsed.success) return parsed
  if (parsed.data.repo && repository !== undefined)
    return createResultError("forgejoCliIssueRun", "Use either an issue repository reference or --repo")
  return createResult({
    number: parsed.data.number,
    repo: parsed.data.repo ?? fallback,
  })
}

async function forgejoCliIssueInput(
  value: string | undefined,
  bodyFile: string | undefined,
  stdin: boolean,
  editor: boolean,
  initial: string,
  options: ForgejoCliIssueRunOptions,
): Promise<ForgejoResult<string>> {
  const sources = [value !== undefined, bodyFile !== undefined, stdin, editor].filter(Boolean).length
  if (sources > 1) return createResultError("forgejoCliIssueRun", "Input was provided more than once")
  if (value !== undefined) return createResult(value)
  if (bodyFile !== undefined) return forgejoCliTextRead(bodyFile, { stdinRead: options.stdinRead })
  if (stdin) return forgejoCliTextRead("-", { stdinRead: options.stdinRead })
  if (editor) return (options.editor ?? ((text) => forgejoCliEditorOpen(text, options.env)))(initial, "md")
  return createResultError("forgejoCliIssueRun", "Input is required; provide text, --body-file, --stdin, or --editor")
}

async function forgejoCliIssueConfirm(
  message: string,
  invocation: ForgejoCliIssueInvocation,
  options: ForgejoCliIssueRunOptions,
): Promise<ForgejoResult<boolean>> {
  if (options.confirm) return createResult(await options.confirm(message))
  if (!process.stdin.isTTY)
    return createResultError("forgejoCliIssueRun", "Confirmation is required; use --yes in non-interactive mode")
  const prompt = forgejoCliIssueWrite(`${forgejoCliIssuePrefix(invocation.style, "?")}${message} [y/N] `, options)
  if (!prompt.success) return prompt
  return await new Promise((resolve) => {
    process.stdin.once("data", (data) => resolve(createResult(/^y(es)?$/i.test(String(data).trim()))))
  })
}

async function forgejoCliIssueReferenceContext(
  invocation: ForgejoCliIssueInvocation & { issue: string },
  options: ForgejoCliIssueRunOptions,
) {
  const parsed = forgejoIssueReferenceParse(invocation.issue)
  if (!parsed.success) return parsed
  const context = await forgejoCliIssueContext(
    invocation,
    options,
    parsed.data.repo ? forgejoCliIssueRepositoryString(parsed.data.repo) : invocation.repository,
  )
  if (!context.success) return context
  return createResult({
    context: context.data,
    issue: { number: parsed.data.number, repo: parsed.data.repo ?? context.data.context.repository },
  })
}

async function forgejoCliIssueTargetReferences(
  rawTargets: string[],
  repository: ForgejoCliIssueInvocation["repository"],
  fallback: unknown,
) {
  const targets = []
  for (const raw of rawTargets) {
    const target = forgejoCliIssueNumberReference(raw, repository, fallback)
    if (!target.success) return target
    targets.push(target.data)
  }
  return createResult(targets)
}

function forgejoCliIssueHuman(issue: Record<string, unknown>, invocation: ForgejoCliIssueInvocation) {
  const number = typeof issue.number === "number" ? `#${issue.number}` : "issue"
  const title = typeof issue.title === "string" ? issue.title : ""
  const state = typeof issue.state === "string" ? issue.state : ""
  const author =
    typeof (issue.user as Record<string, unknown> | undefined)?.login === "string"
      ? ` by ${(issue.user as Record<string, unknown>).login}`
      : ""
  const lines = [
    `${forgejoCliIssuePrefix(invocation.style, "●")}${number} ${title}${state ? ` (${state})` : ""}${author}`,
  ]
  if (typeof issue.body === "string" && issue.body.length > 0) lines.push("", issue.body)
  return `${lines.join("\n")}\n`
}

async function forgejoCliIssueCreateRun(
  invocation: Extract<ForgejoCliIssueInvocation, { kind: "issue-create" }>,
  options: ForgejoCliIssueRunOptions,
) {
  const context = await forgejoCliIssueContext(invocation, options, invocation.repository)
  if (!context.success) return context
  let labels = invocation.labels
  let ref: string | undefined
  if (invocation.template) {
    const templates = await forgejoIssueTemplatesGet(context.data.client.transport, context.data.context.repository)
    if (!templates.success) return createResultError("forgejoCliIssueRun", templates.errorMessage)
    const template = templates.data.find(
      (item) =>
        item.name === invocation.template ||
        item.file_name === invocation.template ||
        item.file_name?.endsWith(`/${invocation.template}`),
    )
    if (!template)
      return createResultError("forgejoCliIssueRun", `Issue template was not found: ${invocation.template}`)
    labels = [...labels, ...(template.labels ?? [])]
    ref = template.ref ?? undefined
  }
  if (invocation.web) {
    const repository = await forgejoRepositoryGet(context.data.client.transport, context.data.context.repository)
    if (!repository.success) return createResultError("forgejoCliIssueRun", repository.errorMessage)
    if (!repository.data.html_url)
      return createResultError("forgejoCliIssueRun", "Forgejo did not return a repository URL")
    const url = `${repository.data.html_url.replace(/\/$/, "")}/issues/new`
    const opened = await (options.browserOpen ?? forgejoCliBrowserOpen)(url)
    if (!opened.success) return opened
    return forgejoCliIssueActionWrite({ opened: true, url }, `Opened ${url}`, invocation, options)
  }
  let body: string | undefined
  if (invocation.body !== undefined || invocation.bodyFile !== undefined || invocation.stdin || invocation.editor) {
    const input = await forgejoCliIssueInput(
      invocation.body,
      invocation.bodyFile,
      invocation.stdin,
      invocation.editor,
      "",
      options,
    )
    if (!input.success) return input
    body = input.data
  }
  const created = await forgejoIssueCreate(context.data.client.transport, context.data.context.repository, {
    title: invocation.title,
    body,
    labels,
    assignees: invocation.assignees,
    ref,
  })
  if (!created.success) return createResultError("forgejoCliIssueRun", created.errorMessage)
  if (invocation.json) return forgejoCliIssueJson(created.data, invocation, options)
  return forgejoCliIssueWrite(forgejoCliIssueHuman(created.data as Record<string, unknown>, invocation), options)
}

export async function forgejoCliIssueRun(
  invocation: ForgejoCliIssueInvocation,
  options: ForgejoCliIssueRunOptions,
): Promise<ForgejoResult<null>> {
  if (invocation.kind === "issue-create") return forgejoCliIssueCreateRun(invocation, options)
  const hasIssue = "issue" in invocation
  if (!hasIssue) {
    const context = await forgejoCliIssueContext(invocation, options, invocation.repository)
    if (!context.success) return context
    if (invocation.kind === "issue-search") {
      const values = []
      let page = invocation.page
      do {
        const result = await forgejoIssueSearch(context.data.client.transport, context.data.context.repository, {
          q: invocation.query,
          labels: invocation.labels,
          createdBy: invocation.creator,
          assignedBy: invocation.assignee,
          state: invocation.state,
          page,
          limit: invocation.limit,
        })
        if (!result.success) return createResultError("forgejoCliIssueRun", result.errorMessage)
        values.push(...result.data)
        if (!invocation.all || result.data.length < invocation.limit) break
        page += 1
      } while (true)
      if (invocation.json) return forgejoCliIssueJson(values, invocation, options)
      return forgejoCliIssueValueWrite(values, invocation, options)
    }
    if (invocation.kind === "issue-templates") {
      const templates = await forgejoIssueTemplatesGet(context.data.client.transport, context.data.context.repository)
      if (!templates.success) return createResultError("forgejoCliIssueRun", templates.errorMessage)
      return forgejoCliIssueValueWrite(templates.data, invocation, options)
    }
    return createResultError("forgejoCliIssueRun", "Unsupported issue command")
  }

  const reference = await forgejoCliIssueReferenceContext(invocation, options)
  if (!reference.success) return reference
  const transport = reference.data.context.client.transport
  const issue = reference.data.issue
  const issueInput = issue

  if (invocation.kind === "issue-view" || invocation.kind === "issue-browse") {
    const viewed = await forgejoIssueGet(transport, issueInput)
    if (!viewed.success) return createResultError("forgejoCliIssueRun", viewed.errorMessage)
    if (invocation.kind === "issue-browse") {
      if (!viewed.data.html_url) return createResultError("forgejoCliIssueRun", "Forgejo did not return an issue URL")
      const opened = await (options.browserOpen ?? forgejoCliBrowserOpen)(viewed.data.html_url)
      if (!opened.success) return opened
      return forgejoCliIssueActionWrite(
        { opened: true, url: viewed.data.html_url },
        `Opened ${viewed.data.html_url}`,
        invocation,
        options,
      )
    }
    if (!invocation.view)
      return invocation.json
        ? forgejoCliIssueJson(viewed.data, invocation, options)
        : forgejoCliIssueWrite(forgejoCliIssueHuman(viewed.data as Record<string, unknown>, invocation), options)
    if (invocation.view === "body") return forgejoCliIssueValueWrite(viewed.data.body ?? "", invocation, options)
    if (invocation.view === "assignees")
      return forgejoCliIssueValueWrite(viewed.data.assignees ?? [], invocation, options)
    const comments = await forgejoIssueCommentsGet(transport, issueInput)
    if (!comments.success) return createResultError("forgejoCliIssueRun", comments.errorMessage)
    if (invocation.view === "comments") return forgejoCliIssueValueWrite(comments.data, invocation, options)
    const comment = comments.data[invocation.comment ?? -1]
    if (!comment) return createResultError("forgejoCliIssueRun", `Comment ${invocation.comment} was not found`)
    return forgejoCliIssueValueWrite(comment, invocation, options)
  }

  if (invocation.kind === "issue-comment") {
    const body = await forgejoCliIssueInput(
      invocation.body,
      invocation.bodyFile,
      invocation.stdin,
      invocation.editor,
      "",
      options,
    )
    if (!body.success) return body
    const comment = await forgejoIssueCommentCreate(transport, issueInput, body.data)
    if (!comment.success) return createResultError("forgejoCliIssueRun", comment.errorMessage)
    return invocation.json
      ? forgejoCliIssueJson(comment.data, invocation, options)
      : forgejoCliIssueActionWrite({ commented: true, issue: issue.number }, "Comment added", invocation, options)
  }

  if (invocation.kind === "issue-edit-comment") {
    const current = await forgejoIssueCommentsGet(transport, issueInput)
    if (!current.success) return current
    const selected = current.data[invocation.comment]
    if (!selected?.id) return createResultError("forgejoCliIssueRun", `Comment ${invocation.comment} was not found`)
    const initial = selected.body ?? ""
    const body = await forgejoCliIssueInput(
      invocation.body,
      invocation.bodyFile,
      invocation.stdin,
      invocation.editor,
      initial,
      options,
    )
    if (!body.success) return body
    const edited = await forgejoIssueCommentEdit(transport, issueInput, selected.id, body.data)
    if (!edited.success) return createResultError("forgejoCliIssueRun", edited.errorMessage)
    return invocation.json
      ? forgejoCliIssueJson(edited.data, invocation, options)
      : forgejoCliIssueActionWrite({ edited: true, comment: invocation.comment }, "Comment edited", invocation, options)
  }

  if (invocation.kind === "issue-assign" || invocation.kind === "issue-unassign") {
    const changed =
      invocation.kind === "issue-assign"
        ? await forgejoIssueAssigneeAdd(transport, issueInput, invocation.users)
        : await forgejoIssueAssigneeRemove(transport, issueInput, invocation.users)
    if (!changed.success) return createResultError("forgejoCliIssueRun", changed.errorMessage)
    return invocation.json
      ? forgejoCliIssueJson(changed.data, invocation, options)
      : forgejoCliIssueActionWrite(
          { users: invocation.users, issue: issue.number },
          invocation.kind === "issue-assign" ? "Assignees added" : "Assignees removed",
          invocation,
          options,
        )
  }

  if (invocation.kind === "issue-close") {
    const confirmation = invocation.yes
      ? createResult(true)
      : await forgejoCliIssueConfirm(`Close issue #${issue.number}?`, invocation, options)
    if (!confirmation.success) return confirmation
    if (!confirmation.data) return forgejoCliIssueActionWrite({ cancelled: true }, "Cancelled", invocation, options)
    const hasMessage =
      invocation.message !== undefined ||
      invocation.body !== undefined ||
      invocation.bodyFile !== undefined ||
      invocation.stdin ||
      invocation.editor
    if (hasMessage) {
      const body = await forgejoCliIssueInput(
        invocation.message ?? invocation.body,
        invocation.bodyFile,
        invocation.stdin,
        invocation.editor,
        "",
        options,
      )
      if (!body.success) return body
      const comment = await forgejoIssueCommentCreate(transport, issueInput, body.data)
      if (!comment.success) return createResultError("forgejoCliIssueRun", comment.errorMessage)
    }
    const closed = await forgejoIssueEdit(transport, issueInput, { state: "closed" })
    if (!closed.success) return createResultError("forgejoCliIssueRun", closed.errorMessage)
    return invocation.json
      ? forgejoCliIssueJson(closed.data, invocation, options)
      : forgejoCliIssueActionWrite(
          { closed: true, issue: issue.number },
          `Closed #${issue.number}`,
          invocation,
          options,
        )
  }

  if (
    invocation.kind === "issue-edit-title" ||
    invocation.kind === "issue-edit-body" ||
    invocation.kind === "issue-edit-labels" ||
    invocation.kind === "issue-edit"
  ) {
    let edited: ForgejoResult<unknown> | undefined
    if (invocation.kind === "issue-edit-title") {
      const current = invocation.editor
        ? await forgejoIssueGet(transport, issueInput)
        : createResult({} as Record<string, unknown>)
      if (!current.success) return current
      const title = await forgejoCliIssueInput(
        invocation.value,
        undefined,
        false,
        invocation.editor,
        ((current.data as Record<string, unknown>).title as string) ?? "",
        options,
      )
      if (!title.success) return title
      edited = await forgejoIssueEdit(transport, issueInput, { title: title.data })
    } else if (invocation.kind === "issue-edit-body") {
      const current = invocation.editor
        ? await forgejoIssueGet(transport, issueInput)
        : createResult({} as Record<string, unknown>)
      if (!current.success) return current
      const body = await forgejoCliIssueInput(
        invocation.body,
        invocation.bodyFile,
        invocation.stdin,
        invocation.editor,
        ((current.data as Record<string, unknown>).body as string) ?? "",
        options,
      )
      if (!body.success) return body
      edited = await forgejoIssueEdit(transport, issueInput, { body: body.data })
    } else if (invocation.kind === "issue-edit-labels") {
      edited = await forgejoIssueLabelsEdit(transport, issueInput, { add: invocation.add, remove: invocation.remove })
    } else {
      if (
        invocation.title === undefined &&
        invocation.body === undefined &&
        invocation.bodyFile === undefined &&
        !invocation.stdin &&
        !invocation.editor &&
        invocation.state === undefined &&
        invocation.assignees === undefined &&
        invocation.labelAdd.length === 0 &&
        invocation.labelRemove.length === 0
      )
        return createResultError("forgejoCliIssueRun", "Issue edit requires at least one change")
      let initial = ""
      if (invocation.editor) {
        const current = await forgejoIssueGet(transport, issueInput)
        if (!current.success) return createResultError("forgejoCliIssueRun", current.errorMessage)
        initial = current.data.body ?? ""
      }
      const body =
        invocation.body !== undefined || invocation.bodyFile !== undefined || invocation.stdin || invocation.editor
          ? await forgejoCliIssueInput(
              invocation.body,
              invocation.bodyFile,
              invocation.stdin,
              invocation.editor,
              initial,
              options,
            )
          : createResult<string | undefined>(undefined)
      if (!body.success) return body
      edited = await forgejoIssueEdit(transport, issueInput, {
        title: invocation.title,
        body: body.data,
        state: invocation.state,
        assignees: invocation.assignees,
      })
      if (invocation.labelAdd.length > 0 || invocation.labelRemove.length > 0)
        edited = await forgejoIssueLabelsEdit(transport, issueInput, {
          add: invocation.labelAdd,
          remove: invocation.labelRemove,
        })
    }
    if (!edited) return createResultError("forgejoCliIssueRun", "Issue edit failed")
    if (!edited.success) return createResultError("forgejoCliIssueRun", edited.errorMessage)
    return invocation.json
      ? forgejoCliIssueJson(edited.data, invocation, options)
      : forgejoCliIssueActionWrite(
          { edited: true, issue: issue.number },
          `Edited #${issue.number}`,
          invocation,
          options,
        )
  }

  if (
    invocation.kind === "issue-dependency-add" ||
    invocation.kind === "issue-dependency-remove" ||
    invocation.kind === "issue-dependency-list" ||
    invocation.kind === "issue-block-add" ||
    invocation.kind === "issue-block-remove" ||
    invocation.kind === "issue-block-list"
  ) {
    const targets =
      "targets" in invocation
        ? await forgejoCliIssueTargetReferences(
            invocation.targets,
            invocation.repository,
            reference.data.context.context.repository,
          )
        : createResult([])
    if (!targets.success) return targets
    const dependency = invocation.kind.includes("dependency")
    const list = invocation.kind.endsWith("list")
    const result = list
      ? dependency
        ? await forgejoIssueDependencyList(transport, issueInput)
        : await forgejoIssueBlockedByList(transport, issueInput)
      : dependency
        ? invocation.kind.endsWith("add")
          ? await forgejoIssueDependencyAdd(transport, issueInput, targets.data)
          : await forgejoIssueDependencyRemove(transport, issueInput, targets.data)
        : invocation.kind.endsWith("add")
          ? await forgejoIssueBlockedByAdd(transport, issueInput, targets.data)
          : await forgejoIssueBlockedByRemove(transport, issueInput, targets.data)
    if (!result.success) return createResultError("forgejoCliIssueRun", result.errorMessage)
    return list
      ? forgejoCliIssueValueWrite(result.data, invocation, options)
      : forgejoCliIssueActionWrite(
          { changed: true, issue: issue.number },
          "Issue relationship updated",
          invocation,
          options,
        )
  }
  return createResultError("forgejoCliIssueRun", `Unsupported issue command '${invocation.kind}'`)
}
