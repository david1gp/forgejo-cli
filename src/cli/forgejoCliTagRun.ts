import { createResult, createResultError } from "#result"
import { forgejoClientCreate } from "../client/forgejoClientCreate.js"
import { forgejoRepositoryContextResolve } from "../repositories/forgejoRepositoryContextResolve.js"
import { forgejoTagCreate } from "../tags/forgejoTagCreate.js"
import { forgejoTagDelete } from "../tags/forgejoTagDelete.js"
import { forgejoTagGet } from "../tags/forgejoTagGet.js"
import { forgejoTagList } from "../tags/forgejoTagList.js"
import { forgejoCliEditorOpen } from "./forgejoCliEditorOpen.js"
import type { ForgejoCliInvocation } from "./forgejoCliParse.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"
import { forgejoCliTextRead } from "./forgejoCliTextRead.js"
import type { ForgejoResult } from "../errors/forgejoResult.js"

type ForgejoCliTagInvocation = Extract<ForgejoCliInvocation, { kind: `tag-${string}` }>
type ForgejoCliTagOptions = ForgejoCliRunOptions & { env: Record<string, string | undefined> }

function forgejoCliTagWrite(output: string, options: ForgejoCliTagOptions): ForgejoResult<null> {
  try {
    return options.outputWrite ? options.outputWrite(output) : (process.stdout.write(output), createResult(null))
  } catch {
    return createResultError("forgejoCliTagRun", "Unable to write command output")
  }
}

function forgejoCliTagJson(value: unknown, options: ForgejoCliTagOptions): ForgejoResult<null> {
  try {
    return forgejoCliTagWrite(`${JSON.stringify(value)}\n`, options)
  } catch {
    return createResultError("forgejoCliTagRun", "Unable to serialize tag output")
  }
}

function forgejoCliTagPrefix(style: "fancy" | "minimal", symbol: string): string {
  return style === "fancy" ? `${symbol} ` : ""
}

function forgejoCliTagAction(
  value: Record<string, unknown>,
  message: string,
  invocation: ForgejoCliTagInvocation,
  options: ForgejoCliTagOptions,
): ForgejoResult<null> {
  if (invocation.json) return forgejoCliTagJson(value, options)
  return forgejoCliTagWrite(`${forgejoCliTagPrefix(invocation.style, "✓")}${message}\n`, options)
}

async function forgejoCliTagContext(
  invocation: ForgejoCliTagInvocation,
  options: ForgejoCliTagOptions,
  repository?: string,
) {
  const context = await forgejoRepositoryContextResolve({
    repository,
    host: invocation.host,
    remote: invocation.remote,
    cwd: invocation.cwd,
    env: options.env,
    execute: options.execute,
  })
  if (!context.success) return createResultError("forgejoCliTagRun", context.errorMessage)
  const client = await forgejoClientCreate({ baseUrl: context.data.baseUrl, env: options.env, fetch: options.fetch })
  if (!client.success) return createResultError("forgejoCliTagRun", client.errorMessage)
  return createResult({ context: context.data, client: client.data })
}

async function forgejoCliTagInput(
  invocation: Extract<ForgejoCliTagInvocation, { kind: "tag-create" }>,
  options: ForgejoCliTagOptions,
): Promise<ForgejoResult<string | undefined>> {
  const sources = [
    invocation.body !== undefined,
    invocation.bodyFile !== undefined,
    invocation.stdin,
    invocation.editor,
  ].filter(Boolean).length
  if (sources > 1) return createResultError("forgejoCliTagRun", "Tag message was provided more than once")
  if (invocation.body !== undefined) return createResult(invocation.body)
  if (invocation.bodyFile !== undefined)
    return forgejoCliTextRead(invocation.bodyFile, { stdinRead: options.stdinRead, fileRead: options.fileRead })
  if (invocation.stdin) return forgejoCliTextRead("-", { stdinRead: options.stdinRead })
  if (invocation.editor) return (options.editor ?? ((text) => forgejoCliEditorOpen(text, options.env)))("", "md")
  return createResult(undefined)
}

function forgejoCliTagHuman(tag: Record<string, unknown>, invocation: ForgejoCliTagInvocation): string {
  const name = typeof tag.name === "string" ? tag.name : "tag"
  const lines = [`${forgejoCliTagPrefix(invocation.style, "●")}${name}`]
  if (typeof tag.id === "string") lines.push(`object: ${tag.id}`)
  if (typeof tag.message === "string" && tag.message.length > 0) lines.push("", tag.message)
  return `${lines.join("\n")}\n`
}

export async function forgejoCliTagRun(
  invocation: ForgejoCliTagInvocation,
  options: ForgejoCliTagOptions,
): Promise<ForgejoResult<null>> {
  const context = await forgejoCliTagContext(invocation, options, invocation.repository)
  if (!context.success) return context
  const transport = context.data.client.transport
  const repository = context.data.context.repository
  if (invocation.kind === "tag-create") {
    const message = await forgejoCliTagInput(invocation, options)
    if (!message.success) return message
    const created = await forgejoTagCreate(transport, repository, {
      tagName: invocation.name,
      message: message.data,
      target: invocation.branch,
    })
    if (!created.success) return createResultError("forgejoCliTagRun", created.errorMessage)
    return forgejoCliTagAction(
      { created: true, tag: created.data },
      `Created tag ${invocation.name}`,
      invocation,
      options,
    )
  }
  if (invocation.kind === "tag-list") {
    const tags = await forgejoTagList(transport, repository, { page: invocation.page, limit: 20 })
    if (!tags.success) return createResultError("forgejoCliTagRun", tags.errorMessage)
    if (invocation.json) return forgejoCliTagJson(tags.data, options)
    const names = tags.data.map((tag) => tag.name ?? "tag")
    return forgejoCliTagWrite(`${names.join("\n")}${names.length > 0 ? "\n" : ""}`, options)
  }
  if (invocation.kind === "tag-view") {
    const tag = await forgejoTagGet(transport, repository, invocation.name)
    if (!tag.success) return createResultError("forgejoCliTagRun", tag.errorMessage)
    return invocation.json
      ? forgejoCliTagJson(tag.data, options)
      : forgejoCliTagWrite(forgejoCliTagHuman(tag.data as Record<string, unknown>, invocation), options)
  }
  if (invocation.kind === "tag-delete") {
    const deleted = await forgejoTagDelete(transport, repository, invocation.name)
    if (!deleted.success) return createResultError("forgejoCliTagRun", deleted.errorMessage)
    return forgejoCliTagAction(
      { deleted: true, tag: invocation.name },
      `Deleted tag ${invocation.name}`,
      invocation,
      options,
    )
  }
  return createResultError("forgejoCliTagRun", `Unsupported tag command '${invocation.kind}'`)
}
