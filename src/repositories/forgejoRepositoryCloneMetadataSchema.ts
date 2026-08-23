import * as a from "valibot"

const forgejoRepositoryCloneMetadataSchema = a.object({
  name: a.optional(a.nullable(a.string())),
  fullName: a.optional(a.nullable(a.string())),
  htmlUrl: a.optional(a.nullable(a.string())),
  cloneUrl: a.optional(a.nullable(a.string())),
  sshUrl: a.optional(a.nullable(a.string())),
  parent: a.optional(a.nullable(a.unknown())),
})

export { forgejoRepositoryCloneMetadataSchema }
export type ForgejoRepositoryCloneMetadata = a.InferOutput<typeof forgejoRepositoryCloneMetadataSchema>
