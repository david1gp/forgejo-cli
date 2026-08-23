import * as a from "valibot"

const forgejoWikiCloneMetadataSchema = a.object({
  name: a.optional(a.nullable(a.string())),
  fullName: a.optional(a.nullable(a.string())),
  cloneUrl: a.optional(a.nullable(a.string())),
  sshUrl: a.optional(a.nullable(a.string())),
})

export { forgejoWikiCloneMetadataSchema }
export type ForgejoWikiCloneMetadata = a.InferOutput<typeof forgejoWikiCloneMetadataSchema>
