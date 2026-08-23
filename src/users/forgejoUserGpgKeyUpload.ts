import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoUserGpgKeyUploadOptionsSchema,
  type ForgejoUserGpgKeyUploadOptions,
} from "./forgejoUserGpgKeyUploadOptionsSchema.js"
import { forgejoUserGpgKeySchema, type ForgejoUserGpgKey } from "./forgejoUserGpgKeySchema.js"

export async function forgejoUserGpgKeyUpload(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoUserGpgKey>> {
  const op = "forgejoUserGpgKeyUpload"
  const parsed = a.safeParse(forgejoUserGpgKeyUploadOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserGpgKeyUploadOptions = parsed.output
  const response = await transport.request({
    path: "/api/v1/user/gpg_keys",
    method: "POST",
    body: {
      armored_public_key: options.armoredPublicKey,
      ...(options.armoredSignature === undefined ? {} : { armored_signature: options.armoredSignature }),
    },
  })
  if (!response.success) return response
  const key = a.safeParse(forgejoUserGpgKeySchema, response.data.data)
  if (!key.success) return createResultError(op, a.summarize(key.issues))
  return { success: true, data: key.output }
}
