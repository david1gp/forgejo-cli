import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationRepositoriesListOptionsSchema,
  type ForgejoOrganizationRepositoriesListOptions,
} from "./forgejoOrganizationRepositoriesListOptionsSchema.js"
import { forgejoOrganizationPathCreate } from "../forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "../forgejoOrganizationReferenceParse.js"
import { forgejoRepositorySchema, type ForgejoRepository } from "../../repositories/forgejoRepositorySchema.js"

export async function forgejoOrganizationRepositoriesList(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoRepository[]>> {
  const op = "forgejoOrganizationRepositoriesList"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationRepositoriesListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationRepositoriesListOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoOrganizationPathCreate(organization.data)}/repos`,
    query: {
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
      ...(options.sort === undefined ? {} : { sort: options.sort }),
      ...(options.order === undefined ? {} : { order: options.order }),
      ...(options.private === undefined ? {} : { private: options.private }),
    },
  })
  if (!response.success) return response
  const repositories = a.safeParse(a.array(forgejoRepositorySchema), response.data.data)
  if (!repositories.success) return createResultError(op, a.summarize(repositories.issues))
  return createResult(repositories.output)
}
