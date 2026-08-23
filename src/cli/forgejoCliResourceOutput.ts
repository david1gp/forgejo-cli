import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"

type ForgejoCliResourceOutputOptions = {
  json?: true
  style: "fancy" | "minimal"
  verbose?: boolean
  outputWrite?: (output: string) => ForgejoResult<null>
}

function forgejoCliResourceOutputWrite(
  output: string,
  outputWrite?: ForgejoCliResourceOutputOptions["outputWrite"],
): ForgejoResult<null> {
  if (outputWrite) return outputWrite(output)
  try {
    process.stdout.write(output)
    return createResult(null)
  } catch {
    return createResultError("forgejoCliResourceOutput", "Unable to write command output")
  }
}

function forgejoCliResourceName(value: unknown): string {
  if (typeof value !== "object" || value === null) return String(value)
  const record = value as Record<string, unknown>
  for (const key of ["full_name", "login", "username", "name", "title", "key_id", "id"]) {
    const item = record[key]
    if (typeof item === "string" || typeof item === "number") return String(item)
  }
  return JSON.stringify(value)
}

function forgejoCliResourceHuman(
  value: unknown,
  style: ForgejoCliResourceOutputOptions["style"],
  verbose = false,
): string {
  const prefix = style === "fancy" ? "● " : ""
  if (value === null || value === undefined) return `${style === "fancy" ? "✓ " : ""}Done\n`
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return `${String(value)}\n`
  if (Array.isArray(value)) {
    if (verbose) return `${JSON.stringify(value, null, 2)}\n`
    return value.map(forgejoCliResourceName).join("\n") + (value.length > 0 ? "\n" : "")
  }
  const record = value as Record<string, unknown>
  if (verbose) return `${JSON.stringify(record, null, 2)}\n`
  const lines = [`${prefix}${forgejoCliResourceName(value)}`]
  for (const key of ["description", "visibility", "website", "email", "location", "permission"]) {
    const item = record[key]
    if (typeof item === "string" && item.length > 0) lines.push(item)
  }
  return `${lines.join("\n")}\n`
}

async function forgejoCliResourceOutput(
  value: unknown,
  options: ForgejoCliResourceOutputOptions,
): Promise<ForgejoResult<null>> {
  if (options.json) {
    try {
      return forgejoCliResourceOutputWrite(`${JSON.stringify(value)}\n`, options.outputWrite)
    } catch {
      return createResultError("forgejoCliResourceOutput", "Unable to serialize command output")
    }
  }
  return forgejoCliResourceOutputWrite(
    forgejoCliResourceHuman(value, options.style, options.verbose),
    options.outputWrite,
  )
}

export { forgejoCliResourceOutput }
