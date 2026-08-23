import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"
import { forgejoOrganizationTeamIdResolve } from "./forgejoOrganizationTeamIdResolve.js"

const forgejoOrganizationRepositoryNameSchema = a.pipe(a.string(), a.trim(), a.minLength(1))

export async function forgejoOrganizationTeamRepositoryRemove(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  teamInput: unknown,
  repositoryInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoOrganizationTeamRepositoryRemove"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const team = await forgejoOrganizationTeamIdResolve(transport, organization.data, teamInput)
  if (!team.success) return createResultError(op, team.errorMessage)
  const repository = a.safeParse(forgejoOrganizationRepositoryNameSchema, repositoryInput)
  if (!repository.success) return createResultError(op, a.summarize(repository.issues))
  const response = await transport.request<null>({
    path: `/api/v1/teams/${team.data}/repos/${encodeURIComponent(organization.data)}/${encodeURIComponent(repository.output)}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
