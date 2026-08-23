import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoOrganizationTeamsList } from "./forgejoOrganizationTeamsList.js"

const forgejoOrganizationTeamIdSchema = a.pipe(a.number(), a.integer(), a.minValue(1))

export async function forgejoOrganizationTeamIdResolve(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  teamInput: unknown,
): Promise<ForgejoResult<number>> {
  const op = "forgejoOrganizationTeamIdResolve"
  const id = a.safeParse(forgejoOrganizationTeamIdSchema, teamInput)
  if (id.success) return { success: true, data: id.output }
  if (typeof teamInput !== "string") return createResultError(op, a.summarize(id.issues))
  const teams = await forgejoOrganizationTeamsList(transport, organizationInput)
  if (!teams.success) return teams
  const team = teams.data.find((item) => item.name === teamInput)
  if (!team?.id) return createResultError(op, `Team ${teamInput} was not found`)
  return createResult(team.id)
}
