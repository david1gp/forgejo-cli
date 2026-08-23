import { chmod, mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationParse } from "./forgejoConfigurationParse.js"
import {
  forgejoConfigurationPathResolve,
  type ForgejoConfigurationPathResolveOptions,
} from "./forgejoConfigurationPathResolve.js"
import { type ForgejoConfiguration, forgejoConfigurationSchema } from "./forgejoConfigurationSchema.js"
import * as a from "valibot"

type ForgejoConfigurationSaveOptions = ForgejoConfigurationPathResolveOptions

async function forgejoConfigurationChmod(path: string, mode: number): Promise<ForgejoResult<null>> {
  const op = "forgejoConfigurationSave"
  try {
    await chmod(path, mode)
    return createResult(null)
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : undefined
    if (code === "ENOSYS" || code === "EOPNOTSUPP" || code === "ENOTSUP") return createResult(null)
    return createResultError(op, "Unable to secure Forgejo configuration file")
  }
}

export async function forgejoConfigurationSave(
  configuration: unknown,
  options: ForgejoConfigurationSaveOptions = {},
): Promise<ForgejoResult<ForgejoConfiguration>> {
  const op = "forgejoConfigurationSave"
  const parsed = a.safeParse(forgejoConfigurationSchema, configuration)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))

  const path = forgejoConfigurationPathResolve(options)
  try {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 })
    const directoryPermissions = await forgejoConfigurationChmod(dirname(path), 0o700)
    if (!directoryPermissions.success) return directoryPermissions
    await writeFile(path, `${JSON.stringify(parsed.output, null, 2)}\n`, { encoding: "utf8", mode: 0o600 })
  } catch {
    return createResultError(op, "Unable to write Forgejo configuration file")
  }

  const filePermissions = await forgejoConfigurationChmod(path, 0o600)
  if (!filePermissions.success) return filePermissions
  const checked = forgejoConfigurationParse(parsed.output)
  if (!checked.success) return checked
  return createResult(checked.data)
}

export type { ForgejoConfigurationSaveOptions }
