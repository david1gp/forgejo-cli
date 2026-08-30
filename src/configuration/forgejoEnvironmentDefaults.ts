import { basename } from "node:path"

type ForgejoEnvironmentDefaults = {
  host?: string
  fallbackHost?: string
  sshBase?: string
  user?: string
  organization?: string
  remote?: string
  repository?: string
  noOrg?: boolean
}

type ForgejoEnvironmentDefaultsResolveOptions = {
  env?: Record<string, string | undefined>
  cwd?: string
}

function forgejoEnvironmentDefaultValue(
  env: Record<string, string | undefined>,
  names: readonly string[],
): string | undefined {
  for (const name of names) {
    const value = env[name]?.trim()
    if (value) return value
  }
  return undefined
}

function forgejoEnvironmentDefaultBooleanValue(
  env: Record<string, string | undefined>,
  name: string,
): boolean | undefined {
  const value = env[name]?.trim().toLowerCase()
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

export function forgejoEnvironmentDefaultsResolve(
  options: ForgejoEnvironmentDefaultsResolveOptions = {},
): ForgejoEnvironmentDefaults {
  const env = options.env ?? process.env
  const cwd = options.cwd ?? process.cwd()
  const host = forgejoEnvironmentDefaultValue(env, ["FJ_HOST", "FORGEJO_BASE_URL", "FORGEJO_URL", "FORGEJO_HOST"])
  const fallbackHost = forgejoEnvironmentDefaultValue(env, ["FJ_FALLBACK_HOST"])
  const sshBase = forgejoEnvironmentDefaultValue(env, ["FJ_SSH_BASE"])
  const user = forgejoEnvironmentDefaultValue(env, ["FJ_USER"])
  const organization = forgejoEnvironmentDefaultValue(env, ["FJ_ORG"])
  const remote = forgejoEnvironmentDefaultValue(env, ["FJ_REMOTE"])
  const repository = basename(cwd)
  const noOrg = forgejoEnvironmentDefaultBooleanValue(env, "FJ_NO_ORG")

  return {
    ...(host ? { host } : {}),
    ...(fallbackHost ? { fallbackHost } : {}),
    ...(sshBase ? { sshBase } : {}),
    ...(user ? { user } : {}),
    ...(organization ? { organization } : {}),
    ...(remote ? { remote } : {}),
    ...(repository ? { repository } : {}),
    ...(noOrg !== undefined ? { noOrg } : {}),
  }
}

export type { ForgejoEnvironmentDefaults, ForgejoEnvironmentDefaultsResolveOptions }
