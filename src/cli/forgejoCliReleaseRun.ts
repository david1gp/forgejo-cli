import { readFile, writeFile } from "node:fs/promises"
import { basename } from "node:path"
import { createResult, createResultError } from "#result"
import { forgejoClientCreate } from "../client/forgejoClientCreate.js"
import { forgejoReleaseAssetDelete } from "../releases/assets/forgejoReleaseAssetDelete.js"
import { forgejoReleaseAssetDownload } from "../releases/assets/forgejoReleaseAssetDownload.js"
import { forgejoReleaseAssetUpload } from "../releases/assets/forgejoReleaseAssetUpload.js"
import { forgejoReleaseCreate } from "../releases/forgejoReleaseCreate.js"
import { forgejoReleaseDelete } from "../releases/forgejoReleaseDelete.js"
import { forgejoReleaseEdit } from "../releases/forgejoReleaseEdit.js"
import { forgejoReleaseGet } from "../releases/forgejoReleaseGet.js"
import { forgejoReleaseList } from "../releases/forgejoReleaseList.js"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoRepositoryContextResolve } from "../repositories/forgejoRepositoryContextResolve.js"
import { forgejoTagCreate } from "../tags/forgejoTagCreate.js"
import { forgejoCliBrowserOpen } from "./forgejoCliBrowserOpen.js"
import { forgejoCliEditorOpen } from "./forgejoCliEditorOpen.js"
import type { ForgejoCliInvocation } from "./forgejoCliParse.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"
import { forgejoCliTextRead } from "./forgejoCliTextRead.js"

type ForgejoCliReleaseInvocation = Extract<ForgejoCliInvocation, { kind: `release-${string}` }>
type ForgejoCliReleaseOptions = ForgejoCliRunOptions & { env: Record<string, string | undefined> }

function forgejoCliReleaseWrite(output: string, options: ForgejoCliReleaseOptions): ForgejoResult<null> {
  try {
    return options.outputWrite ? options.outputWrite(output) : (process.stdout.write(output), createResult(null))
  } catch {
    return createResultError("forgejoCliReleaseRun", "Unable to write command output")
  }
}

function forgejoCliReleaseJson(value: unknown, options: ForgejoCliReleaseOptions): ForgejoResult<null> {
  try {
    return forgejoCliReleaseWrite(`${JSON.stringify(value)}\n`, options)
  } catch {
    return createResultError("forgejoCliReleaseRun", "Unable to serialize release output")
  }
}

function forgejoCliReleasePrefix(style: "fancy" | "minimal", symbol: string): string {
  return style === "fancy" ? `${symbol} ` : ""
}

function forgejoCliReleaseAction(
  value: Record<string, unknown>,
  message: string,
  invocation: ForgejoCliReleaseInvocation,
  options: ForgejoCliReleaseOptions,
): ForgejoResult<null> {
  if (invocation.json) return forgejoCliReleaseJson(value, options)
  return forgejoCliReleaseWrite(`${forgejoCliReleasePrefix(invocation.style, "✓")}${message}\n`, options)
}

function forgejoCliReleaseReference(invocation: { name: string; byTag?: boolean }): unknown {
  return invocation.byTag ? { tag: invocation.name } : invocation.name
}

async function forgejoCliReleaseContext(
  invocation: ForgejoCliReleaseInvocation,
  options: ForgejoCliReleaseOptions,
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
  if (!context.success) return createResultError("forgejoCliReleaseRun", context.errorMessage)
  const client = await forgejoClientCreate({ baseUrl: context.data.baseUrl, env: options.env, fetch: options.fetch })
  if (!client.success) return createResultError("forgejoCliReleaseRun", client.errorMessage)
  return createResult({ context: context.data, client: client.data })
}

