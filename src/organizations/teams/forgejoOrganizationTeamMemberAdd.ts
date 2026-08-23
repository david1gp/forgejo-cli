import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../../users/forgejoUserReferenceParse.js"
import { forgejoOrganizationTeamIdResolve } from "./forgejoOrganizationTeamIdResolve.js"

export async function forgejoOrganizationTeamMemberAdd(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  teamInput: unknown,
  userInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoOrganizationTeamMemberAdd"
  const team = await forgejoOrganizationTeamIdResolve(transport, organizationInput, teamInput)
  if (!team.success) return createResultError(op, team.errorMessage)
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const response = await transport.request<null>({
    path: `/api/v1/teams/${team.data}/members/${encodeURIComponent(user.data)}`,
    method: "PUT",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
