const forgejoEnvironmentFileKeys = new Set([
  "FJ_HOST",
  "FORGEJO_BASE_URL",
  "FORGEJO_URL",
  "FORGEJO_HOST",
  "FJ_FALLBACK_HOST",
  "FJ_SSH_BASE",
  "FJ_USER",
  "FJ_ORG",
  "FJ_REMOTE",
  "FJ_NO_ORG",
])

function forgejoEnvironmentFileValueParse(input: string): string | undefined {
  const value = input.trim()
  const quote = value[0]
  if (quote !== '"' && quote !== "'") return value.replace(/\s+#.*$/, "").trim()

  let parsed = ""
  for (let index = 1; index < value.length; index += 1) {
    const character = value[index]
    if (character === "\\") {
      const escaped = value[index + 1]
      if (escaped === undefined) return undefined
      if (escaped === quote || escaped === "\\") {
        parsed += escaped
        index += 1
        continue
      }
      parsed += character
      continue
    }
    if (character !== quote) {
      parsed += character
      continue
    }

    const trailing = value.slice(index + 1)
    if (trailing.length === 0 || /^\s+$/.test(trailing) || /^\s+#/.test(trailing)) return parsed
    return undefined
  }
  return undefined
}

export function forgejoEnvironmentFileParse(text: string): Record<string, string> {
  const values: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const input = line.trim()
    if (input.length === 0 || input.startsWith("#")) continue
    const assignment = input.startsWith("export ") ? input.slice("export ".length).trim() : input
    const separator = assignment.indexOf("=")
    if (separator <= 0) continue
    const key = assignment.slice(0, separator).trim()
    if (!forgejoEnvironmentFileKeys.has(key)) continue
    const value = forgejoEnvironmentFileValueParse(assignment.slice(separator + 1))
    if (value !== undefined) values[key] = value
  }
  return values
}
