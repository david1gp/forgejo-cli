import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../users/forgejoUserReferenceParse.js"
import {
  forgejoOrganizationMemberVisibilitySetOptionsSchema,
  type ForgejoOrganizationMemberVisibilitySetOptions,
} from "./forgejoOrganizationMemberVisibilitySetOptionsSchema.js"
import { forgejoOrganizationPathCreate } from "./forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "./forgejoOrganizationReferenceParse.js"

export async function forgejoOrganizationMemberVisibilitySet(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  userInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoOrganizationMemberVisibilitySet"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationMemberVisibilitySetOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationMemberVisibilitySetOptions = parsed.output
  const response = await transport.request<null>({
    path: `${forgejoOrganizationPathCreate(organization.data)}/public_members/${encodeURIComponent(user.data)}`,
    method: options.visibility === "public" ? "PUT" : "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
