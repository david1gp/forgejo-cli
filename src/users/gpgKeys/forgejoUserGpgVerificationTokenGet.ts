import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"

export async function forgejoUserGpgVerificationTokenGet(
  transport: ForgejoRestTransport,
): Promise<ForgejoResult<string>> {
  const op = "forgejoUserGpgVerificationTokenGet"
  const response = await transport.request({ path: "/api/v1/user/gpg_key_token" })
  if (!response.success) return response
  const token = a.safeParse(a.string(), response.data.data)
  if (!token.success) return createResultError(op, a.summarize(token.issues))
  return createResult(token.output)
}
