import { resolve } from "node:path"
import { createResult, createResultError } from "#result"
import { forgejoConfigurationDefaultsLoad } from "./forgejoConfigurationDefaultsLoad.js"
import { forgejoConfigurationPathResolve } from "./forgejoConfigurationPathResolve.js"
import { forgejoDefaultsResolve } from "./forgejoDefaultsResolve.js"
import { forgejoDirectoryAssignmentMatchResolve } from "./forgejoDirectoryAssignmentMatchResolve.js"
import { forgejoEnvironmentDefaultsResolve, type ForgejoEnvironmentDefaults } from "./forgejoEnvironmentDefaults.js"
import { forgejoEnvironmentFileLoad } from "./forgejoEnvironmentFileLoad.js"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import {
  forgejoRepositoryContextResolve,
  type ForgejoProcessExecute,
} from "../repositories/forgejoRepositoryContextResolve.js"

type ForgejoResolvedConfigurationSource = "cli" | "environment" | ".env" | "directory" | "persisted" | "git" | "none"

type ForgejoResolvedConfigurationValue = {
  value: string | null
  source: ForgejoResolvedConfigurationSource
}

type ForgejoResolvedOrganization = ForgejoResolvedConfigurationValue & {
  personal: boolean
}

type ForgejoResolvedConfiguration = {
  cwd: string
  configurationPath: string
  environmentFilePath: string | null
  directoryAssignment: { path: string; value: string | null } | null
  defaults: {
    host: ForgejoResolvedConfigurationValue
    sshBase: ForgejoResolvedConfigurationValue
    organization: ForgejoResolvedOrganization
    remote: ForgejoResolvedConfigurationValue
  }
}

type ForgejoResolvedConfigurationResolveOptions = {
  cwd?: string
  env?: Record<string, string | undefined>
  host?: string
  execute?: ForgejoProcessExecute
}

function forgejoResolvedConfigurationEnvironmentSource(
  name: keyof ForgejoEnvironmentDefaults,
  environment: ForgejoEnvironmentDefaults,
  environmentFile: ForgejoEnvironmentDefaults,
): ForgejoResolvedConfigurationSource {
  if (environment[name] !== undefined) return "environment"
  if (environmentFile[name] !== undefined) return ".env"
  return "none"
}

function forgejoResolvedConfigurationValue(
  value: string | undefined,
  source: ForgejoResolvedConfigurationSource,
): ForgejoResolvedConfigurationValue {
  return { value: value ?? null, source: value === undefined ? "none" : source }
}

function forgejoResolvedConfigurationOrganization(
  organization: string | undefined,
  personal: boolean,
  source: ForgejoResolvedConfigurationSource,
): ForgejoResolvedOrganization {
  return { value: organization ?? null, personal, source: organization === undefined && !personal ? "none" : source }
}

