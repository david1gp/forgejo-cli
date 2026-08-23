import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationEditOptionsSchema,
  type ForgejoOrganizationEditOptions,
} from "./forgejoOrganizationEditOptionsSchema.js"
import { forgejoOrganizationPathCreate } from "./forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"
import { forgejoOrganizationSchema, type ForgejoOrganization } from "./forgejoOrganizationSchema.js"

export async function forgejoOrganizationEdit(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoOrganization>> {
  const op = "forgejoOrganizationEdit"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationEditOptions = parsed.output
  const { fullName, adminCanChangeTeamAccess, ...rest } = options
  const response = await transport.request({
    path: forgejoOrganizationPathCreate(organization.data),
    method: "PATCH",
    body: {
      ...rest,
      ...(fullName === undefined ? {} : { full_name: fullName }),
      ...(adminCanChangeTeamAccess === undefined ? {} : { repo_admin_change_team_access: adminCanChangeTeamAccess }),
    },
  })
  if (!response.success) return response
  const edited = a.safeParse(forgejoOrganizationSchema, response.data.data)
  if (!edited.success) return createResultError(op, a.summarize(edited.issues))
  return { success: true, data: edited.output }
}
