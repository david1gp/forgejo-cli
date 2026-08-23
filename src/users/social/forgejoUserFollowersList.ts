import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"
import { forgejoUserSchema, type ForgejoUser } from "../forgejoUserSchema.js"

export async function forgejoUserFollowersList(
  transport: ForgejoRestTransport,
  userInput?: unknown,
): Promise<ForgejoResult<ForgejoUser[]>> {
  const op = "forgejoUserFollowersList"
  let path = "/api/v1/user/followers"
  if (userInput !== undefined) {
    const user = forgejoUserReferenceParse(userInput)
    if (!user.success) return createResultError(op, user.errorMessage)
    path = `/api/v1/users/${encodeURIComponent(user.data)}/followers`
  }
  const response = await transport.request({ path })
  if (!response.success) return response
  const parsed = a.safeParse(a.array(forgejoUserSchema), response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
