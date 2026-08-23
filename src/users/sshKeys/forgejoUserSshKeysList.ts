import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserSshKeySchema, type ForgejoUserSshKey } from "./forgejoUserSshKeySchema.js"

export async function forgejoUserSshKeysList(
  transport: ForgejoRestTransport,
): Promise<ForgejoResult<ForgejoUserSshKey[]>> {
  const op = "forgejoUserSshKeysList"
  const response = await transport.request({ path: "/api/v1/user/keys" })
  if (!response.success) return response
  const keys = a.safeParse(a.array(forgejoUserSshKeySchema), response.data.data)
  if (!keys.success) return createResultError(op, a.summarize(keys.issues))
  return createResult(keys.output)
}
