import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositorySchema, type ForgejoRepository } from "../repositories/forgejoRepositorySchema.js"
import {
  forgejoOrganizationTeamRepositoriesListOptionsSchema,
  type ForgejoOrganizationTeamRepositoriesListOptions,
} from "./forgejoOrganizationTeamRepositoriesListOptionsSchema.js"
import { forgejoOrganizationTeamIdResolve } from "./forgejoOrganizationTeamIdResolve.js"

export async function forgejoOrganizationTeamRepositoriesList(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  teamInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoRepository[]>> {
  const op = "forgejoOrganizationTeamRepositoriesList"
  const team = await forgejoOrganizationTeamIdResolve(transport, organizationInput, teamInput)
  if (!team.success) return createResultError(op, team.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationTeamRepositoriesListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationTeamRepositoriesListOptions = parsed.output
  const response = await transport.request({
    path: `/api/v1/teams/${team.data}/repos`,
    query: {
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  })
  if (!response.success) return response
  const repositories = a.safeParse(a.array(forgejoRepositorySchema), response.data.data)
  if (!repositories.success) return createResultError(op, a.summarize(repositories.issues))
  return createResult(repositories.output)
}
