import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { type ForgejoBaseUrl, forgejoBaseUrlSchema } from "./forgejoBaseUrlSchema.js"

export function forgejoBaseUrlParse(input: unknown): ForgejoResult<ForgejoBaseUrl> {
  const op = "forgejoBaseUrlParse"
  if (typeof input !== "string") return createResultError(op, "Forgejo base URL must be a string")

  const value = input.trim()
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`
  const parsed = a.safeParse(forgejoBaseUrlSchema, candidate)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))

  const url = new URL(parsed.output)
  if (!url.pathname.endsWith("/")) url.pathname = `${url.pathname}/`
  return createResult(url.toString())
}