async function forgejoCliReleaseInput(
  value: string | undefined,
  bodyFile: string | undefined,
  stdin: boolean,
  editor: boolean,
  initial: string,
  options: ForgejoCliReleaseOptions,
  required = false,
): Promise<ForgejoResult<string | undefined>> {
  const sources = [value !== undefined, bodyFile !== undefined, stdin, editor].filter(Boolean).length
  if (sources > 1) return createResultError("forgejoCliReleaseRun", "Body input was provided more than once")
  if (value !== undefined) return createResult(value)
  if (bodyFile !== undefined)
    return forgejoCliTextRead(bodyFile, { stdinRead: options.stdinRead, fileRead: options.fileRead })
  if (stdin) return forgejoCliTextRead("-", { stdinRead: options.stdinRead })
  if (editor) return (options.editor ?? ((text) => forgejoCliEditorOpen(text, options.env)))(initial, "md")
  if (!required) return createResult(undefined)
  return createResultError("forgejoCliReleaseRun", "Body is required")
}

async function forgejoCliReleaseFileRead(
  path: string,
  options: ForgejoCliReleaseOptions,
): Promise<ForgejoResult<Uint8Array>> {
  if (options.fileRead) {
    const result = await options.fileRead(path, "binary")
    if (!result.success) return result
    if (typeof result.data === "string") return createResult(new TextEncoder().encode(result.data))
    return createResult(result.data)
  }
  try {
    return createResult(await readFile(path))
  } catch {
    return createResultError("forgejoCliReleaseRun", `Unable to read '${path}'`)
  }
}

async function forgejoCliReleaseFileWrite(
  path: string,
  data: Uint8Array,
  options: ForgejoCliReleaseOptions,
): Promise<ForgejoResult<null>> {
  if (options.fileWrite) return options.fileWrite(path, data, { exclusive: true })
  try {
    await writeFile(path, data, { flag: "wx" })
    return createResult(null)
  } catch {
    return createResultError(
      "forgejoCliReleaseRun",
      `Unable to write '${path}'; refusing to overwrite an existing file`,
    )
  }
}

function forgejoCliReleaseAttachment(value: string): { file: string; name?: string } {
  const separator = value.lastIndexOf(":")
  if (separator <= 0 || separator === value.length - 1) return { file: value }
  return { file: value.slice(0, separator), name: value.slice(separator + 1) }
}

function forgejoCliReleaseHuman(release: Record<string, unknown>, invocation: ForgejoCliReleaseInvocation): string {
  const name = typeof release.name === "string" ? release.name : "release"
  const tag = typeof release.tag_name === "string" ? ` (${release.tag_name})` : ""
  const lines = [`${forgejoCliReleasePrefix(invocation.style, "●")}${name}${tag}`]
  if (release.draft === true) lines.push("draft")
  if (release.prerelease === true) lines.push("prerelease")
  const author = release.author ?? release.published_by ?? release.user
  if (typeof author === "object" && author !== null && "login" in author && typeof author.login === "string")
    lines.push(`author: ${author.login}`)
  if (typeof release.created_at === "string") lines.push(`created: ${release.created_at}`)
  if (typeof release.body === "string" && release.body.length > 0) lines.push("", release.body)
  const assets = Array.isArray(release.assets) ? release.assets : []
  const names = assets.flatMap((asset) => {
    if (typeof asset !== "object" || asset === null) return []
    const assetName = (asset as Record<string, unknown>).name
    return typeof assetName === "string" ? [assetName] : []
  })
  if (names.length > 0) lines.push("", `assets: ${names.join(", ")}`, "source.zip", "source.tar.gz")
  if (typeof release.html_url === "string") lines.push("", release.html_url)
  return `${lines.join("\n")}\n`
}

