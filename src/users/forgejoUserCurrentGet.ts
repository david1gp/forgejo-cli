import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserSchema, type ForgejoUser } from "./forgejoUserSchema.js"

export async function forgejoUserCurrentGet(transport: ForgejoRestTransport): Promise<ForgejoResult<ForgejoUser>> {
  const op = "forgejoUserCurrentGet"
  const response = await transport.request({ path: "/api/v1/user" })
  if (!response.success) return response
  const parsed = a.safeParse(forgejoUserSchema, response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return { success: true, data: parsed.output }
}
