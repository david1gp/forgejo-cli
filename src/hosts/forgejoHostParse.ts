import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoBaseUrlParse } from "./forgejoBaseUrlParse.js"
import { type ForgejoHost, forgejoHostSchema } from "./forgejoHostSchema.js"

export function forgejoHostParse(input: unknown): ForgejoResult<ForgejoHost> {
  const op = "forgejoHostParse"
  const baseUrl = forgejoBaseUrlParse(input)
  if (!baseUrl.success) return createResultError(op, baseUrl.errorMessage, baseUrl.errorData)

  const host = new URL(baseUrl.data).host
  const parsed = a.safeParse(forgejoHostSchema, host)
  if (!parsed.success) return createResultError(op, "Invalid Forgejo host", host)
  return createResult(parsed.output)
}
