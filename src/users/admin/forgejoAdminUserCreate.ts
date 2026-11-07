import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserSchema, type ForgejoUser } from "../forgejoUserSchema.js"
import {
  forgejoAdminUserCreateOptionsSchema,
  type ForgejoAdminUserCreateOptions,
} from "./forgejoAdminUserCreateOptionsSchema.js"

export async function forgejoAdminUserCreate(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoUser>> {
  const op = "forgejoAdminUserCreate"
  const parsed = a.safeParse(forgejoAdminUserCreateOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoAdminUserCreateOptions = parsed.output
  const {
    fullName,
    loginName,
    mustChangePassword,
    sendNotify,
    sourceId,
    allowCreateOrganization,
    allowGitHook,
    allowImportLocal,
    maxRepoCreation,
    prohibitLogin,
    ...rest
  } = options
  const response = await transport.request({
    path: "/api/v1/admin/users",
    method: "POST",
    body: {
      ...rest,
      ...(fullName === undefined ? {} : { full_name: fullName }),
      ...(loginName === undefined ? {} : { login_name: loginName }),
      ...(mustChangePassword === undefined ? {} : { must_change_password: mustChangePassword }),
      ...(sendNotify === undefined ? {} : { send_notify: sendNotify }),
      ...(sourceId === undefined ? {} : { source_id: sourceId }),
      ...(allowCreateOrganization === undefined ? {} : { allow_create_organization: allowCreateOrganization }),
      ...(allowGitHook === undefined ? {} : { allow_git_hook: allowGitHook }),
      ...(allowImportLocal === undefined ? {} : { allow_import_local: allowImportLocal }),
      ...(maxRepoCreation === undefined ? {} : { max_repo_creation: maxRepoCreation }),
      ...(prohibitLogin === undefined ? {} : { prohibit_login: prohibitLogin }),
    },
  })
  if (!response.success) return response
  const user = a.safeParse(forgejoUserSchema, response.data.data)
  if (!user.success) return createResultError(op, a.summarize(user.issues))
  return { success: true, data: user.output }
}
