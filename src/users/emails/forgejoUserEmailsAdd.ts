import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserEmailOptionsSchema, type ForgejoUserEmailOptions } from "./forgejoUserEmailOptionsSchema.js"
import { forgejoUserEmailSchema, type ForgejoUserEmail } from "./forgejoUserEmailSchema.js"

export async function forgejoUserEmailsAdd(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoUserEmail[]>> {
  const op = "forgejoUserEmailsAdd"
  const parsed = a.safeParse(forgejoUserEmailOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserEmailOptions = parsed.output
  const response = await transport.request({ path: "/api/v1/user/emails", method: "POST", body: options })
  if (!response.success) return response
  const emails = a.safeParse(a.array(forgejoUserEmailSchema), response.data.data)
  if (!emails.success) return createResultError(op, a.summarize(emails.issues))
  return createResult(emails.output)
}
