import { chmod, readFile, stat } from "node:fs/promises"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationParse } from "./forgejoConfigurationParse.js"
import {
  forgejoConfigurationPathResolve,
  type ForgejoConfigurationPathResolveOptions,
} from "./forgejoConfigurationPathResolve.js"
import type { ForgejoConfiguration } from "./forgejoConfigurationSchema.js"

type ForgejoConfigurationLoadOptions = ForgejoConfigurationPathResolveOptions

async function forgejoConfigurationPermissionsCheck(path: string): Promise<ForgejoResult<null>> {
  const op = "forgejoConfigurationLoad"
  try {
    const file = await stat(path)
    if (process.platform !== "win32" && (file.mode & 0o077) !== 0)
      return createResultError(op, "Forgejo configuration file must be readable only by its owner")
    await chmod(path, 0o600)
    return createResult(null)
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : undefined
    if (code === "ENOSYS" || code === "EOPNOTSUPP" || code === "ENOTSUP") return createResult(null)
    return createResultError(op, "Unable to secure Forgejo configuration file")
  }
}

export async function forgejoConfigurationLoad(
  options: ForgejoConfigurationLoadOptions = {},
): Promise<ForgejoResult<ForgejoConfiguration>> {
  const op = "forgejoConfigurationLoad"
  const path = forgejoConfigurationPathResolve(options)
  let text: string
  try {
    text = await readFile(path, "utf8")
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : undefined
    if (code === "ENOENT") return createResult({ hosts: {} })
    return createResultError(op, "Unable to read Forgejo configuration file")
  }

  const permissions = await forgejoConfigurationPermissionsCheck(path)
  if (!permissions.success) return permissions

  let input: unknown
  try {
    input = JSON.parse(text)
  } catch {
    return createResultError(op, "Forgejo configuration file is not valid JSON")
  }
  const parsed = forgejoConfigurationParse(input)
  if (!parsed.success) return createResultError(op, parsed.errorMessage)
  return parsed
}

export type { ForgejoConfigurationLoadOptions }
