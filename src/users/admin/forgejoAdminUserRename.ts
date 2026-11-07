import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"
import { forgejoUserSchema, type ForgejoUser } from "../forgejoUserSchema.js"
import {
  forgejoAdminUserRenameOptionsSchema,
  type ForgejoAdminUserRenameOptions,
} from "./forgejoAdminUserRenameOptionsSchema.js"

export async function forgejoAdminUserRename(
  transport: ForgejoRestTransport,
  userInput: unknown,
  input: unknown,
): Promise<ForgejoResult<ForgejoUser>> {
  const op = "forgejoAdminUserRename"
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const parsed = a.safeParse(forgejoAdminUserRenameOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoAdminUserRenameOptions = parsed.output
  const response = await transport.request({
    path: `/api/v1/admin/users/${encodeURIComponent(user.data)}/rename`,
    method: "POST",
    body: {
      new_username: options.newUsername,
    },
  })
  if (!response.success) return response
  const renamed = a.safeParse(forgejoUserSchema, response.data.data)
  if (!renamed.success) return createResultError(op, a.summarize(renamed.issues))
  return { success: true, data: renamed.output }
}
