import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationListOptionsSchema,
  type ForgejoOrganizationListOptions,
} from "./forgejoOrganizationListOptionsSchema.js"
import { forgejoOrganizationSchema, type ForgejoOrganization } from "./forgejoOrganizationSchema.js"

export async function forgejoOrganizationList(
  transport: ForgejoRestTransport,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoOrganization[]>> {
  const op = "forgejoOrganizationList"
  const parsed = a.safeParse(forgejoOrganizationListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationListOptions = parsed.output
  const response = await transport.request({
    path: options.onlyMemberOf ? "/api/v1/user/orgs" : "/api/v1/orgs",
    query: options.onlyMemberOf
      ? undefined
      : {
          ...(options.page === undefined ? {} : { page: options.page }),
          ...(options.limit === undefined ? {} : { limit: options.limit }),
        },
  })
  if (!response.success) return response
  const organizations = a.safeParse(a.array(forgejoOrganizationSchema), response.data.data)
  if (!organizations.success) return createResultError(op, a.summarize(organizations.issues))
  return createResult(organizations.output)
}
