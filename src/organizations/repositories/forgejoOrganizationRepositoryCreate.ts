import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationRepositoryCreateOptionsSchema,
  type ForgejoOrganizationRepositoryCreateOptions,
} from "./forgejoOrganizationRepositoryCreateOptionsSchema.js"
import { forgejoOrganizationPathCreate } from "../forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "../forgejoOrganizationReferenceParse.js"
import { forgejoRepositorySchema, type ForgejoRepository } from "../../repositories/forgejoRepositorySchema.js"

export async function forgejoOrganizationRepositoryCreate(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoRepository>> {
  const op = "forgejoOrganizationRepositoryCreate"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationRepositoryCreateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationRepositoryCreateOptions = parsed.output
  const { autoInit, defaultBranch, gitignores, issueLabels, trustModel, objectFormatName, ...rest } = options
  const response = await transport.request({
    path: `${forgejoOrganizationPathCreate(organization.data)}/repos`,
    method: "POST",
    body: {
      ...rest,
      ...(autoInit === undefined ? {} : { auto_init: autoInit }),
      ...(defaultBranch === undefined ? {} : { default_branch: defaultBranch }),
      ...(gitignores === undefined ? {} : { gitignores }),
      ...(issueLabels === undefined ? {} : { issue_labels: issueLabels }),
      ...(trustModel === undefined ? {} : { trust_model: trustModel }),
      ...(objectFormatName === undefined ? {} : { object_format_name: objectFormatName }),
    },
  })
  if (!response.success) return response
  const repository = a.safeParse(forgejoRepositorySchema, response.data.data)
  if (!repository.success) return createResultError(op, a.summarize(repository.issues))
  return { success: true, data: repository.output }
}
