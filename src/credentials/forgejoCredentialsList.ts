import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad } from "../configuration/forgejoConfigurationLoad.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"
import type { ForgejoHost } from "../hosts/forgejoHostSchema.js"

type ForgejoCredentialsListOptions = {
  configurationPath?: string
  env?: Record<string, string | undefined>
  homeDirectory?: string
}

export async function forgejoCredentialsList(
  options: ForgejoCredentialsListOptions = {},
): Promise<ForgejoResult<ForgejoHost[]>> {
  const op = "forgejoCredentialsList"
  const loaded = await forgejoConfigurationLoad({
    path: options.configurationPath,
    env: options.env,
    homeDirectory: options.homeDirectory,
  })
  if (!loaded.success) return createResultError(op, loaded.errorMessage)

  const hosts: ForgejoHost[] = []
  for (const value of Object.keys(loaded.data.hosts).sort()) {
    const host = forgejoHostParse(value)
    if (!host.success) return createResultError(op, host.errorMessage)
    hosts.push(host.data)
  }
  return createResult(hosts)
}

export type { ForgejoCredentialsListOptions }
