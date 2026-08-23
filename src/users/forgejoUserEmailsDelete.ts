import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserEmailOptionsSchema, type ForgejoUserEmailOptions } from "./forgejoUserEmailOptionsSchema.js"

export async function forgejoUserEmailsDelete(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoUserEmailsDelete"
  const parsed = a.safeParse(forgejoUserEmailOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserEmailOptions = parsed.output
  const response = await transport.request<null>({
    path: "/api/v1/user/emails",
    method: "DELETE",
    body: options,
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
