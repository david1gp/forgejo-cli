import { createResult, createResultError } from "#result"
import { forgejoOrganizationActivityList } from "../organizations/forgejoOrganizationActivityList.js"
import { forgejoOrganizationCreate } from "../organizations/forgejoOrganizationCreate.js"
import { forgejoOrganizationEdit } from "../organizations/forgejoOrganizationEdit.js"
import { forgejoOrganizationGet } from "../organizations/forgejoOrganizationGet.js"
import { forgejoOrganizationLabelCreate } from "../organizations/forgejoOrganizationLabelCreate.js"
import { forgejoOrganizationLabelDelete } from "../organizations/forgejoOrganizationLabelDelete.js"
import { forgejoOrganizationLabelEdit } from "../organizations/forgejoOrganizationLabelEdit.js"
import { forgejoOrganizationLabelsList } from "../organizations/forgejoOrganizationLabelsList.js"
import { forgejoOrganizationList } from "../organizations/forgejoOrganizationList.js"
import { forgejoOrganizationMemberVisibilityGet } from "../organizations/forgejoOrganizationMemberVisibilityGet.js"
import { forgejoOrganizationMemberVisibilitySet } from "../organizations/forgejoOrganizationMemberVisibilitySet.js"
import { forgejoOrganizationMembersList } from "../organizations/forgejoOrganizationMembersList.js"
import { forgejoOrganizationRepositoriesList } from "../organizations/forgejoOrganizationRepositoriesList.js"
import { forgejoOrganizationRepositoryCreate } from "../organizations/forgejoOrganizationRepositoryCreate.js"
import { forgejoOrganizationTeamCreate } from "../organizations/forgejoOrganizationTeamCreate.js"
import { forgejoOrganizationTeamDelete } from "../organizations/forgejoOrganizationTeamDelete.js"
import { forgejoOrganizationTeamEdit } from "../organizations/forgejoOrganizationTeamEdit.js"
import { forgejoOrganizationTeamGet } from "../organizations/forgejoOrganizationTeamGet.js"
import { forgejoOrganizationTeamMemberAdd } from "../organizations/forgejoOrganizationTeamMemberAdd.js"
import { forgejoOrganizationTeamMemberRemove } from "../organizations/forgejoOrganizationTeamMemberRemove.js"
import { forgejoOrganizationTeamMembersList } from "../organizations/forgejoOrganizationTeamMembersList.js"
import { forgejoOrganizationTeamRepositoryAdd } from "../organizations/forgejoOrganizationTeamRepositoryAdd.js"
import { forgejoOrganizationTeamRepositoryRemove } from "../organizations/forgejoOrganizationTeamRepositoryRemove.js"
import { forgejoOrganizationTeamRepositoriesList } from "../organizations/forgejoOrganizationTeamRepositoriesList.js"
import { forgejoOrganizationTeamsList } from "../organizations/forgejoOrganizationTeamsList.js"
import { forgejoUserCurrentGet } from "../users/forgejoUserCurrentGet.js"
import type { ForgejoCliInvocation } from "./forgejoCliParse.js"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoCliHostClient } from "./forgejoCliHostClient.js"
import type { ForgejoCliRunOptions } from "./forgejoCliRunOptions.js"
import { forgejoCliResourceOutput } from "./forgejoCliResourceOutput.js"

type ForgejoCliOrganizationInvocation = Extract<ForgejoCliInvocation, { kind: `org-${string}` }>
type ForgejoCliOrganizationRunOptions = ForgejoCliRunOptions & { env: Record<string, string | undefined> }

function forgejoCliOrganizationOutput(
  value: unknown,
  invocation: ForgejoCliOrganizationInvocation,
  options: ForgejoCliOrganizationRunOptions,
) {
  return forgejoCliResourceOutput(value, {
    json: invocation.json,
    style: invocation.style,
    outputWrite: options.outputWrite,
  })
}

function forgejoCliOrganizationNameIsValid(name: string): boolean {
  return /^[A-Za-z0-9](?:[A-Za-z0-9]|[-_.](?=[A-Za-z0-9]))*$/.test(name)
}

