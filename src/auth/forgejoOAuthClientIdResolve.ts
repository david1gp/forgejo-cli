import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoConfigurationLoad } from "../configuration/forgejoConfigurationLoad.js"
import type { ForgejoConfiguration } from "../configuration/forgejoConfigurationSchema.js"
import { forgejoBaseUrlParse } from "../hosts/forgejoBaseUrlParse.js"
import { forgejoHostParse } from "../hosts/forgejoHostParse.js"

type ForgejoOAuthClientIdResolveOptions = {
  baseUrl: unknown
  clientId?: unknown
  configuration?: ForgejoConfiguration
  configurationPath?: string
  env?: Record<string, string | undefined>
}

const forgejoOAuthClientIdSchema = a.pipe(a.string(), a.trim(), a.minLength(1))

// These IDs are publicly embedded in the upstream CLI and are intentionally
// limited to known public Forgejo installations. Private installations must
// use --client-id, FORGEJO_OAUTH_CLIENT_ID, or oauth_client_ids in config.json.
const forgejoOAuthKnownClientIds: Readonly<Record<string, string>> = {
  "codeberg.org": "19ac3dd0-e101-445d-aa60-d8ea3876bc5d",
  "code.forgejo.org": "ab67d8a2-72bd-42e8-ae05-937eaba31e24",
  "v11.next.forgejo.org": "0df6d672-fe05-4c9a-a5a9-e111e4905e14",
  "v13.next.forgejo.org": "ef27a227-65f4-4bcb-be56-f8c9b44457b0",
  "v14.next.forgejo.org": "2dc5d6d7-01b0-47b4-814e-b4b60aea2376",
  "v15.next.forgejo.org": "344998d8-4139-4a51-8ef9-a5fa40673ea5",
  "v16.next.forgejo.org": "0b561d01-fd05-4321-9d46-9cb8c776fc80",
  "v17.next.forgejo.org": "e1a0797a-77af-41a5-b086-9efa6062298b",
  "git.disroot.org": "c6051ae0-6d21-4c17-92e6-41b957376d09",
  "git.pub.solar": "6c7fad2f-41c4-4c2d-90b2-5f7fd19c9be2",
  "git.kaki87.net": "951299e6-cf99-4a9e-8aaf-4b4b4ac36f04",
  "git.gay": "15233962-8f9d-4192-a7d7-129fb6c8bbff",
  "git.auxolotl.org": "09fb4377-1e98-4c94-a43f-2c9843388e11",
  "git.lix.systems": "71ec029f-b5a1-4079-8e06-5b957288b063",
  "code.ffmpeg.org": "75d19c4d-01d0-4825-8953-76ad66543f2c",
  "forge.fedoraproject.org": "b15a2f44-75b0-4d2f-a740-50e45cc161a3",
  "codefloe.com": "d8f0480c-cc0a-4cfc-8a16-4b4b4ac36d4",
}

function forgejoOAuthClientIdValue(input: unknown, source: string): ForgejoResult<string> {
  const parsed = a.safeParse(forgejoOAuthClientIdSchema, input)
  if (!parsed.success) return createResultError("forgejoOAuthClientIdResolve", `${source} must be a non-empty string`)
  return createResult(parsed.output)
}

export async function forgejoOAuthClientIdResolve(
  options: ForgejoOAuthClientIdResolveOptions,
): Promise<ForgejoResult<string>> {
  const op = "forgejoOAuthClientIdResolve"
  const baseUrl = forgejoBaseUrlParse(options.baseUrl)
  if (!baseUrl.success) return createResultError(op, baseUrl.errorMessage)
  const host = forgejoHostParse(baseUrl.data)
  if (!host.success) return createResultError(op, host.errorMessage)

  if (options.clientId !== undefined) return forgejoOAuthClientIdValue(options.clientId, "--client-id")

  const env = options.env ?? process.env
  for (const name of ["FORGEJO_OAUTH_CLIENT_ID", "FJ_OAUTH_CLIENT_ID", "FORGEJO_CLIENT_ID", "FJ_CLIENT_ID"]) {
    if (env[name] !== undefined) return forgejoOAuthClientIdValue(env[name], name)
  }

  let configuration = options.configuration
  if (configuration === undefined) {
    const loaded = await forgejoConfigurationLoad({ path: options.configurationPath, env })
    if (!loaded.success) return createResultError(op, loaded.errorMessage)
    configuration = loaded.data
  }
  const configured = configuration.oauth_client_ids?.[host.data]
  if (configured !== undefined) return createResult(configured)

  const known = forgejoOAuthKnownClientIds[host.data]
  if (known !== undefined) return createResult(known)
  return createResultError(
    op,
    `No OAuth client ID is known for ${host.data}; provide --client-id, FORGEJO_OAUTH_CLIENT_ID, or oauth_client_ids in config.json`,
  )
}

export type { ForgejoOAuthClientIdResolveOptions }
