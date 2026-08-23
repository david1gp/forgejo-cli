import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad } from "../configuration/forgejoConfigurationLoad.js"
import type { ForgejoConfiguration } from "../configuration/forgejoConfigurationSchema.js"
import { forgejoCredentialsResolve } from "../credentials/forgejoCredentialsResolve.js"
import { forgejoBaseUrlParse } from "../hosts/forgejoBaseUrlParse.js"
import type { ForgejoBaseUrl } from "../hosts/forgejoBaseUrlSchema.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"
import type { ForgejoHost } from "../hosts/forgejoHostSchema.js"
import {
  forgejoRestTransportCreate,
  type ForgejoFetch,
  type ForgejoRestTransport,
} from "../http/forgejoRestTransportCreate.js"

type ForgejoClient = {
  baseUrl: ForgejoBaseUrl
  host: ForgejoHost
  transport: ForgejoRestTransport
}

type ForgejoClientCreateOptions = {
  baseUrl?: unknown
  host?: unknown
  token?: unknown
  configuration?: ForgejoConfiguration
  configurationPath?: string
  env?: Record<string, string | undefined>
  fetch?: ForgejoFetch
}

function forgejoClientBaseUrlInput(
  options: ForgejoClientCreateOptions,
  env: Record<string, string | undefined>,
): unknown {
  if (options.baseUrl !== undefined) return options.baseUrl
  if (options.host !== undefined) return options.host
  return env.FORGEJO_BASE_URL ?? env.FORGEJO_URL ?? env.FORGEJO_HOST ?? env.FJ_HOST ?? env.FJ_FALLBACK_HOST
}

export async function forgejoClientCreate(
  options: ForgejoClientCreateOptions = {},
): Promise<ForgejoResult<ForgejoClient>> {
  const op = "forgejoClientCreate"
  const env = options.env ?? process.env
  const baseUrl = forgejoBaseUrlParse(forgejoClientBaseUrlInput(options, env))
  if (!baseUrl.success) return createResultError(op, baseUrl.errorMessage)
  const host = forgejoHostParse(baseUrl.data)
  if (!host.success) return createResultError(op, host.errorMessage)

  let configuration = options.configuration
  if (configuration === undefined && options.token === undefined) {
    const loaded = await forgejoConfigurationLoad({
      path: options.configurationPath,
      env,
    })
    if (!loaded.success) return createResultError(op, loaded.errorMessage)
    configuration = loaded.data
  }

  const credentials = await forgejoCredentialsResolve(host.data, {
    token: options.token,
    configuration,
    configurationPath: options.configurationPath,
    env,
  })
  if (!credentials.success) return createResultError(op, credentials.errorMessage)

  const transport = forgejoRestTransportCreate({
    baseUrl: baseUrl.data,
    token: credentials.data,
    fetch: options.fetch,
  })
  if (!transport.success) return createResultError(op, transport.errorMessage)
  return createResult({ baseUrl: baseUrl.data, host: host.data, transport: transport.data })
}

export type { ForgejoClient, ForgejoClientCreateOptions }
