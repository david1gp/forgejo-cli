import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoVersionSchema, type ForgejoVersion } from "./forgejoVersionSchema.js"

export async function forgejoVersionGet(transport: ForgejoRestTransport): Promise<ForgejoResult<ForgejoVersion>> {
  const op = "forgejoVersionGet"
  const response = await transport.request({ path: "/api/v1/version" })
  if (!response.success) return response
  const parsed = a.safeParse(forgejoVersionSchema, response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return { success: true, data: parsed.output }
}
