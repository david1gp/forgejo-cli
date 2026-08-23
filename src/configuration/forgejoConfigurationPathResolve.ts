type ForgejoConfigurationPathResolveOptions = {
  path?: string
  env?: Record<string, string | undefined>
  homeDirectory?: string
}

export function forgejoConfigurationPathResolve(options: ForgejoConfigurationPathResolveOptions = {}): string {
  if (options.path) return options.path
  const env = options.env ?? process.env
  if (env.FORGEJO_CONFIG_FILE) return env.FORGEJO_CONFIG_FILE
  if (env.FORGEJO_CONFIG) return env.FORGEJO_CONFIG
  const configHome = env.XDG_CONFIG_HOME ?? `${options.homeDirectory ?? env.HOME ?? process.cwd()}/.config`
  return `${configHome}/forgejo-cli/config.json`
}

export type { ForgejoConfigurationPathResolveOptions }
