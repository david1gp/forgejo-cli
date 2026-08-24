import { createResult, createResultError } from "#result"
import { forgejoDefaultsResolve } from "../configuration/forgejoDefaultsResolve.js"
import { forgejoBaseUrlParse } from "../hosts/forgejoBaseUrlParse.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"
import { forgejoRepositoryContextResolve } from "../repositories/forgejoRepositoryContextResolve.js"

type ForgejoCliHostResolveOptions = {
  host?: string
  remote?: string
  cwd?: string
  env?: Record<string, string | undefined>
}

export async function forgejoCliHostResolve(options: ForgejoCliHostResolveOptions = {}) {
  const op = "forgejoCliHostResolve"
  if (options.host !== undefined) {
    const baseUrl = forgejoBaseUrlParse(options.host)
    if (!baseUrl.success) return createResultError(op, baseUrl.errorMessage)
    const host = forgejoHostParse(baseUrl.data)
    if (!host.success) return createResultError(op, host.errorMessage)
    return createResult({ baseUrl: baseUrl.data, host: host.data })
  }

  const defaults = await forgejoDefaultsResolve({ env: options.env, cwd: options.cwd })
  if (!defaults.success) return createResultError(op, defaults.errorMessage)
  if (options.remote === undefined && defaults.data.host !== undefined) {
    const baseUrl = forgejoBaseUrlParse(defaults.data.host)
    if (!baseUrl.success) return createResultError(op, baseUrl.errorMessage)
    const host = forgejoHostParse(baseUrl.data)
    if (!host.success) return createResultError(op, host.errorMessage)
    return createResult({ baseUrl: baseUrl.data, host: host.data })
  }

  const context = await forgejoRepositoryContextResolve({
    remote: options.remote,
    cwd: options.cwd,
    env: options.env,
  })
  if (!context.success) {
    if (options.remote !== undefined) return createResultError(op, context.errorMessage)
    const fallback = defaults.data.fallbackHost ?? defaults.data.defaultHost
    if (fallback === undefined) return createResultError(op, context.errorMessage)
    const baseUrl = forgejoBaseUrlParse(fallback)
    if (!baseUrl.success) return createResultError(op, baseUrl.errorMessage)
    const host = forgejoHostParse(baseUrl.data)
    if (!host.success) return createResultError(op, host.errorMessage)
    return createResult({ baseUrl: baseUrl.data, host: host.data })
  }
  return createResult({ baseUrl: context.data.baseUrl, host: context.data.host })
}
