import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad } from "../configuration/forgejoConfigurationLoad.js"
import { forgejoConfigurationSave } from "../configuration/forgejoConfigurationSave.js"
import type { ForgejoConfiguration } from "../configuration/forgejoConfigurationSchema.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"

type ForgejoCredentialsDefaultSshSetOptions = {
  configurationPath?: string
  env?: Record<string, string | undefined>
  homeDirectory?: string
}

export async function forgejoCredentialsDefaultSshSet(
  hostInput: unknown,
  useSshInput: unknown = true,
  options: ForgejoCredentialsDefaultSshSetOptions = {},
): Promise<ForgejoResult<ForgejoConfiguration>> {
  const op = "forgejoCredentialsDefaultSshSet"
  const host = forgejoHostParse(hostInput)
  if (!host.success) return createResultError(op, host.errorMessage)
  const useSsh = a.safeParse(a.boolean(), useSshInput)
  if (!useSsh.success) return createResultError(op, "SSH preference must be a boolean")

  const pathOptions = {
    path: options.configurationPath,
    env: options.env,
    homeDirectory: options.homeDirectory,
  }
  const loaded = await forgejoConfigurationLoad(pathOptions)
  if (!loaded.success) return createResultError(op, loaded.errorMessage)
  if (!(host.data in loaded.data.hosts))
    return createResultError(op, `No Forgejo application token configured for ${host.data}`)

  const defaultSsh = new Set(loaded.data.default_ssh ?? [])
  if (useSsh.output) defaultSsh.add(host.data)
  else defaultSsh.delete(host.data)
  const configuration: ForgejoConfiguration = {
    ...loaded.data,
    default_ssh: [...defaultSsh].sort(),
  }
  const saved = await forgejoConfigurationSave(configuration, pathOptions)
  if (!saved.success) return createResultError(op, saved.errorMessage)
  return createResult(saved.data)
}

export type { ForgejoCredentialsDefaultSshSetOptions }
