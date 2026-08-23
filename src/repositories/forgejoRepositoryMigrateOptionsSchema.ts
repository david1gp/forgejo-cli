import * as a from "valibot"

const forgejoRepositoryMigrateIncludeSchema = a.object({
  lfs: a.optional(a.boolean()),
  wiki: a.optional(a.boolean()),
  issues: a.optional(a.boolean()),
  pullRequests: a.optional(a.boolean()),
  milestones: a.optional(a.boolean()),
  labels: a.optional(a.boolean()),
  releases: a.optional(a.boolean()),
})

const forgejoRepositoryMigrateOptionsSchema = a.object({
  cloneAddr: a.pipe(a.string(), a.trim(), a.minLength(1)),
  repoName: a.pipe(a.string(), a.trim(), a.minLength(1)),
  repoOwner: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  description: a.optional(a.nullable(a.string())),
  mirror: a.optional(a.boolean()),
  private: a.optional(a.boolean()),
  include: a.optional(forgejoRepositoryMigrateIncludeSchema),
  lfsEndpoint: a.optional(a.nullable(a.string())),
  mirrorInterval: a.optional(a.nullable(a.string())),
  service: a.optional(
    a.picklist(["git", "github", "gitlab", "forgejo", "gitea", "gogs", "onedev", "gitbucket", "codebase"] as const),
  ),
  authUsername: a.optional(a.nullable(a.string())),
  authPassword: a.optional(a.nullable(a.string())),
  authToken: a.optional(a.nullable(a.string())),
})

export { forgejoRepositoryMigrateOptionsSchema }
export type ForgejoRepositoryMigrateOptions = a.InferOutput<typeof forgejoRepositoryMigrateOptionsSchema>
