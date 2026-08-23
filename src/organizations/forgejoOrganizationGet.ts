import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoOrganizationPathCreate } from "./forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"
import { forgejoOrganizationSchema, type ForgejoOrganization } from "./forgejoOrganizationSchema.js"

export async function forgejoOrganizationGet(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
): Promise<ForgejoResult<ForgejoOrganization>> {
  const op = "forgejoOrganizationGet"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const response = await transport.request({ path: forgejoOrganizationPathCreate(organization.data) })
  if (!response.success) return response
  const parsed = a.safeParse(forgejoOrganizationSchema, response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return { success: true, data: parsed.output }
}
