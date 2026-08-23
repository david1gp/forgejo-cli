import { createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoOrganizationTeamEditOptionsSchema,
  type ForgejoOrganizationTeamEditOptions,
} from "./forgejoOrganizationTeamEditOptionsSchema.js"
import { forgejoOrganizationTeamIdResolve } from "./forgejoOrganizationTeamIdResolve.js"
import { forgejoOrganizationTeamSchema, type ForgejoOrganizationTeam } from "./forgejoOrganizationTeamSchema.js"

export async function forgejoOrganizationTeamEdit(
  transport: ForgejoRestTransport,
  organizationInput: unknown,
  teamInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoOrganizationTeam>> {
  const op = "forgejoOrganizationTeamEdit"
  const team = await forgejoOrganizationTeamIdResolve(transport, organizationInput, teamInput)
  if (!team.success) return createResultError(op, team.errorMessage)
  const parsed = a.safeParse(forgejoOrganizationTeamEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoOrganizationTeamEditOptions = parsed.output
  const unitsMap = forgejoOrganizationTeamUnitsMap(options.readPermissions, options.writePermissions)
  const response = await transport.request({
    path: `/api/v1/teams/${team.data}`,
    method: "PATCH",
    body: {
      ...(options.newName === undefined ? {} : { name: options.newName }),
      ...(options.description === undefined ? {} : { description: options.description }),
      ...(options.canCreateRepos === undefined ? {} : { can_create_org_repo: options.canCreateRepos }),
      ...(options.includeAllRepos === undefined ? {} : { includes_all_repositories: options.includeAllRepos }),
      ...(options.admin === true ? { permission: "admin" } : {}),
      ...(Object.keys(unitsMap).length === 0 ? {} : { units_map: unitsMap }),
    },
  })
  if (!response.success) return response
  const edited = a.safeParse(forgejoOrganizationTeamSchema, response.data.data)
  if (!edited.success) return createResultError(op, a.summarize(edited.issues))
  return { success: true, data: edited.output }
}

function forgejoOrganizationTeamUnitsMap(readPermissions?: string, writePermissions?: string): Record<string, string> {
  const all = [
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
  const units: Record<string, string> = {}
  const add = (permissions: string | undefined, permission: string) => {
    if (!permissions?.trim()) return
    const names = permissions.trim() === "all" ? all : permissions.split(",")
    for (const name of names) units[`repo.${name.replace(/^repo\./, "")}`] = permission
  }
  add(readPermissions, "read")
  add(writePermissions, "write")
  return units
}
