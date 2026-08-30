import { readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoEnvironmentFileParse } from "./forgejoEnvironmentFileParse.js"

type ForgejoEnvironmentFileLoadOptions = {
  cwd?: string
}

type ForgejoEnvironmentFile = {
  path?: string
  values: Record<string, string>
}

export async function forgejoEnvironmentFileLoad(
  options: ForgejoEnvironmentFileLoadOptions = {},
): Promise<ForgejoResult<ForgejoEnvironmentFile>> {
  const op = "forgejoEnvironmentFileLoad"
  let directory = resolve(options.cwd ?? process.cwd())
  while (true) {
    const path = join(directory, ".env")
    try {
      const text = await readFile(path, "utf8")
      return createResult({ path, values: forgejoEnvironmentFileParse(text) })
    } catch (error) {
      const code = error instanceof Error && "code" in error ? error.code : undefined
      if (code !== "ENOENT") return createResultError(op, "Unable to read Forgejo .env file")
    }
    const parent = dirname(directory)
    if (parent === directory) return createResult({ values: {} })
    directory = parent
  }
}

export type { ForgejoEnvironmentFile, ForgejoEnvironmentFileLoadOptions }
