import * as a from "valibot"

const forgejoReleaseAssetSchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  name: a.optional(a.nullable(a.string())),
  size: a.optional(a.nullable(a.number())),
  download_count: a.optional(a.nullable(a.number())),
  created_at: a.optional(a.nullable(a.string())),
  updated_at: a.optional(a.nullable(a.string())),
  browser_download_url: a.optional(a.nullable(a.string())),
  uploader: a.optional(a.nullable(a.unknown())),
  content_type: a.optional(a.nullable(a.string())),
})

export { forgejoReleaseAssetSchema }
export type ForgejoReleaseAsset = a.InferOutput<typeof forgejoReleaseAssetSchema>
