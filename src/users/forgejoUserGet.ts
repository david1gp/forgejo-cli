import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "./forgejoUserReferenceParse.js"
import { forgejoUserSchema, type ForgejoUser } from "./forgejoUserSchema.js"

export async function forgejoUserGet(
  transport: ForgejoRestTransport,
  userInput: unknown,
): Promise<ForgejoResult<ForgejoUser>> {
  const op = "forgejoUserGet"
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const response = await transport.request({ path: `/api/v1/users/${encodeURIComponent(user.data)}` })
  if (!response.success) return response
  const parsed = a.safeParse(forgejoUserSchema, response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return { success: true, data: parsed.output }
}
