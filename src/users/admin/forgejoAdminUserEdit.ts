import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"
import { forgejoUserSchema, type ForgejoUser } from "../forgejoUserSchema.js"
import {
  forgejoAdminUserEditOptionsSchema,
  type ForgejoAdminUserEditOptions,
} from "./forgejoAdminUserEditOptionsSchema.js"

export async function forgejoAdminUserEdit(
  transport: ForgejoRestTransport,
  userInput: unknown,
  input: unknown,
): Promise<ForgejoResult<ForgejoUser>> {
  const op = "forgejoAdminUserEdit"
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const parsed = a.safeParse(forgejoAdminUserEditOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoAdminUserEditOptions = parsed.output
  const {
    fullName,
    loginName,
    mustChangePassword,
    allowCreateOrganization,
    allowDeleteAvatar,
    allowGitHook,
    allowImportLocal,
    maxRepoCreation,
    prohibitLogin,
    ...rest
  } = options
  const response = await transport.request({
    path: `/api/v1/admin/users/${encodeURIComponent(user.data)}`,
    method: "PATCH",
    body: {
      ...rest,
      ...(fullName === undefined ? {} : { full_name: fullName }),
      ...(loginName === undefined ? {} : { login_name: loginName }),
      ...(mustChangePassword === undefined ? {} : { must_change_password: mustChangePassword }),
      ...(allowCreateOrganization === undefined ? {} : { allow_create_organization: allowCreateOrganization }),
      ...(allowDeleteAvatar === undefined ? {} : { allow_delete_avatar: allowDeleteAvatar }),
      ...(allowGitHook === undefined ? {} : { allow_git_hook: allowGitHook }),
      ...(allowImportLocal === undefined ? {} : { allow_import_local: allowImportLocal }),
      ...(maxRepoCreation === undefined ? {} : { max_repo_creation: maxRepoCreation }),
      ...(prohibitLogin === undefined ? {} : { prohibit_login: prohibitLogin }),
    },
  })
  if (!response.success) return response
  const updated = a.safeParse(forgejoUserSchema, response.data.data)
  if (!updated.success) return createResultError(op, a.summarize(updated.issues))
  return { success: true, data: updated.output }
}
