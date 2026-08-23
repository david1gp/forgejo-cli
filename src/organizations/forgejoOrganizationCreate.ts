import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationCreateOptionsSchema,
  type ForgejoOrganizationCreateOptions,
} from "./forgejoOrganizationCreateOptionsSchema.js"
import { forgejoOrganizationSchema, type ForgejoOrganization } from "./forgejoOrganizationSchema.js"

export async function forgejoOrganizationCreate(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoOrganization>> {
  const op = "forgejoOrganizationCreate"
  const parsed = a.safeParse(forgejoOrganizationCreateOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationCreateOptions = parsed.output
  const { name, fullName, adminCanChangeTeamAccess, ...rest } = options
  const response = await transport.request({
    path: "/api/v1/orgs",
    method: "POST",
    body: {
      username: name,
      ...rest,
      ...(fullName === undefined ? {} : { full_name: fullName }),
      ...(adminCanChangeTeamAccess === undefined ? {} : { repo_admin_change_team_access: adminCanChangeTeamAccess }),
    },
  })
  if (!response.success) return response
  const organization = a.safeParse(forgejoOrganizationSchema, response.data.data)
  if (!organization.success) return createResultError(op, a.summarize(organization.issues))
  return { success: true, data: organization.output }
}
