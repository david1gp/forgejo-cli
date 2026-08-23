import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawn } from "node:child_process"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"

export async function forgejoCliEditorOpen(
  initial: string,
  env: Record<string, string | undefined> = process.env,
  extension = "md",
): Promise<ForgejoResult<string>> {
  const editor = env.VISUAL ?? env.EDITOR
  if (!editor) return createResultError("forgejoCliEditorOpen", "Set EDITOR or VISUAL, or provide the input explicitly")
  let directory: string | undefined
  try {
    directory = await mkdtemp(join(tmpdir(), "fj-"))
    const suffix = extension.startsWith(".") ? extension : `.${extension}`
    const file = join(directory, `view${suffix}`)
    await writeFile(file, initial, "utf8")
    const result = await new Promise<boolean>((resolve) => {
      const child = spawn(editor, [file], { stdio: "inherit", shell: true })
      child.once("error", () => resolve(false))
      child.once("exit", (code) => resolve(code === 0))
    })
    if (!result) return createResultError("forgejoCliEditorOpen", "The editor did not complete successfully")
    return createResult(await readFile(file, "utf8"))
  } catch {
    return createResultError("forgejoCliEditorOpen", "Unable to open the editor")
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true }).catch(() => undefined)
  }
}
