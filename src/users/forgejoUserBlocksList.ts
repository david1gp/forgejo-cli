import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserSchema, type ForgejoUser } from "./forgejoUserSchema.js"

export async function forgejoUserBlocksList(transport: ForgejoRestTransport): Promise<ForgejoResult<ForgejoUser[]>> {
  const op = "forgejoUserBlocksList"
  const response = await transport.request({ path: "/api/v1/user/blocks" })
  if (!response.success) return response
  const parsed = a.safeParse(a.array(forgejoUserSchema), response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
