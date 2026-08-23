import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoRepositoryUnitsEditOptionsSchema,
  type ForgejoRepositoryUnitsEditOptions,
} from "./forgejoRepositoryUnitsEditOptionsSchema.js"
import { forgejoRepositoryPathCreate } from "./forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"
import { forgejoRepositoryResponseParse } from "./forgejoRepositoryResponseParse.js"
import type { ForgejoRepository } from "./forgejoRepositorySchema.js"

export async function forgejoRepositoryUnitsEdit(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoRepository>> {
  const op = "forgejoRepositoryUnitsEdit"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoRepositoryUnitsEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryUnitsEditOptions = parsed.output
  const body: Record<string, unknown> = {}
  const set = (key: string, value: unknown): void => {
    if (value !== undefined) body[key] = value
  }
  set("has_issues", options.hasIssues ?? options.issues)
  set("has_pull_requests", options.hasPullRequests ?? options.pullRequests)
  set("has_actions", options.hasActions ?? options.actions)
  set("has_wiki", options.hasWiki ?? options.wiki)
  set("has_packages", options.hasPackages ?? options.packages)
  set("has_projects", options.hasProjects ?? options.projects)
  set("has_releases", options.hasReleases ?? options.releases)
  set("wiki_branch", options.wikiBranch)
  if (options.externalWikiUrl !== undefined) {
    body.external_wiki = { external_wiki_url: options.externalWikiUrl }
  }
  set("globally_editable_wiki", options.globallyEditableWiki)
  set("allow_fast_forward_only_merge", options.allowFastForwardOnlyMerge)
  set("allow_manual_merge", options.allowManualMerge)
  set("allow_merge_commits", options.allowMergeCommits)
  set("allow_rebase", options.allowRebase)
  set("allow_rebase_explicit", options.allowRebaseExplicit)
  set("allow_rebase_update", options.allowRebaseUpdate)
  set("allow_squash_merge", options.allowSquashMerge)
  set("autodetect_manual_merge", options.autodetectManualMerge)
  set("default_allow_maintainer_edit", options.defaultAllowMaintainerEdit)
  set("default_delete_branch_after_merge", options.defaultDeleteBranchAfterMerge)
  set("default_merge_style", options.defaultMergeStyle)
  set("default_update_style", options.defaultUpdateStyle)
  set("ignore_whitespace_conflicts", options.ignoreWhitespaceConflicts)
  const response = await transport.request({
    path: forgejoRepositoryPathCreate(repository.data),
    method: "PATCH",
    body,
  })
  if (!response.success) return response
  return forgejoRepositoryResponseParse(response.data.data, op)
}
