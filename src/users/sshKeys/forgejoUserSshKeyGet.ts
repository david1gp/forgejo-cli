import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserSshKeySchema, type ForgejoUserSshKey } from "./forgejoUserSshKeySchema.js"

export async function forgejoUserSshKeyGet(
  transport: ForgejoRestTransport,
  idInput: unknown,
): Promise<ForgejoResult<ForgejoUserSshKey>> {
  const op = "forgejoUserSshKeyGet"
  const id = a.safeParse(a.pipe(a.number(), a.integer(), a.minValue(1)), idInput)
  if (!id.success) return createResultError(op, a.summarize(id.issues))
  const response = await transport.request({ path: `/api/v1/user/keys/${id.output}` })
  if (!response.success) return response
  const key = a.safeParse(forgejoUserSshKeySchema, response.data.data)
  if (!key.success) return createResultError(op, a.summarize(key.issues))
  return { success: true, data: key.output }
}
