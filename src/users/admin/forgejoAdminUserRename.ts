import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"
import {
  forgejoAdminUserRenameOptionsSchema,
  type ForgejoAdminUserRenameOptions,
} from "./forgejoAdminUserRenameOptionsSchema.js"

export async function forgejoAdminUserRename(
  transport: ForgejoRestTransport,
  userInput: unknown,
  input: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoAdminUserRename"
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const parsed = a.safeParse(forgejoAdminUserRenameOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoAdminUserRenameOptions = parsed.output
  const response = await transport.request<null>({
    path: `/api/v1/admin/users/${encodeURIComponent(user.data)}/rename`,
    method: "POST",
    body: {
      new_username: options.newUsername,
    },
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
