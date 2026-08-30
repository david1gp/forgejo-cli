import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoEnvironmentFileLoad } from "./forgejoEnvironmentFileLoad.js"

type ForgejoEnvironmentFileResolveOptions = {
  cwd?: string
}

export async function forgejoEnvironmentFileResolve(
  options: ForgejoEnvironmentFileResolveOptions = {},
): Promise<ForgejoResult<Record<string, string>>> {
  const op = "forgejoEnvironmentFileResolve"
  const loaded = await forgejoEnvironmentFileLoad(options)
  if (!loaded.success) return createResultError(op, loaded.errorMessage)
  return createResult(loaded.data.values)
}

export type { ForgejoEnvironmentFileResolveOptions }
