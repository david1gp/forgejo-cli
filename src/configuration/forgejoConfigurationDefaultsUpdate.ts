import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad } from "./forgejoConfigurationLoad.js"
import { forgejoConfigurationSave, type ForgejoConfigurationSaveOptions } from "./forgejoConfigurationSave.js"
import type { ForgejoConfiguration } from "./forgejoConfigurationSchema.js"

const forgejoConfigurationDefaultKeys = ["default_host", "ssh_base", "default_org", "default_remote"] as const
const forgejoConfigurationDefaultKeySchema = a.picklist(forgejoConfigurationDefaultKeys)

type ForgejoConfigurationDefaultKey = (typeof forgejoConfigurationDefaultKeys)[number]
type ForgejoConfigurationDefaultsUpdateOptions = ForgejoConfigurationSaveOptions

export async function forgejoConfigurationDefaultsUpdate(
  keyInput: unknown,
  value: unknown | undefined,
  options: ForgejoConfigurationDefaultsUpdateOptions = {},
): Promise<ForgejoResult<ForgejoConfiguration>> {
  const op = "forgejoConfigurationDefaultsUpdate"
  const key = a.safeParse(forgejoConfigurationDefaultKeySchema, keyInput)
  if (!key.success) return createResultError(op, "Unsupported Forgejo configuration default")

  const configuration = await forgejoConfigurationLoad(options)
  if (!configuration.success) return configuration
  const updated: Record<string, unknown> = { ...configuration.data }
  if (value === undefined) delete updated[key.output]
  else updated[key.output] = value

  const saved = await forgejoConfigurationSave(updated, options)
  if (!saved.success) return saved
  return createResult(saved.data)
}

export type { ForgejoConfigurationDefaultKey }
export type { ForgejoConfigurationDefaultsUpdateOptions }
