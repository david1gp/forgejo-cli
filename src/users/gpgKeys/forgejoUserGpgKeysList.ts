import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserGpgKeySchema, type ForgejoUserGpgKey } from "./forgejoUserGpgKeySchema.js"

export async function forgejoUserGpgKeysList(
  transport: ForgejoRestTransport,
): Promise<ForgejoResult<ForgejoUserGpgKey[]>> {
  const op = "forgejoUserGpgKeysList"
  const response = await transport.request({ path: "/api/v1/user/gpg_keys" })
  if (!response.success) return response
  const keys = a.safeParse(a.array(forgejoUserGpgKeySchema), response.data.data)
  if (!keys.success) return createResultError(op, a.summarize(keys.issues))
  return createResult(keys.output)
}
