import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../../users/forgejoUserReferenceParse.js"
import { forgejoOrganizationPathCreate } from "../forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "../forgejoOrganizationReferenceParse.js"

export async function forgejoOrganizationMemberVisibilityGet(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  userInput: unknown,
): Promise<ForgejoResult<"public" | "private">> {
  const op = "forgejoOrganizationMemberVisibilityGet"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const response = await transport.request({
    path: `${forgejoOrganizationPathCreate(organization.data)}/public_members/${encodeURIComponent(user.data)}`,
  })
  if (!response.success) {
    if (response.statusCode === 404) return createResult("private")
    return response
  }
  return createResult("public")
}
