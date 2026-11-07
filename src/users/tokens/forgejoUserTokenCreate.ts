import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"
import {
  forgejoUserTokenCreateOptionsSchema,
  type ForgejoUserTokenCreateOptions,
} from "./forgejoUserTokenCreateOptionsSchema.js"
import { forgejoUserTokenSchema, type ForgejoUserToken } from "./forgejoUserTokenSchema.js"

export async function forgejoUserTokenCreate(
  transport: ForgejoRestTransport,
  userInput: unknown,
  input: unknown,
): Promise<ForgejoResult<ForgejoUserToken>> {
  const op = "forgejoUserTokenCreate"
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const parsed = a.safeParse(forgejoUserTokenCreateOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserTokenCreateOptions = parsed.output
  const response = await transport.request({
    path: `/api/v1/users/${encodeURIComponent(user.data)}/tokens`,
    method: "POST",
    body: {
      name: options.name,
      ...(options.scopes === undefined ? {} : { scopes: options.scopes }),
    },
  })
  if (!response.success) return response
  const token = a.safeParse(forgejoUserTokenSchema, response.data.data)
  if (!token.success) return createResultError(op, a.summarize(token.issues))
  return { success: true, data: token.output }
}
