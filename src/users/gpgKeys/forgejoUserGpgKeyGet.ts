import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserGpgKeySchema, type ForgejoUserGpgKey } from "./forgejoUserGpgKeySchema.js"

export async function forgejoUserGpgKeyGet(
  transport: ForgejoRestTransport,
  idInput: unknown,
): Promise<ForgejoResult<ForgejoUserGpgKey>> {
  const op = "forgejoUserGpgKeyGet"
  const id = a.safeParse(a.pipe(a.number(), a.integer(), a.minValue(1)), idInput)
  if (!id.success) return createResultError(op, a.summarize(id.issues))
  const response = await transport.request({ path: `/api/v1/user/gpg_keys/${id.output}` })
  if (!response.success) return response
  const key = a.safeParse(forgejoUserGpgKeySchema, response.data.data)
  if (!key.success) return createResultError(op, a.summarize(key.issues))
  return { success: true, data: key.output }
}
