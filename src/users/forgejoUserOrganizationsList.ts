import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoOrganizationSchema, type ForgejoOrganization } from "../organizations/forgejoOrganizationSchema.js"
import { forgejoUserReferenceParse } from "./forgejoUserReferenceParse.js"

export async function forgejoUserOrganizationsList(
  transport: ForgejoRestTransport,
  userInput?: unknown,
): Promise<ForgejoResult<ForgejoOrganization[]>> {
  const op = "forgejoUserOrganizationsList"
  let path = "/api/v1/user/orgs"
  if (userInput !== undefined) {
    const user = forgejoUserReferenceParse(userInput)
    if (!user.success) return createResultError(op, user.errorMessage)
    path = `/api/v1/users/${encodeURIComponent(user.data)}/orgs`
  }
  const response = await transport.request({ path })
  if (!response.success) return response
  const parsed = a.safeParse(a.array(forgejoOrganizationSchema), response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
