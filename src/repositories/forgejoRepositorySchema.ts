import * as a from "valibot"

const forgejoRepositoryOwnerSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  login: a.optional(a.nullable(a.string())),
  username: a.optional(a.nullable(a.string())),
})

const forgejoRepositorySchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  owner: a.optional(a.nullable(forgejoRepositoryOwnerSchema)),
  name: a.optional(a.nullable(a.string())),
  full_name: a.optional(a.nullable(a.string())),
  description: a.optional(a.nullable(a.string())),
  html_url: a.optional(a.nullable(a.string())),
  clone_url: a.optional(a.nullable(a.string())),
  ssh_url: a.optional(a.nullable(a.string())),
  website: a.optional(a.nullable(a.string())),
  default_branch: a.optional(a.nullable(a.string())),
  private: a.optional(a.nullable(a.boolean())),
  archived: a.optional(a.nullable(a.boolean())),
  mirror: a.optional(a.nullable(a.boolean())),
  template: a.optional(a.nullable(a.boolean())),
  stars_count: a.optional(a.nullable(a.number())),
  watchers_count: a.optional(a.nullable(a.number())),
  forks_count: a.optional(a.nullable(a.number())),
  open_issues_count: a.optional(a.nullable(a.number())),
  open_pr_counter: a.optional(a.nullable(a.number())),
  release_counter: a.optional(a.nullable(a.number())),
  has_issues: a.optional(a.nullable(a.boolean())),
  has_pull_requests: a.optional(a.nullable(a.boolean())),
  has_actions: a.optional(a.nullable(a.boolean())),
  has_packages: a.optional(a.nullable(a.boolean())),
  has_projects: a.optional(a.nullable(a.boolean())),
  has_releases: a.optional(a.nullable(a.boolean())),
  has_wiki: a.optional(a.nullable(a.boolean())),
  parent: a.optional(a.nullable(a.unknown())),
})

export { forgejoRepositorySchema }
export type ForgejoRepository = a.InferOutput<typeof forgejoRepositorySchema>
