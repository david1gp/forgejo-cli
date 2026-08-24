import { createResult } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import {
  forgejoConfigurationDefaultsLoad,
  type ForgejoConfigurationDefaultsLoadOptions,
} from "./forgejoConfigurationDefaultsLoad.js"
import { forgejoEnvironmentDefaultsResolve, type ForgejoEnvironmentDefaults } from "./forgejoEnvironmentDefaults.js"

type ForgejoDefaults = ForgejoEnvironmentDefaults & {
  defaultHost?: string
}

type ForgejoDefaultsResolveOptions = ForgejoConfigurationDefaultsLoadOptions & {
  cwd?: string
}

export async function forgejoDefaultsResolve(
  options: ForgejoDefaultsResolveOptions = {},
): Promise<ForgejoResult<ForgejoDefaults>> {
  const environmentDefaults = forgejoEnvironmentDefaultsResolve({ env: options.env, cwd: options.cwd })
  const configurationDefaults = await forgejoConfigurationDefaultsLoad(options)
  if (!configurationDefaults.success) return configurationDefaults

  const persisted = configurationDefaults.data
  const defaults: ForgejoDefaults = {
    ...environmentDefaults,
    ...(persisted.default_host !== undefined ? { defaultHost: persisted.default_host } : {}),
    ...(environmentDefaults.sshBase === undefined && persisted.ssh_base !== undefined
      ? { sshBase: persisted.ssh_base }
      : {}),
    ...(environmentDefaults.organization === undefined && persisted.default_org !== undefined
      ? { organization: persisted.default_org }
      : {}),
    ...(environmentDefaults.remote === undefined && persisted.default_remote !== undefined
      ? { remote: persisted.default_remote }
      : {}),
  }
  return createResult(defaults)
}

export type { ForgejoDefaults, ForgejoDefaultsResolveOptions }