export async function forgejoResolvedConfigurationResolve(
  options: ForgejoResolvedConfigurationResolveOptions = {},
): Promise<ForgejoResult<ForgejoResolvedConfiguration>> {
  const op = "forgejoResolvedConfigurationResolve"
  const cwd = resolve(options.cwd ?? process.cwd())
  const env = options.env ?? process.env
  const configurationPath = forgejoConfigurationPathResolve({ env })

  const defaults = await forgejoDefaultsResolve({ cwd, env, path: configurationPath })
  if (!defaults.success) return createResultError(op, defaults.errorMessage)
  const persisted = await forgejoConfigurationDefaultsLoad({ env, path: configurationPath })
  if (!persisted.success) return createResultError(op, persisted.errorMessage)
  const environmentFile = await forgejoEnvironmentFileLoad({ cwd })
  if (!environmentFile.success) return createResultError(op, environmentFile.errorMessage)

  const environment = forgejoEnvironmentDefaultsResolve({ env, cwd })
  const dotenv = forgejoEnvironmentDefaultsResolve({ env: environmentFile.data.values, cwd })
  const organizationEnvironmentSource = forgejoResolvedConfigurationEnvironmentSource(
    "organization",
    environment,
    dotenv,
  )
  const noOrgEnvironmentSource = forgejoResolvedConfigurationEnvironmentSource("noOrg", environment, dotenv)
  const environmentNoOrg = environment.noOrg ?? dotenv.noOrg
  const sshBaseSource = forgejoResolvedConfigurationEnvironmentSource("sshBase", environment, dotenv)
  const remoteSource = forgejoResolvedConfigurationEnvironmentSource("remote", environment, dotenv)
  const directoryAssignment = forgejoDirectoryAssignmentMatchResolve({
    assignments: persisted.data.directory_assignments,
    cwd,
  })

  const host =
    options.host !== undefined
      ? forgejoResolvedConfigurationValue(options.host, "cli")
      : defaults.data.host !== undefined
        ? forgejoResolvedConfigurationValue(
            defaults.data.host,
            forgejoResolvedConfigurationEnvironmentSource("host", environment, dotenv),
          )
        : defaults.data.fallbackHost !== undefined
          ? forgejoResolvedConfigurationValue(
              defaults.data.fallbackHost,
              forgejoResolvedConfigurationEnvironmentSource("fallbackHost", environment, dotenv),
            )
          : forgejoResolvedConfigurationValue(defaults.data.defaultHost, "persisted")

  let organization: ForgejoResolvedOrganization
  if (defaults.data.noOrg === true && noOrgEnvironmentSource !== "none") {
    organization = forgejoResolvedConfigurationOrganization(undefined, true, noOrgEnvironmentSource)
  } else if (defaults.data.organization !== undefined && organizationEnvironmentSource !== "none") {
    organization = forgejoResolvedConfigurationOrganization(
      defaults.data.organization,
      false,
      organizationEnvironmentSource,
    )
  } else if (directoryAssignment?.assignment !== null && directoryAssignment !== undefined) {
    organization = forgejoResolvedConfigurationOrganization(directoryAssignment.assignment, false, "directory")
  } else if (directoryAssignment?.assignment === null && environmentNoOrg !== false) {
    organization = forgejoResolvedConfigurationOrganization(undefined, true, "directory")
  } else {
    organization = forgejoResolvedConfigurationOrganization(persisted.data.default_org, false, "persisted")
  }

  const repositoryContext = await forgejoRepositoryContextResolve({
    cwd,
    env,
    host: options.host,
    execute: options.execute,
  })
  if (!repositoryContext.success && repositoryContext.errorMessage.includes("unique Forgejo Git remote"))
    return createResultError(op, repositoryContext.errorMessage)
  const gitContext = repositoryContext.success && repositoryContext.data.remote ? repositoryContext.data : undefined
  const gitRemoteName = gitContext?.remoteName
  const gitHostIsAuthoritative =
    gitContext !== undefined && options.host === undefined && defaults.data.host === undefined
  const resolvedRemote = gitRemoteName
    ? forgejoResolvedConfigurationValue(gitRemoteName, "git")
    : forgejoResolvedConfigurationValue(defaults.data.remote, remoteSource === "none" ? "persisted" : remoteSource)

  return createResult({
    cwd,
    configurationPath,
    environmentFilePath: environmentFile.data.path ?? null,
    directoryAssignment:
      directoryAssignment === undefined
        ? null
        : { path: directoryAssignment.path, value: directoryAssignment.assignment },
    defaults: {
      host: gitHostIsAuthoritative ? forgejoResolvedConfigurationValue(gitContext.host, "git") : host,
      sshBase: forgejoResolvedConfigurationValue(
        defaults.data.sshBase,
        sshBaseSource === "none" ? "persisted" : sshBaseSource,
      ),
      organization,
      remote: resolvedRemote,
    },
  })
}

export type {
  ForgejoResolvedConfiguration,
  ForgejoResolvedConfigurationResolveOptions,
  ForgejoResolvedConfigurationSource,
  ForgejoResolvedConfigurationValue,
}
