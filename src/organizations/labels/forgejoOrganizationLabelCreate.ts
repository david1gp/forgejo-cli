import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationLabelCreateOptionsSchema,
  type ForgejoOrganizationLabelCreateOptions,
} from "./forgejoOrganizationLabelCreateOptionsSchema.js"
import { forgejoOrganizationLabelSchema, type ForgejoOrganizationLabel } from "./forgejoOrganizationLabelSchema.js"
import { forgejoOrganizationPathCreate } from "../forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "../forgejoOrganizationReferenceParse.js"

export async function forgejoOrganizationLabelCreate(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoOrganizationLabel>> {
  const op = "forgejoOrganizationLabelCreate"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationLabelCreateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationLabelCreateOptions = parsed.output
  const color = options.color.replace(/^#/, "")
  const response = await transport.request({
    path: `${forgejoOrganizationPathCreate(organization.data)}/labels`,
    method: "POST",
    body: {
      name: options.name,
      color,
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
