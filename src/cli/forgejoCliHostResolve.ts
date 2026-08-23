import { createResult, createResultError } from "#result"
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

  const context = await forgejoRepositoryContextResolve({
    remote: options.remote,
    cwd: options.cwd,
    env: options.env,
  })
  if (!context.success) return createResultError(op, context.errorMessage)
  return createResult({ baseUrl: context.data.baseUrl, host: context.data.host })
}
