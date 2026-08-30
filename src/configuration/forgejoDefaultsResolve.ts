import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import {
  forgejoConfigurationDefaultsLoad,
  type ForgejoConfigurationDefaultsLoadOptions,
} from "./forgejoConfigurationDefaultsLoad.js"
import { forgejoDirectoryAssignmentResolve } from "./forgejoDirectoryAssignmentResolve.js"
import { forgejoEnvironmentDefaultsLoad } from "./forgejoEnvironmentDefaultsLoad.js"
import type { ForgejoEnvironmentDefaults } from "./forgejoEnvironmentDefaults.js"

type ForgejoDefaults = ForgejoEnvironmentDefaults & {
  defaultHost?: string
  noOrg?: boolean
}

type ForgejoDefaultsResolveOptions = ForgejoConfigurationDefaultsLoadOptions & {
  cwd?: string
}

export async function forgejoDefaultsResolve(
  options: ForgejoDefaultsResolveOptions = {},
): Promise<ForgejoResult<ForgejoDefaults>> {
  const cwd = options.cwd ?? process.cwd()
  const environmentDefaults = await forgejoEnvironmentDefaultsLoad({ env: options.env, cwd })
  if (!environmentDefaults.success) return createResultError("forgejoDefaultsResolve", environmentDefaults.errorMessage)
  const configurationDefaults = await forgejoConfigurationDefaultsLoad(options)
  if (!configurationDefaults.success) return configurationDefaults

  const persisted = configurationDefaults.data
  const directoryAssignment = forgejoDirectoryAssignmentResolve({
    assignments: persisted.directory_assignments,
    cwd,
  })
  const organization =
    environmentDefaults.data.noOrg === true
      ? { noOrg: true as const }
      : environmentDefaults.data.organization !== undefined
        ? { organization: environmentDefaults.data.organization }
        : directoryAssignment?.organization !== undefined
          ? { organization: directoryAssignment.organization }
          : directoryAssignment?.noOrg === true && environmentDefaults.data.noOrg !== false
            ? { noOrg: true as const }
            : persisted.default_org !== undefined
              ? { organization: persisted.default_org }
              : {}
  const {
    organization: _environmentOrganization,
    noOrg: environmentNoOrg,
    ...environmentValues
  } = environmentDefaults.data
  const defaults: ForgejoDefaults = {
    ...environmentValues,
    ...(environmentNoOrg !== undefined ? { noOrg: environmentNoOrg } : {}),
    ...(persisted.default_host !== undefined ? { defaultHost: persisted.default_host } : {}),
    ...(environmentDefaults.data.sshBase === undefined && persisted.ssh_base !== undefined
      ? { sshBase: persisted.ssh_base }
      : {}),
    ...organization,
    ...(environmentDefaults.data.remote === undefined && persisted.default_remote !== undefined
      ? { remote: persisted.default_remote }
      : {}),
  }
  return createResult(defaults)
}

export type { ForgejoDefaults, ForgejoDefaultsResolveOptions }
