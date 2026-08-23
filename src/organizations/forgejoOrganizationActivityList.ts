import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationActivitySchema,
  type ForgejoOrganizationActivity,
} from "./forgejoOrganizationActivitySchema.js"
import { forgejoOrganizationPathCreate } from "./forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"

export async function forgejoOrganizationActivityList(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
): Promise<ForgejoResult<ForgejoOrganizationActivity[]>> {
  const op = "forgejoOrganizationActivityList"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const response = await transport.request({ path: `${forgejoOrganizationPathCreate(organization.data)}/activities` })
  if (!response.success) return response
  const activities = a.safeParse(a.array(forgejoOrganizationActivitySchema), response.data.data)
  if (!activities.success) return createResultError(op, a.summarize(activities.issues))
  return createResult(activities.output)
}
