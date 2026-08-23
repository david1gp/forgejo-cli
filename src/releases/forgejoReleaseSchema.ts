import * as a from "valibot"
import { forgejoReleaseAssetSchema } from "./assets/forgejoReleaseAssetSchema.js"

const forgejoReleaseSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  tag_name: a.optional(a.nullable(a.string())),
  target_commitish: a.optional(a.nullable(a.string())),
  name: a.optional(a.nullable(a.string())),
  body: a.optional(a.nullable(a.string())),
  draft: a.optional(a.nullable(a.boolean())),
  prerelease: a.optional(a.nullable(a.boolean())),
  created_at: a.optional(a.nullable(a.string())),
  published_at: a.optional(a.nullable(a.string())),
  html_url: a.optional(a.nullable(a.string())),
  assets: a.optional(a.nullable(a.array(forgejoReleaseAssetSchema))),
})

export { forgejoReleaseSchema }
export type ForgejoRelease = a.InferOutput<typeof forgejoReleaseSchema>