async function forgejoCliReleaseCreateRun(
  invocation: Extract<ForgejoCliReleaseInvocation, { kind: "release-create" }>,
  options: ForgejoCliReleaseOptions,
): Promise<ForgejoResult<null>> {
  const context = await forgejoCliReleaseContext(invocation, options, invocation.repository)
  if (!context.success) return context
  const body = await forgejoCliReleaseInput(
    invocation.body,
    invocation.bodyFile,
    invocation.stdin,
    invocation.editor,
    "",
    options,
  )
  if (!body.success) return body
  const tagName = invocation.tag ?? invocation.createTagName ?? invocation.name
  if (invocation.createTag) {
    const tag = await forgejoTagCreate(context.data.client.transport, context.data.context.repository, {
      tagName,
      target: invocation.branch,
    })
    if (!tag.success) return createResultError("forgejoCliReleaseRun", tag.errorMessage)
  }
  const created = await forgejoReleaseCreate(context.data.client.transport, context.data.context.repository, {
    tagName,
    name: invocation.name,
    body: body.data,
    draft: invocation.draft,
    prerelease: invocation.prerelease,
  })
  if (!created.success) return createResultError("forgejoCliReleaseRun", created.errorMessage)
  const createdReference = created.data.id ?? created.data.name ?? tagName
  const uploaded = []
  for (const attachmentInput of invocation.attach) {
    const attachment = forgejoCliReleaseAttachment(attachmentInput)
    const data = await forgejoCliReleaseFileRead(attachment.file, options)
    if (!data.success) return data
    const asset = await forgejoReleaseAssetUpload(
      context.data.client.transport,
      context.data.context.repository,
      createdReference,
      {
        name: attachment.name ?? basename(attachment.file),
        data: data.data,
        overwrite: false,
      },
    )
    if (!asset.success) return createResultError("forgejoCliReleaseRun", asset.errorMessage)
    uploaded.push(asset.data)
  }
  if (invocation.json) return forgejoCliReleaseJson({ release: created.data, assets: uploaded }, options)
  return forgejoCliReleaseAction(
    { created: true, release: invocation.name, assets: uploaded.length },
    `Created release ${invocation.name}`,
    invocation,
    options,
  )
}

