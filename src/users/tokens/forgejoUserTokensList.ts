import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"
import { forgejoUserTokenSchema, type ForgejoUserToken } from "./forgejoUserTokenSchema.js"

export async function forgejoUserTokensList(
  transport: ForgejoRestTransport,
  userInput: unknown,
): Promise<ForgejoResult<ForgejoUserToken[]>> {
  const op = "forgejoUserTokensList"
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const response = await transport.request({ path: `/api/v1/users/${encodeURIComponent(user.data)}/tokens` })
  if (!response.success) return response
  const tokens = a.safeParse(a.array(forgejoUserTokenSchema), response.data.data)
  if (!tokens.success) return createResultError(op, a.summarize(tokens.issues))
  return createResult(tokens.output)
}
