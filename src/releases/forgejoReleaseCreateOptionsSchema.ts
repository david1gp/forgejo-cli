import * as a from "valibot"

const forgejoReleaseCreateOptionsSchema = a.object({
  tagName: a.pipe(a.string(), a.trim(), a.minLength(1)),
  name: a.optional(a.string()),
  body: a.optional(a.nullable(a.string())),
  draft: a.optional(a.boolean(), false),
  prerelease: a.optional(a.boolean(), false),
  targetCommitish: a.optional(a.string()),
  hideArchiveLinks: a.optional(a.boolean()),
})

export { forgejoReleaseCreateOptionsSchema }
export type ForgejoReleaseCreateOptions = a.InferOutput<typeof forgejoReleaseCreateOptionsSchema>
