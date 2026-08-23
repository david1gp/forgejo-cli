import { createResult, createResultError } from "#result"
import { forgejoClientCreate } from "../client/forgejoClientCreate.js"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoCliHostResolve } from "./forgejoCliHostResolve.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"

type ForgejoCliHostClientOptions = ForgejoCliRunOptions & {
  env: Record<string, string | undefined>
  host?: string
  remote?: string
  cwd?: string
}

async function forgejoCliHostClient(options: ForgejoCliHostClientOptions) {
  const resolved = await forgejoCliHostResolve({
    host: options.host,
    remote: options.remote,
    cwd: options.cwd,
    env: options.env,
  })
  if (!resolved.success) return createResultError("forgejoCliRun", resolved.errorMessage)
  const client = await forgejoClientCreate({ baseUrl: resolved.data.baseUrl, env: options.env, fetch: options.fetch })
  if (!client.success) return createResultError("forgejoCliRun", client.errorMessage)
  return createResult({ host: resolved.data, client: client.data })
}

export { forgejoCliHostClient }
