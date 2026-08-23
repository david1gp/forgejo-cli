import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"
import { forgejoApplicationTokenSchema, type ForgejoApplicationToken } from "./forgejoApplicationTokenSchema.js"
import { forgejoConfigurationLoad } from "../configuration/forgejoConfigurationLoad.js"
import type { ForgejoConfiguration } from "../configuration/forgejoConfigurationSchema.js"

type ForgejoCredentialsResolveOptions = {
  token?: unknown
  configuration?: ForgejoConfiguration
  configurationPath?: string
  env?: Record<string, string | undefined>
}

function forgejoCredentialEnvironmentNames(host: string): string[] {
  const suffix = host.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()
  return [`FORGEJO_TOKEN_${suffix}`, "FORGEJO_TOKEN"]
}

export async function forgejoCredentialsResolve(
  hostInput: unknown,
  options: ForgejoCredentialsResolveOptions = {},
): Promise<ForgejoResult<ForgejoApplicationToken>> {
  const op = "forgejoCredentialsResolve"
  const host = forgejoHostParse(hostInput)
  if (!host.success) return createResultError(op, host.errorMessage)

  if (options.token !== undefined) {
    const parsed = a.safeParse(forgejoApplicationTokenSchema, options.token)
    if (!parsed.success) return createResultError(op, "Forgejo application token must be a non-empty string")
    return createResult(parsed.output)
  }

  const env = options.env ?? process.env
  for (const name of forgejoCredentialEnvironmentNames(host.data)) {
    const token = env[name]
    if (token === undefined) continue
    const parsed = a.safeParse(forgejoApplicationTokenSchema, token)
    if (!parsed.success) return createResultError(op, `${name} must contain a non-empty Forgejo application token`)
    return createResult(parsed.output)
  }

  let configuration = options.configuration
  if (configuration === undefined) {
    const loaded = await forgejoConfigurationLoad({ path: options.configurationPath, env })
    if (!loaded.success) return createResultError(op, loaded.errorMessage)
    configuration = loaded.data
  }
  const token = configuration.hosts[host.data]
  if (token === undefined) return createResultError(op, `No Forgejo application token configured for ${host.data}`)
  if (typeof token === "object") return createResult(token.token)
  const parsed = a.safeParse(forgejoApplicationTokenSchema, token)
  if (!parsed.success) return createResultError(op, "Configured Forgejo application token is invalid")
  return createResult(parsed.output)
}

export type { ForgejoCredentialsResolveOptions }
