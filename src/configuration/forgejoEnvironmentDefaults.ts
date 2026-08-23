import { basename } from "node:path"

type ForgejoEnvironmentDefaults = {
  host?: string
  fallbackHost?: string
  sshBase?: string
  user?: string
  organization?: string
  remote?: string
  repository?: string
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

  return {
    ...(host ? { host } : {}),
    ...(fallbackHost ? { fallbackHost } : {}),
    ...(sshBase ? { sshBase } : {}),
    ...(user ? { user } : {}),
    ...(organization ? { organization } : {}),
    ...(remote ? { remote } : {}),
    ...(repository ? { repository } : {}),
  }
}

export type { ForgejoEnvironmentDefaults, ForgejoEnvironmentDefaultsResolveOptions }
