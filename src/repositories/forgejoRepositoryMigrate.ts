import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoRepositoryMigrateOptionsSchema,
  type ForgejoRepositoryMigrateOptions,
} from "./forgejoRepositoryMigrateOptionsSchema.js"
import { forgejoRepositoryResponseParse } from "./forgejoRepositoryResponseParse.js"
import type { ForgejoRepository } from "./forgejoRepositorySchema.js"

export async function forgejoRepositoryMigrate(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoRepository>> {
  const op = "forgejoRepositoryMigrate"
  const parsed = a.safeParse(forgejoRepositoryMigrateOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryMigrateOptions = parsed.output
  const {
    include,
    service,
    repoName,
    repoOwner,
    cloneAddr,
    lfsEndpoint,
    mirrorInterval,
    authUsername,
    authPassword,
    authToken,
    ...rest
  } = options
  const body = {
    ...rest,
    clone_addr: cloneAddr,
    repo_name: repoName,
    ...(repoOwner === undefined ? {} : { repo_owner: repoOwner }),
    ...(lfsEndpoint === undefined ? {} : { lfs_endpoint: lfsEndpoint }),
    ...(mirrorInterval === undefined ? {} : { mirror_interval: mirrorInterval }),
    ...(authUsername === undefined ? {} : { auth_username: authUsername }),
    ...(authPassword === undefined ? {} : { auth_password: authPassword }),
    ...(authToken === undefined ? {} : { auth_token: authToken }),
    ...(service === undefined ? {} : { service: service === "forgejo" ? "gitea" : service }),
    ...(include?.pullRequests === undefined ? {} : { pull_requests: include.pullRequests }),
    ...(include?.lfs === undefined ? {} : { lfs: include.lfs }),
    ...(include?.wiki === undefined ? {} : { wiki: include.wiki }),
    ...(include?.issues === undefined ? {} : { issues: include.issues }),
    ...(include?.milestones === undefined ? {} : { milestones: include.milestones }),
    ...(include?.labels === undefined ? {} : { labels: include.labels }),
    ...(include?.releases === undefined ? {} : { releases: include.releases }),
  }
  const response = await transport.request({ path: "/api/v1/repos/migrate", method: "POST", body })
  if (!response.success) return response
  return forgejoRepositoryResponseParse(response.data.data, op)
}
