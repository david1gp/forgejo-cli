import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserSchema, type ForgejoUser } from "../users/forgejoUserSchema.js"
import {
  forgejoOrganizationMembersListOptionsSchema,
  type ForgejoOrganizationMembersListOptions,
} from "./forgejoOrganizationMembersListOptionsSchema.js"
import { forgejoOrganizationPathCreate } from "./forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"

export async function forgejoOrganizationMembersList(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoUser[]>> {
  const op = "forgejoOrganizationMembersList"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationMembersListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationMembersListOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoOrganizationPathCreate(organization.data)}/${options.publicOnly ? "public_members" : "members"}`,
    query: {
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  })
  if (!response.success) return response
  const members = a.safeParse(a.array(forgejoUserSchema), response.data.data)
  if (!members.success) return createResultError(op, a.summarize(members.issues))
  return createResult(members.output)
}
