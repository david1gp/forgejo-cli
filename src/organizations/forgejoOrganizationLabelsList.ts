import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationLabelsListOptionsSchema,
  type ForgejoOrganizationLabelsListOptions,
} from "./forgejoOrganizationLabelsListOptionsSchema.js"
import { forgejoOrganizationLabelSchema, type ForgejoOrganizationLabel } from "./forgejoOrganizationLabelSchema.js"
import { forgejoOrganizationPathCreate } from "./forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"

export async function forgejoOrganizationLabelsList(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoOrganizationLabel[]>> {
  const op = "forgejoOrganizationLabelsList"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationLabelsListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationLabelsListOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoOrganizationPathCreate(organization.data)}/labels`,
    query: {
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
      ...(options.includeArchived === undefined ? {} : { include_archived: options.includeArchived }),
    },
  })
  if (!response.success) return response
  const labels = a.safeParse(a.array(forgejoOrganizationLabelSchema), response.data.data)
  if (!labels.success) return createResultError(op, a.summarize(labels.issues))
  return createResult(labels.output)
}
