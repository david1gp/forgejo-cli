import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad } from "../configuration/forgejoConfigurationLoad.js"
import { forgejoConfigurationSave } from "../configuration/forgejoConfigurationSave.js"
import type { ForgejoConfiguration } from "../configuration/forgejoConfigurationSchema.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"
import { forgejoApplicationTokenSchema } from "./forgejoApplicationTokenSchema.js"

type ForgejoCredentialsStoreOptions = {
  configurationPath?: string
  env?: Record<string, string | undefined>
  homeDirectory?: string
}

export async function forgejoCredentialsStore(
  hostInput: unknown,
  tokenInput: unknown,
  options: ForgejoCredentialsStoreOptions = {},
): Promise<ForgejoResult<ForgejoConfiguration>> {
  const op = "forgejoCredentialsStore"
  const host = forgejoHostParse(hostInput)
  if (!host.success) return createResultError(op, host.errorMessage)
  const token = a.safeParse(forgejoApplicationTokenSchema, tokenInput)
  if (!token.success) return createResultError(op, "Forgejo application token must be a non-empty string")

  const pathOptions = {
    path: options.configurationPath,
    env: options.env,
    homeDirectory: options.homeDirectory,
  }
  const loaded = await forgejoConfigurationLoad(pathOptions)
  if (!loaded.success) return createResultError(op, loaded.errorMessage)
  const configuration: ForgejoConfiguration = {
    ...loaded.data,
    hosts: { ...loaded.data.hosts, [host.data]: token.output },
  }
  const saved = await forgejoConfigurationSave(configuration, pathOptions)
  if (!saved.success) return createResultError(op, saved.errorMessage)
  return createResult(saved.data)
}

export type { ForgejoCredentialsStoreOptions }
