import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoUserSshKeyUploadOptionsSchema,
  type ForgejoUserSshKeyUploadOptions,
} from "./forgejoUserSshKeyUploadOptionsSchema.js"
import { forgejoUserSshKeySchema, type ForgejoUserSshKey } from "./forgejoUserSshKeySchema.js"

export async function forgejoUserSshKeyUpload(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoUserSshKey>> {
  const op = "forgejoUserSshKeyUpload"
  const parsed = a.safeParse(forgejoUserSshKeyUploadOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserSshKeyUploadOptions = parsed.output
  const response = await transport.request({
    path: "/api/v1/user/keys",
    method: "POST",
    body: {
      key: options.key,
      title: options.title,
      ...(options.readOnly === undefined ? {} : { read_only: options.readOnly }),
    },
  })
  if (!response.success) return response
  const key = a.safeParse(forgejoUserSshKeySchema, response.data.data)
  if (!key.success) return createResultError(op, a.summarize(key.issues))
  return { success: true, data: key.output }
}
