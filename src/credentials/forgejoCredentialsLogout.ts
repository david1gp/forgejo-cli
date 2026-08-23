import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad } from "../configuration/forgejoConfigurationLoad.js"
import { forgejoConfigurationSave } from "../configuration/forgejoConfigurationSave.js"
import type { ForgejoConfiguration } from "../configuration/forgejoConfigurationSchema.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"

type ForgejoCredentialsLogoutOptions = {
  configurationPath?: string
  env?: Record<string, string | undefined>
  homeDirectory?: string
}

export async function forgejoCredentialsLogout(
  hostInput: unknown,
  options: ForgejoCredentialsLogoutOptions = {},
): Promise<ForgejoResult<ForgejoConfiguration>> {
  const op = "forgejoCredentialsLogout"
  const host = forgejoHostParse(hostInput)
  if (!host.success) return createResultError(op, host.errorMessage)

  const pathOptions = {
    path: options.configurationPath,
    env: options.env,
    homeDirectory: options.homeDirectory,
  }
  const loaded = await forgejoConfigurationLoad(pathOptions)
  if (!loaded.success) return createResultError(op, loaded.errorMessage)
  if (!(host.data in loaded.data.hosts)) return createResult(loaded.data)

  const hosts = { ...loaded.data.hosts }
  delete hosts[host.data]
  const configuration: ForgejoConfiguration = { ...loaded.data, hosts }
  const saved = await forgejoConfigurationSave(configuration, pathOptions)
  if (!saved.success) return createResultError(op, saved.errorMessage)
  return createResult(saved.data)
}

export type { ForgejoCredentialsLogoutOptions }
