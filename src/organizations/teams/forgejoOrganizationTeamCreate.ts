import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationTeamCreateOptionsSchema,
  type ForgejoOrganizationTeamCreateOptions,
} from "./forgejoOrganizationTeamCreateOptionsSchema.js"
import { forgejoOrganizationPathCreate } from "../forgejoOrganizationPathCreate.js"
import { forgejoOrganizationReferenceParse } from "../forgejoOrganizationReferenceParse.js"
import { forgejoOrganizationTeamSchema, type ForgejoOrganizationTeam } from "./forgejoOrganizationTeamSchema.js"

const forgejoOrganizationTeamUnits = [
  "repo.wiki",
  "repo.ext_wiki",
  "repo.issues",
  "repo.ext_issues",
  "repo.pulls",
  "repo.projects",
  "repo.actions",
  "repo.code",
  "repo.releases",
  "repo.packages",
]

function forgejoOrganizationTeamUnitsMap(readPermissions?: string, writePermissions?: string): Record<string, string> {
  const units: Record<string, string> = {}
  const add = (permissions: string | undefined, permission: string) => {
    if (!permissions) return
    const names = permissions.trim() === "all" ? forgejoOrganizationTeamUnits : permissions.split(",")
    for (const name of names) units[`repo.${name.replace(/^repo\./, "")}`] = permission
  }
  add(readPermissions, "read")
  add(writePermissions, "write")
  return units
}

export async function forgejoOrganizationTeamCreate(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoOrganizationTeam>> {
  const op = "forgejoOrganizationTeamCreate"
  const organization = forgejoOrganizationReferenceParse(organizationInput)
  if (!organization.success) return createResultError(op, organization.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationTeamCreateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationTeamCreateOptions = parsed.output
  const response = await transport.request({
    path: `${forgejoOrganizationPathCreate(organization.data)}/teams`,
    method: "POST",
    body: {
      name: options.name,
      ...(options.description === undefined ? {} : { description: options.description }),
      ...(options.canCreateRepos === undefined ? {} : { can_create_org_repo: options.canCreateRepos }),
      ...(options.includeAllRepos === undefined ? {} : { includes_all_repositories: options.includeAllRepos }),
      ...(options.admin ? { permission: "admin" } : {}),
      units_map: forgejoOrganizationTeamUnitsMap(options.readPermissions, options.writePermissions),
    },
  })
  if (!response.success) return response
  const team = a.safeParse(forgejoOrganizationTeamSchema, response.data.data)
  if (!team.success) return createResultError(op, a.summarize(team.issues))
  return { success: true, data: team.output }
}
