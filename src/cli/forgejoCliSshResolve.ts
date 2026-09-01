type ForgejoCliSshResolveOptions = {
  ssh?: boolean
  host: string
  defaultSsh?: readonly string[]
}

export function forgejoCliSshResolve(options: ForgejoCliSshResolveOptions): boolean {
  if (options.ssh !== undefined) return options.ssh
  return options.defaultSsh?.includes(options.host) ?? false
}

export type { ForgejoCliSshResolveOptions }
