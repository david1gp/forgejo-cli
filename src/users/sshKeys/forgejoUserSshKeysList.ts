import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"
import { forgejoUserSshKeySchema, type ForgejoUserSshKey } from "./forgejoUserSshKeySchema.js"

export async function forgejoUserSshKeysList(
  transport: ForgejoRestTransport,
  userInput?: unknown,
): Promise<ForgejoResult<ForgejoUserSshKey[]>> {
  const op = "forgejoUserSshKeysList"
  let path = "/api/v1/user/keys"
  if (userInput !== undefined) {
    const user = forgejoUserReferenceParse(userInput)
    if (!user.success) return createResultError(op, user.errorMessage)
    path = `/api/v1/users/${encodeURIComponent(user.data)}/keys`
  }
  const response = await transport.request({ path })
  if (!response.success) return response
  const keys = a.safeParse(a.array(forgejoUserSshKeySchema), response.data.data)
  if (!keys.success) return createResultError(op, a.summarize(keys.issues))
  return createResult(keys.output)
}
