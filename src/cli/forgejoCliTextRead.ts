import { readFile } from "node:fs/promises"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"

type ForgejoCliTextReadOptions = {
  stdinRead?: () => Promise<ForgejoResult<string>>
  fileRead?: ForgejoCliRunOptions["fileRead"]
}

async function forgejoCliStdinRead(): Promise<ForgejoResult<string>> {
  try {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk))
    return createResult(Buffer.concat(chunks).toString("utf8"))
  } catch {
    return createResultError("forgejoCliTextRead", "Unable to read stdin")
  }
}

export async function forgejoCliTextRead(
  source: string,
  options: ForgejoCliTextReadOptions = {},
): Promise<ForgejoResult<string>> {
  if (source === "-") return (options.stdinRead ?? forgejoCliStdinRead)()
  if (options.fileRead) {
    const result = await options.fileRead(source, "utf8")
    if (!result.success) return result
    return createResult(typeof result.data === "string" ? result.data : new TextDecoder().decode(result.data))
  }
  try {
    return createResult(await readFile(source, "utf8"))
  } catch {
    return createResultError("forgejoCliTextRead", `Unable to read '${source}'`)
  }
}

export type { ForgejoCliTextReadOptions }
