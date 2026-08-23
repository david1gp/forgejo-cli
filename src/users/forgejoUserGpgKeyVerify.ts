import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoUserGpgKeyVerifyOptionsSchema,
  type ForgejoUserGpgKeyVerifyOptions,
} from "./forgejoUserGpgKeyVerifyOptionsSchema.js"

export async function forgejoUserGpgKeyVerify(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoUserGpgKeyVerify"
  const parsed = a.safeParse(forgejoUserGpgKeyVerifyOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserGpgKeyVerifyOptions = parsed.output
  const response = await transport.request<null>({
    path: "/api/v1/user/gpg_key_verify",
    method: "POST",
    body: {
      key_id: options.keyId,
      armored_signature: options.armoredSignature,
    },
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
