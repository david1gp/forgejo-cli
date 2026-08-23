import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserEmailSchema, type ForgejoUserEmail } from "./forgejoUserEmailSchema.js"

export async function forgejoUserEmailsList(
  transport: ForgejoRestTransport,
): Promise<ForgejoResult<ForgejoUserEmail[]>> {
  const op = "forgejoUserEmailsList"
  const response = await transport.request({ path: "/api/v1/user/emails" })
  if (!response.success) return response
  const emails = a.safeParse(a.array(forgejoUserEmailSchema), response.data.data)
  if (!emails.success) return createResultError(op, a.summarize(emails.issues))
  return createResult(emails.output)
}
