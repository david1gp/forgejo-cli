import { readFile } from "node:fs/promises"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"

export async function forgejoCliAvatarFileRead(
  path: string,
  fileRead?: ForgejoCliRunOptions["fileRead"],
): Promise<ForgejoResult<Uint8Array>> {
  const op = "forgejoCliAvatarFileRead"
  if (fileRead) {
    const result = await fileRead(path, "binary")
    if (!result.success) return createResultError(op, `Unable to read avatar file '${path}': ${result.errorMessage}`)
    if (typeof result.data === "string") return createResult(new TextEncoder().encode(result.data))
    return createResult(result.data)
  }
  try {
    return createResult(await readFile(path))
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return createResultError(op, `Avatar file not found: '${path}'`)
    return createResultError(op, `Unable to read avatar file '${path}'`)
  }
}
