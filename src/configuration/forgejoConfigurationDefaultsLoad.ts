import { createResult } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad, type ForgejoConfigurationLoadOptions } from "./forgejoConfigurationLoad.js"
import type { ForgejoConfigurationDefaults } from "./forgejoConfigurationDefaults.js"

type ForgejoConfigurationDefaultsLoadOptions = ForgejoConfigurationLoadOptions

export async function forgejoConfigurationDefaultsLoad(
  options: ForgejoConfigurationDefaultsLoadOptions = {},
): Promise<ForgejoResult<ForgejoConfigurationDefaults>> {
  const loaded = await forgejoConfigurationLoad(options)
  if (!loaded.success) return loaded

  const defaults: ForgejoConfigurationDefaults = {}
  if (loaded.data.default_host !== undefined) defaults.default_host = loaded.data.default_host
  if (loaded.data.ssh_base !== undefined) defaults.ssh_base = loaded.data.ssh_base
  if (loaded.data.default_org !== undefined) defaults.default_org = loaded.data.default_org
  if (loaded.data.default_remote !== undefined) defaults.default_remote = loaded.data.default_remote
  if (loaded.data.directory_assignments !== undefined)
    defaults.directory_assignments = loaded.data.directory_assignments
  return createResult(defaults)
}

export type { ForgejoConfigurationDefaultsLoadOptions }
