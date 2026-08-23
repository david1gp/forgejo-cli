import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad } from "../configuration/forgejoConfigurationLoad.js"
import { forgejoConfigurationSave } from "../configuration/forgejoConfigurationSave.js"
import type { ForgejoConfiguration } from "../configuration/forgejoConfigurationSchema.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"

type ForgejoCredentialsAliasSetOptions = {
  configurationPath?: string
  env?: Record<string, string | undefined>
  homeDirectory?: string
}

/**
 * Stores an SSH host alias in the same direction as the Rust CLI: alias ->
 * HTTP/API host. Resolution is intentionally left to callers that construct
 * Git remotes; this API only manages the persisted compatibility metadata.
 */
export async function forgejoCredentialsAliasSet(
  aliasInput: unknown,
  hostInput: unknown,
  options: ForgejoCredentialsAliasSetOptions = {},
): Promise<ForgejoResult<ForgejoConfiguration>> {
  const op = "forgejoCredentialsAliasSet"
  const alias = forgejoHostParse(aliasInput)
  if (!alias.success) return createResultError(op, alias.errorMessage)
  const host = forgejoHostParse(hostInput)
  if (!host.success) return createResultError(op, host.errorMessage)

  const pathOptions = {
    path: options.configurationPath,
    env: options.env,
    homeDirectory: options.homeDirectory,
  }
  const loaded = await forgejoConfigurationLoad(pathOptions)
  if (!loaded.success) return createResultError(op, loaded.errorMessage)
  const configuration: ForgejoConfiguration = {
    ...loaded.data,
    aliases: { ...(loaded.data.aliases ?? {}), [alias.data]: host.data },
  }
  const saved = await forgejoConfigurationSave(configuration, pathOptions)
  if (!saved.success) return createResultError(op, saved.errorMessage)
  return createResult(saved.data)
}

export type { ForgejoCredentialsAliasSetOptions }
