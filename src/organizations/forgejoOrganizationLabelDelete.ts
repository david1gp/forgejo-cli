import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoOrganizationLabelIdResolve } from "./forgejoOrganizationLabelIdResolve.js"
import { forgejoOrganizationPathCreate } from "./forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"

export async function forgejoOrganizationLabelDelete(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  labelInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoOrganizationLabelDelete"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const labelId = await forgejoOrganizationLabelIdResolve(transport, organization.data, labelInput)
  if (!labelId.success) return createResultError(op, labelId.errorMessage)
  const response = await transport.request<null>({
    path: `${forgejoOrganizationPathCreate(organization.data)}/labels/${labelId.data}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
