import * as a from "valibot"

const forgejoRepositoryUnitsEditOptionsSchema = a.object({
  issues: a.optional(a.boolean()),
  pullRequests: a.optional(a.boolean()),
  actions: a.optional(a.boolean()),
  wiki: a.optional(a.boolean()),
  packages: a.optional(a.boolean()),
  projects: a.optional(a.boolean()),
  releases: a.optional(a.boolean()),
  hasIssues: a.optional(a.boolean()),
  hasPullRequests: a.optional(a.boolean()),
  hasActions: a.optional(a.boolean()),
  hasWiki: a.optional(a.boolean()),
  hasPackages: a.optional(a.boolean()),
  hasProjects: a.optional(a.boolean()),
  hasReleases: a.optional(a.boolean()),
  wikiBranch: a.optional(a.nullable(a.string())),
  externalWikiUrl: a.optional(a.string()),
  globallyEditableWiki: a.optional(a.boolean()),
  allowFastForwardOnlyMerge: a.optional(a.boolean()),
  allowManualMerge: a.optional(a.boolean()),
  allowMergeCommits: a.optional(a.boolean()),
  allowRebase: a.optional(a.boolean()),
  allowRebaseExplicit: a.optional(a.boolean()),
  allowRebaseUpdate: a.optional(a.boolean()),
  allowSquashMerge: a.optional(a.boolean()),
  autodetectManualMerge: a.optional(a.boolean()),
  defaultAllowMaintainerEdit: a.optional(a.boolean()),
  defaultDeleteBranchAfterMerge: a.optional(a.boolean()),
  defaultMergeStyle: a.optional(
    a.picklist(["merge", "rebase", "rebase-merge", "squash", "fast-forward-only"] as const),
  ),
  defaultUpdateStyle: a.optional(a.picklist(["rebase", "merge"] as const)),
  ignoreWhitespaceConflicts: a.optional(a.boolean()),
})

export { forgejoRepositoryUnitsEditOptionsSchema }
export type ForgejoRepositoryUnitsEditOptions = a.InferOutput<typeof forgejoRepositoryUnitsEditOptionsSchema>
