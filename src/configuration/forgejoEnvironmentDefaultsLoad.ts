import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoEnvironmentFileResolve } from "./forgejoEnvironmentFileResolve.js"
import {
  forgejoEnvironmentDefaultsResolve,
  type ForgejoEnvironmentDefaults,
  type ForgejoEnvironmentDefaultsResolveOptions,
} from "./forgejoEnvironmentDefaults.js"

type ForgejoEnvironmentDefaultsLoadOptions = ForgejoEnvironmentDefaultsResolveOptions

function forgejoEnvironmentDefaultsOverride(
  base: ForgejoEnvironmentDefaults,
  override: ForgejoEnvironmentDefaults,
): ForgejoEnvironmentDefaults {
  return {
    ...base,
    ...(override.host !== undefined ? { host: override.host } : {}),
    ...(override.fallbackHost !== undefined ? { fallbackHost: override.fallbackHost } : {}),
    ...(override.sshBase !== undefined ? { sshBase: override.sshBase } : {}),
    ...(override.user !== undefined ? { user: override.user } : {}),
    ...(override.organization !== undefined ? { organization: override.organization } : {}),
    ...(override.remote !== undefined ? { remote: override.remote } : {}),
    ...(override.repository !== undefined ? { repository: override.repository } : {}),
    ...(override.noOrg !== undefined ? { noOrg: override.noOrg } : {}),
  }
}

export async function forgejoEnvironmentDefaultsLoad(
  options: ForgejoEnvironmentDefaultsLoadOptions = {},
): Promise<ForgejoResult<ForgejoEnvironmentDefaults>> {
  const cwd = options.cwd ?? process.cwd()
  const environmentFile = await forgejoEnvironmentFileResolve({ cwd })
  if (!environmentFile.success) return createResultError("forgejoEnvironmentDefaultsLoad", environmentFile.errorMessage)
  return createResult(
    forgejoEnvironmentDefaultsOverride(
      forgejoEnvironmentDefaultsResolve({ env: environmentFile.data, cwd }),
      forgejoEnvironmentDefaultsResolve({ env: options.env, cwd }),
    ),
  )
}

export type { ForgejoEnvironmentDefaultsLoadOptions }
