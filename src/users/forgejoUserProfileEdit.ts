import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoUserProfileEditOptionsSchema,
  type ForgejoUserProfileEditOptions,
} from "./forgejoUserProfileEditOptionsSchema.js"
import { forgejoUserSchema, type ForgejoUser } from "./forgejoUserSchema.js"

export async function forgejoUserProfileEdit(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoUser>> {
  const op = "forgejoUserProfileEdit"
  const parsed = a.safeParse(forgejoUserProfileEditOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserProfileEditOptions = parsed.output
  const { fullName, hideEmail, hideActivity, hidePronouns, keepActivityPrivate, ...rest } = options
  const response = await transport.request({
    path: "/api/v1/user",
    method: "PATCH",
    body: {
      ...rest,
      ...(fullName === undefined ? {} : { full_name: fullName }),
      ...(hideEmail === undefined ? {} : { hide_email: hideEmail }),
      ...(hideActivity === undefined ? {} : { hide_activity: hideActivity }),
      ...(hidePronouns === undefined ? {} : { hide_pronouns: hidePronouns }),
      ...(keepActivityPrivate === undefined ? {} : { keep_activity_private: keepActivityPrivate }),
    },
  })
  if (!response.success) return response
  const user = a.safeParse(forgejoUserSchema, response.data.data)
  if (!user.success) return createResultError(op, a.summarize(user.issues))
  return { success: true, data: user.output }
}
