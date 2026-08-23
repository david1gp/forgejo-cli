import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad } from "../configuration/forgejoConfigurationLoad.js"
import { forgejoConfigurationSave } from "../configuration/forgejoConfigurationSave.js"
import type { ForgejoConfiguration } from "../configuration/forgejoConfigurationSchema.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"
import { forgejoOAuthTokenSchema, type ForgejoOAuthToken } from "../auth/forgejoOAuthTokenSchema.js"

type ForgejoCredentialsOAuthStoreOptions = {
  configurationPath?: string
  env?: Record<string, string | undefined>
  homeDirectory?: string
}

function forgejoCredentialsOAuthExpiresAt(token: ForgejoOAuthToken): string | undefined {
  if (typeof token.expires_in !== "number" || !Number.isFinite(token.expires_in)) return undefined
  const expiresIn = Math.max(0, token.expires_in - 60) * 1000
  return new Date(Date.now() + expiresIn).toISOString()
}

export async function forgejoCredentialsOAuthStore(
  hostInput: unknown,
  tokenInput: unknown,
  options: ForgejoCredentialsOAuthStoreOptions = {},
): Promise<ForgejoResult<ForgejoConfiguration>> {
  const op = "forgejoCredentialsOAuthStore"
  const host = forgejoHostParse(hostInput)
  if (!host.success) return createResultError(op, host.errorMessage)
  const token = a.safeParse(forgejoOAuthTokenSchema, tokenInput)
  if (!token.success) return createResultError(op, "Forgejo OAuth response did not contain a valid access token")

  const credential = {
    type: "OAuth" as const,
    token: token.output.access_token,
    ...(token.output.refresh_token === undefined ? {} : { refresh_token: token.output.refresh_token }),
    ...(forgejoCredentialsOAuthExpiresAt(token.output) === undefined
      ? {}
      : { expires_at: forgejoCredentialsOAuthExpiresAt(token.output) }),
  }
  const pathOptions = {
    path: options.configurationPath,
    env: options.env,
    homeDirectory: options.homeDirectory,
  }
  const loaded = await forgejoConfigurationLoad(pathOptions)
  if (!loaded.success) return createResultError(op, loaded.errorMessage)
  const configuration: ForgejoConfiguration = {
    ...loaded.data,
    hosts: { ...loaded.data.hosts, [host.data]: credential },
  }
  const saved = await forgejoConfigurationSave(configuration, pathOptions)
  if (!saved.success) return createResultError(op, saved.errorMessage)
  return createResult(saved.data)
}

export type { ForgejoCredentialsOAuthStoreOptions }
