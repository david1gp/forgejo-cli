import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationTeamsListOptionsSchema,
  type ForgejoOrganizationTeamsListOptions,
} from "./forgejoOrganizationTeamsListOptionsSchema.js"
import { forgejoOrganizationPathCreate } from "./forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"
import { forgejoOrganizationTeamSchema, type ForgejoOrganizationTeam } from "./forgejoOrganizationTeamSchema.js"

export async function forgejoOrganizationTeamsList(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoOrganizationTeam[]>> {
  const op = "forgejoOrganizationTeamsList"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationTeamsListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationTeamsListOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoOrganizationPathCreate(organization.data)}/teams`,
    query: {
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  })
  if (!response.success) return response
  const teams = a.safeParse(a.array(forgejoOrganizationTeamSchema), response.data.data)
  if (!teams.success) return createResultError(op, a.summarize(teams.issues))
  return createResult(teams.output)
}