async function forgejoCliOrganizationConfirm(
  message: string,
  yes: boolean,
  options: ForgejoCliOrganizationRunOptions,
): Promise<ForgejoResult<boolean>> {
  if (yes) return createResult(true)
  if (options.confirm) return createResult(await options.confirm(message))
  if (!options.stdinRead && !process.stdin.isTTY)
    return createResultError("forgejoCliOrganizationRun", "Confirmation is required; use --yes or --force")
  const prompt = options.promptWrite
    ? options.promptWrite(`${message} [y/N] `)
    : (() => {
        try {
          process.stderr.write(`${message} [y/N] `)
          return createResult(null)
        } catch {
          return createResultError("forgejoCliOrganizationRun", "Unable to write confirmation prompt")
        }
      })()
  if (!prompt.success) return prompt
  const input = options.stdinRead
    ? await options.stdinRead()
    : await new Promise<ForgejoResult<string>>((resolve) => {
        process.stdin.once("data", (data) => resolve(createResult(String(data))))
      })
  if (!input.success) return createResultError("forgejoCliOrganizationRun", input.errorMessage)
  return createResult(/^y(es)?$/i.test(input.data.trim()))
}

async function forgejoCliOrganizationRun(
  invocation: ForgejoCliOrganizationInvocation,
  options: ForgejoCliOrganizationRunOptions,
) {
  const host = await forgejoCliHostClient({
    ...options,
    host: invocation.host,
    remote: invocation.remote,
    cwd: invocation.cwd,
  })
  if (!host.success) return host
  const transport = host.data.client.transport
  if (invocation.kind === "org-list") {
    const organizations = await forgejoOrganizationList(transport, {
      page: invocation.page,
      limit: 20,
      onlyMemberOf: invocation.onlyMemberOf,
    })
    if (!organizations.success) return createResultError("forgejoCliOrganizationRun", organizations.errorMessage)
    return forgejoCliOrganizationOutput(organizations.data, invocation, options)
  }
  if (invocation.kind === "org-view") {
    const organization = await forgejoOrganizationGet(transport, invocation.organization)
    if (!organization.success) return createResultError("forgejoCliOrganizationRun", organization.errorMessage)
    return forgejoCliOrganizationOutput(organization.data, invocation, options)
  }
  if (invocation.kind === "org-create") {
    if (!forgejoCliOrganizationNameIsValid(invocation.organization))
      return createResultError("forgejoCliOrganizationRun", "Organization names must use single punctuation separators")
    const organization = await forgejoOrganizationCreate(transport, {
      name: invocation.organization,
      ...invocation.options,
    })
    if (!organization.success) return createResultError("forgejoCliOrganizationRun", organization.errorMessage)
    return forgejoCliOrganizationOutput(organization.data, invocation, options)
  }
  if (invocation.kind === "org-edit") {
    const organization = await forgejoOrganizationEdit(transport, invocation.organization, invocation.options)
    if (!organization.success) return createResultError("forgejoCliOrganizationRun", organization.errorMessage)
    return forgejoCliOrganizationOutput(organization.data, invocation, options)
  }
  if (invocation.kind === "org-activity") {
    const activity = await forgejoOrganizationActivityList(transport, invocation.organization)
    if (!activity.success) return createResultError("forgejoCliOrganizationRun", activity.errorMessage)
    return forgejoCliOrganizationOutput(activity.data, invocation, options)
  }
  if (invocation.kind === "org-members") {
    let members = await forgejoOrganizationMembersList(transport, invocation.organization, {
      page: invocation.page,
      limit: 20,
    })
    if (!members.success && (members.code === "forgejo.forbidden" || members.code === "forgejo.not-found"))
      members = await forgejoOrganizationMembersList(transport, invocation.organization, {
        page: invocation.page,
        limit: 20,
        publicOnly: true,
      })
    if (!members.success) return createResultError("forgejoCliOrganizationRun", members.errorMessage)
    return forgejoCliOrganizationOutput(members.data, invocation, options)
  }
  if (invocation.kind === "org-visibility") {
    const current = await forgejoUserCurrentGet(transport)
    if (!current.success) return createResultError("forgejoCliOrganizationRun", current.errorMessage)
    const username = current.data.login ?? current.data.username
    if (!username) return createResultError("forgejoCliOrganizationRun", "Current user has no username")
    if (invocation.visibility === undefined) {
      const visibility = await forgejoOrganizationMemberVisibilityGet(transport, invocation.organization, username)
      if (!visibility.success) return createResultError("forgejoCliOrganizationRun", visibility.errorMessage)
      return forgejoCliOrganizationOutput(
        { organization: invocation.organization, username, visibility: visibility.data },
        invocation,
        options,
      )
    }
    const changed = await forgejoOrganizationMemberVisibilitySet(transport, invocation.organization, username, {
      visibility: invocation.visibility,
    })
    if (!changed.success) return createResultError("forgejoCliOrganizationRun", changed.errorMessage)
    return forgejoCliOrganizationOutput(
      { organization: invocation.organization, username, visibility: invocation.visibility },
      invocation,
      options,
    )
  }
  if (invocation.kind === "org-team-list") {
    const teams = await forgejoOrganizationTeamsList(transport, invocation.organization)
    if (!teams.success) return createResultError("forgejoCliOrganizationRun", teams.errorMessage)
    return forgejoCliOrganizationOutput(teams.data, invocation, options)
  }
  if (invocation.kind === "org-team-view") {
    const team = await forgejoOrganizationTeamGet(transport, invocation.organization, invocation.team)
    if (!team.success) return createResultError("forgejoCliOrganizationRun", team.errorMessage)
    if (invocation.listPermissions && team.data.units_map)
      return forgejoCliOrganizationOutput({ ...team.data, permissions: team.data.units_map }, invocation, options)
    return forgejoCliOrganizationOutput(team.data, invocation, options)
  }
  if (invocation.kind === "org-team-create") {
    const team = await forgejoOrganizationTeamCreate(transport, invocation.organization, {
      name: invocation.team ?? "",
      ...invocation.options,
    })
    if (!team.success) return createResultError("forgejoCliOrganizationRun", team.errorMessage)
    return forgejoCliOrganizationOutput(team.data, invocation, options)
  }
  if (invocation.kind === "org-team-edit") {
    const team = await forgejoOrganizationTeamEdit(
      transport,
      invocation.organization,
      invocation.team,
      invocation.options,
    )
    if (!team.success) return createResultError("forgejoCliOrganizationRun", team.errorMessage)
    return forgejoCliOrganizationOutput(team.data, invocation, options)
  }
  if (invocation.kind === "org-team-delete") {
    const confirmation = await forgejoCliOrganizationConfirm(
      `Delete team ${invocation.organization}/${invocation.team}?`,
      invocation.yes === true,
      options,
    )
    if (!confirmation.success) return confirmation
    if (!confirmation.data) return forgejoCliOrganizationOutput({ cancelled: true }, invocation, options)
    const deleted = await forgejoOrganizationTeamDelete(transport, invocation.organization, invocation.team)
    if (!deleted.success) return createResultError("forgejoCliOrganizationRun", deleted.errorMessage)
    return forgejoCliOrganizationOutput({ deleted: true, team: invocation.team }, invocation, options)
  }
  if (invocation.kind === "org-team-repo-list") {
    const repositories = await forgejoOrganizationTeamRepositoriesList(
      transport,
      invocation.organization,
      invocation.team,
      { page: invocation.page, limit: 20 },
    )
    if (!repositories.success) return createResultError("forgejoCliOrganizationRun", repositories.errorMessage)
    return forgejoCliOrganizationOutput(repositories.data, invocation, options)
  }
  if (invocation.kind === "org-team-repo-add" || invocation.kind === "org-team-repo-rm") {
    if (invocation.kind === "org-team-repo-rm") {
      const confirmation = await forgejoCliOrganizationConfirm(
        `Remove repository ${invocation.organization}/${invocation.repository} from team ${invocation.team}?`,
        invocation.yes === true,
        options,
      )
      if (!confirmation.success) return confirmation
      if (!confirmation.data) return forgejoCliOrganizationOutput({ cancelled: true }, invocation, options)
    }
    const changed =
      invocation.kind === "org-team-repo-add"
        ? await forgejoOrganizationTeamRepositoryAdd(
            transport,
            invocation.organization,
            invocation.team,
            invocation.repository,
          )
        : await forgejoOrganizationTeamRepositoryRemove(
            transport,
            invocation.organization,
            invocation.team,
            invocation.repository,
          )
    if (!changed.success) return createResultError("forgejoCliOrganizationRun", changed.errorMessage)
    return forgejoCliOrganizationOutput(
      {
        changed: true,
        organization: invocation.organization,
        team: invocation.team,
        repository: invocation.repository,
      },
      invocation,
      options,
    )
  }
  if (invocation.kind === "org-team-member-list") {
    const members = await forgejoOrganizationTeamMembersList(transport, invocation.organization, invocation.team, {
      page: invocation.page,
      limit: 20,
    })
    if (!members.success) return createResultError("forgejoCliOrganizationRun", members.errorMessage)
    return forgejoCliOrganizationOutput(members.data, invocation, options)
  }
  if (invocation.kind === "org-team-member-add" || invocation.kind === "org-team-member-rm") {
    if (invocation.kind === "org-team-member-rm") {
      const confirmation = await forgejoCliOrganizationConfirm(
        `Remove member ${invocation.user} from team ${invocation.team}?`,
        invocation.yes === true,
        options,
      )
      if (!confirmation.success) return confirmation
      if (!confirmation.data) return forgejoCliOrganizationOutput({ cancelled: true }, invocation, options)
    }
    const changed =
      invocation.kind === "org-team-member-add"
        ? await forgejoOrganizationTeamMemberAdd(transport, invocation.organization, invocation.team, invocation.user)
        : await forgejoOrganizationTeamMemberRemove(
            transport,
            invocation.organization,
            invocation.team,
            invocation.user,
          )
    if (!changed.success) return createResultError("forgejoCliOrganizationRun", changed.errorMessage)
    return forgejoCliOrganizationOutput(
      { changed: true, organization: invocation.organization, team: invocation.team, user: invocation.user },
      invocation,
      options,
    )
  }
  if (invocation.kind === "org-label-list") {
    const labels = await forgejoOrganizationLabelsList(transport, invocation.organization)
    if (!labels.success) return createResultError("forgejoCliOrganizationRun", labels.errorMessage)
    return forgejoCliOrganizationOutput(labels.data, invocation, options)
  }
  if (invocation.kind === "org-label-add") {
    const label = await forgejoOrganizationLabelCreate(transport, invocation.organization, {
      name: invocation.label ?? "",
      ...(invocation.options ?? {}),
    })
    if (!label.success) return createResultError("forgejoCliOrganizationRun", label.errorMessage)
    return forgejoCliOrganizationOutput(label.data, invocation, options)
  }
  if (invocation.kind === "org-label-edit") {
    const label = await forgejoOrganizationLabelEdit(
      transport,
      invocation.organization,
      invocation.label,
      invocation.options ?? {},
    )
    if (!label.success) return createResultError("forgejoCliOrganizationRun", label.errorMessage)
    return forgejoCliOrganizationOutput(label.data, invocation, options)
  }
  if (invocation.kind === "org-label-rm") {
    const confirmation = await forgejoCliOrganizationConfirm(
      `Delete label ${invocation.organization}/${invocation.label}?`,
      invocation.yes === true,
      options,
    )
    if (!confirmation.success) return confirmation
    if (!confirmation.data) return forgejoCliOrganizationOutput({ cancelled: true }, invocation, options)
    const deleted = await forgejoOrganizationLabelDelete(transport, invocation.organization, invocation.label)
    if (!deleted.success) return createResultError("forgejoCliOrganizationRun", deleted.errorMessage)
    return forgejoCliOrganizationOutput({ deleted: true, label: invocation.label }, invocation, options)
  }
  if (invocation.kind === "org-repo-list") {
    const repositories = await forgejoOrganizationRepositoriesList(transport, invocation.organization, {
      page: invocation.page,
      limit: 20,
    })
    if (!repositories.success) return createResultError("forgejoCliOrganizationRun", repositories.errorMessage)
    return forgejoCliOrganizationOutput(repositories.data, invocation, options)
  }
  if (invocation.kind !== "org-repo-create")
    return createResultError("forgejoCliOrganizationRun", `Unsupported command '${invocation.kind}'`)
  const repository = await forgejoOrganizationRepositoryCreate(transport, invocation.organization, {
    name: invocation.name,
    ...invocation.options,
  })
  if (!repository.success) return createResultError("forgejoCliOrganizationRun", repository.errorMessage)
  return forgejoCliOrganizationOutput(repository.data, invocation, options)
}

export { forgejoCliOrganizationRun }
