import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationLabelEditOptionsSchema,
  type ForgejoOrganizationLabelEditOptions,
} from "./forgejoOrganizationLabelEditOptionsSchema.js"
import { forgejoOrganizationLabelIdResolve } from "./forgejoOrganizationLabelIdResolve.js"
import { forgejoOrganizationLabelSchema, type ForgejoOrganizationLabel } from "./forgejoOrganizationLabelSchema.js"
import { forgejoOrganizationPathCreate } from "./forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"

export async function forgejoOrganizationLabelEdit(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  labelInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoOrganizationLabel>> {
  const op = "forgejoOrganizationLabelEdit"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const labelId = await forgejoOrganizationLabelIdResolve(transport, organization.data, labelInput)
  if (!labelId.success) return createResultError(op, labelId.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationLabelEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationLabelEditOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoOrganizationPathCreate(organization.data)}/labels/${labelId.data}`,
    method: "PATCH",
    body: {
      ...(options.name === undefined ? {} : { name: options.name }),
      ...(options.color === undefined ? {} : { color: options.color.replace(/^#/, "") }),
      ...(options.description === undefined ? {} : { description: options.description }),
      ...(options.exclusive === undefined ? {} : { exclusive: options.exclusive }),
      ...(options.archived === undefined ? {} : { is_archived: options.archived }),
    },
  })
  if (!response.success) return response
  const label = a.safeParse(forgejoOrganizationLabelSchema, response.data.data)
  if (!label.success) return createResultError(op, a.summarize(label.issues))
  return { success: true, data: label.output }
}