export async function forgejoCliReleaseRun(
  invocation: ForgejoCliReleaseInvocation,
  options: ForgejoCliReleaseOptions,
): Promise<ForgejoResult<null>> {
  if (invocation.kind === "release-create") return forgejoCliReleaseCreateRun(invocation, options)
  const context = await forgejoCliReleaseContext(invocation, options, invocation.repository)
  if (!context.success) return context
  const transport = context.data.client.transport
  const repository = context.data.context.repository
  if (invocation.kind === "release-list") {
    const releases = await forgejoReleaseList(transport, repository, {
      preRelease: invocation.includePrerelease,
      draft: invocation.includeDraft,
    })
    if (!releases.success) return createResultError("forgejoCliReleaseRun", releases.errorMessage)
    if (invocation.json) return forgejoCliReleaseJson(releases.data, options)
    const lines = releases.data.map((release) => {
      const name = release.name ?? release.tag_name ?? "release"
      const states = [release.draft ? "draft" : "", release.prerelease ? "prerelease" : ""].filter(Boolean)
      return states.length > 0 ? `${name} (${states.join(", ")})` : name
    })
    return forgejoCliReleaseWrite(`${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`, options)
  }
  if (invocation.kind === "release-browse") {
    let url = `${context.data.client.baseUrl}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/releases`
    if (invocation.name) {
      const release = await forgejoReleaseGet(transport, repository, invocation.name)
      if (!release.success) return createResultError("forgejoCliReleaseRun", release.errorMessage)
      if (typeof release.data.html_url === "string") url = release.data.html_url
      else if (typeof release.data.tag_name === "string")
        url = `${url}/tag/${encodeURIComponent(release.data.tag_name)}`
    }
    const opened = await (options.browserOpen ?? forgejoCliBrowserOpen)(url)
    if (!opened.success) return opened
    return forgejoCliReleaseAction({ opened: true, url }, `Opened ${url}`, invocation, options)
  }
  if (invocation.kind === "release-asset-create") {
    const data = await forgejoCliReleaseFileRead(invocation.file, options)
    if (!data.success) return data
    const asset = await forgejoReleaseAssetUpload(transport, repository, invocation.release, {
      name: invocation.assetName ?? basename(invocation.file),
      data: data.data,
      overwrite: false,
    })
    if (!asset.success) return createResultError("forgejoCliReleaseRun", asset.errorMessage)
    return forgejoCliReleaseAction(
      { uploaded: true, asset: asset.data },
      `Added asset ${asset.data.name ?? invocation.assetName ?? basename(invocation.file)}`,
      invocation,
      options,
    )
  }
  if (invocation.kind === "release-asset-delete") {
    const deleted = await forgejoReleaseAssetDelete(transport, repository, invocation.release, invocation.asset)
    if (!deleted.success) return createResultError("forgejoCliReleaseRun", deleted.errorMessage)
    return forgejoCliReleaseAction(
      { deleted: true, asset: invocation.asset },
      `Removed asset ${invocation.asset}`,
      invocation,
      options,
    )
  }
  if (invocation.kind === "release-asset-download") {
    const data = await forgejoReleaseAssetDownload(transport, repository, invocation.release, invocation.asset)
    if (!data.success) return createResultError("forgejoCliReleaseRun", data.errorMessage)
    const path = invocation.output ?? invocation.asset
    const written = await forgejoCliReleaseFileWrite(path, data.data, options)
    if (!written.success) return written
    return forgejoCliReleaseAction(
      { downloaded: true, asset: invocation.asset, path },
      `Downloaded ${invocation.asset} to ${path}`,
      invocation,
      options,
    )
  }
  const releaseInvocation = invocation as Extract<ForgejoCliReleaseInvocation, { name: string }>
  const reference = forgejoCliReleaseReference(releaseInvocation)
  if (invocation.kind === "release-view") {
    const release = await forgejoReleaseGet(transport, repository, reference)
    if (!release.success) return createResultError("forgejoCliReleaseRun", release.errorMessage)
    return invocation.json
      ? forgejoCliReleaseJson(release.data, options)
      : forgejoCliReleaseWrite(forgejoCliReleaseHuman(release.data as Record<string, unknown>, invocation), options)
  }
  if (invocation.kind === "release-delete") {
    const deleted = await forgejoReleaseDelete(transport, repository, reference)
    if (!deleted.success) return createResultError("forgejoCliReleaseRun", deleted.errorMessage)
    return forgejoCliReleaseAction(
      { deleted: true, release: invocation.name },
      `Deleted release ${invocation.name}`,
      invocation,
      options,
    )
  }
  if (invocation.kind === "release-edit") {
    const initial = invocation.editor
      ? await forgejoReleaseGet(transport, repository, invocation.name)
      : createResult({ body: "" })
    if (!initial.success) return createResultError("forgejoCliReleaseRun", initial.errorMessage)
    const body = await forgejoCliReleaseInput(
      invocation.body,
      invocation.bodyFile,
      invocation.stdin,
      invocation.editor,
      initial.data.body ?? "",
      options,
    )
    if (!body.success) return body
    if (
      invocation.rename === undefined &&
      invocation.tag === undefined &&
      body.data === undefined &&
      invocation.draft === undefined &&
      invocation.prerelease === undefined
    )
      return createResultError("forgejoCliReleaseRun", "Release edit requires at least one change")
    const edited = await forgejoReleaseEdit(transport, repository, invocation.name, {
      ...(invocation.rename === undefined ? {} : { name: invocation.rename }),
      ...(invocation.tag === undefined ? {} : { tagName: invocation.tag }),
      ...(body.data === undefined ? {} : { body: body.data }),
      ...(invocation.draft === undefined ? {} : { draft: invocation.draft }),
      ...(invocation.prerelease === undefined ? {} : { prerelease: invocation.prerelease }),
    })
    if (!edited.success) return createResultError("forgejoCliReleaseRun", edited.errorMessage)
    const editedName = edited.data.name ?? invocation.name
    return forgejoCliReleaseAction(
      { edited: true, release: editedName },
      `Edited release ${editedName}`,
      invocation,
      options,
    )
  }
  return createResultError("forgejoCliReleaseRun", `Unsupported release command '${invocation.kind}'`)
}
