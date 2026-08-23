import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserSchema, type ForgejoUser } from "../users/forgejoUserSchema.js"
import {
  forgejoOrganizationTeamMembersListOptionsSchema,
  type ForgejoOrganizationTeamMembersListOptions,
} from "./forgejoOrganizationTeamMembersListOptionsSchema.js"
import { forgejoOrganizationTeamIdResolve } from "./forgejoOrganizationTeamIdResolve.js"

export async function forgejoOrganizationTeamMembersList(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  teamInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoUser[]>> {
  const op = "forgejoOrganizationTeamMembersList"
  const team = await forgejoOrganizationTeamIdResolve(transport, organizationInput, teamInput)
  if (!team.success) return createResultError(op, team.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationTeamMembersListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationTeamMembersListOptions = parsed.output
  const response = await transport.request({
    path: `/api/v1/teams/${team.data}/members`,
    query: {
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  })
  if (!response.success) return response
  const members = a.safeParse(a.array(forgejoUserSchema), response.data.data)
  if (!members.success) return createResultError(op, a.summarize(members.issues))
  return createResult(members.output)
}
