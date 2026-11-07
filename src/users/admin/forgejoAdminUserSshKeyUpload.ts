import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"
import { forgejoUserSshKeySchema, type ForgejoUserSshKey } from "../sshKeys/forgejoUserSshKeySchema.js"
import {
  forgejoAdminUserSshKeyUploadOptionsSchema,
  type ForgejoAdminUserSshKeyUploadOptions,
} from "./forgejoAdminUserSshKeyUploadOptionsSchema.js"

export async function forgejoAdminUserSshKeyUpload(
  transport: ForgejoRestTransport,
  userInput: unknown,
  input: unknown,
): Promise<ForgejoResult<ForgejoUserSshKey>> {
  const op = "forgejoAdminUserSshKeyUpload"
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const parsed = a.safeParse(forgejoAdminUserSshKeyUploadOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoAdminUserSshKeyUploadOptions = parsed.output
  const response = await transport.request({
    path: `/api/v1/admin/users/${encodeURIComponent(user.data)}/keys`,
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
