import * as a from "valibot"

const forgejoOrganizationRepositoryCreateOptionsSchema = a.object({
  name: a.pipe(a.string(), a.trim(), a.minLength(1)),
  description: a.optional(a.nullable(a.string())),
  private: a.optional(a.boolean()),
  autoInit: a.optional(a.boolean()),
  defaultBranch: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  gitignores: a.optional(a.nullable(a.string())),
  issueLabels: a.optional(a.nullable(a.string())),
  license: a.optional(a.nullable(a.string())),
  readme: a.optional(a.nullable(a.string())),
  template: a.optional(a.boolean()),
  trustModel: a.optional(a.nullable(a.string())),
  objectFormatName: a.optional(a.picklist(["sha1", "sha256"] as const)),
})

export { forgejoOrganizationRepositoryCreateOptionsSchema }
export type ForgejoOrganizationRepositoryCreateOptions = a.InferOutput<
  typeof forgejoOrganizationRepositoryCreateOptionsSchema
>
