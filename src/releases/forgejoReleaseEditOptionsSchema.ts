import * as a from "valibot"

const forgejoReleaseEditOptionsSchema = a.object({
  tagName: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  name: a.optional(a.nullable(a.string())),
  body: a.optional(a.nullable(a.string())),
  draft: a.optional(a.boolean()),
  prerelease: a.optional(a.boolean()),
  targetCommitish: a.optional(a.string()),
  hideArchiveLinks: a.optional(a.boolean()),
})

export { forgejoReleaseEditOptionsSchema }
export type ForgejoReleaseEditOptions = a.InferOutput<typeof forgejoReleaseEditOptionsSchema>
