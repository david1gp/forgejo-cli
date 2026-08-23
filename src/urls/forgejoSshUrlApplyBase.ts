function forgejoSshUrlPath(value: string): string | undefined {
  const scpLike = /^(?<user>[^/@:]+)@(?<host>[^/:]+):(?<path>.+)$/.exec(value)
  if (scpLike?.groups?.path) return `/${scpLike.groups.path.replace(/^\/+/, "")}`

  try {
    const url = new URL(value)
    if (url.protocol !== "ssh:" && url.protocol !== "git+ssh:") return undefined
    return url.pathname
  } catch {
    return undefined
  }
}

function forgejoSshUrlBaseApply(base: string, path: string): string | undefined {
  try {
    const url = new URL(base)
    if (url.protocol !== "ssh:") return undefined
    const basePath = url.pathname.replace(/\/+$/, "")
    url.pathname = `${basePath}/${path.replace(/^\/+/, "")}`
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    return undefined
  }
}

export function forgejoSshUrlApplyBase(value: string, base?: string): string {
  const normalizedBase = base?.trim()
  if (!normalizedBase) return value
  const path = forgejoSshUrlPath(value)
  if (!path) return value
  return forgejoSshUrlBaseApply(normalizedBase, path) ?? value
}
