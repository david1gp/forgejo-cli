import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoOrganizationTeamIdResolve } from "./forgejoOrganizationTeamIdResolve.js"
import { forgejoOrganizationTeamSchema, type ForgejoOrganizationTeam } from "./forgejoOrganizationTeamSchema.js"

export async function forgejoOrganizationTeamGet(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  teamInput?: unknown,
): Promise<ForgejoResult<ForgejoOrganizationTeam>> {
  const op = "forgejoOrganizationTeamGet"
  const team = await forgejoOrganizationTeamIdResolve(transport, organizationInput, teamInput ?? organizationInput)
  if (!team.success) return createResultError(op, team.errorMessage)
  const response = await transport.request({ path: `/api/v1/teams/${team.data}` })
  if (!response.success) return response
  const parsed = a.safeParse(forgejoOrganizationTeamSchema, response.data.data)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return { success: true, data: parsed.output }
}
