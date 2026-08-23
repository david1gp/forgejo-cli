import * as a from "valibot"
import type { ForgejoReleaseAssetData } from "./forgejoReleaseAssetData.js"

const forgejoReleaseAssetDataSchema = a.custom<ForgejoReleaseAssetData>(
  (input) =>
    typeof input === "string" || input instanceof Blob || input instanceof ArrayBuffer || ArrayBuffer.isView(input),
  "Release asset data must be a string, Blob, ArrayBuffer, or typed array",
)

const forgejoReleaseAssetUploadOptionsSchema = a.object({
  name: a.pipe(a.string(), a.trim(), a.minLength(1)),
  data: forgejoReleaseAssetDataSchema,
  contentType: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  overwrite: a.optional(a.boolean(), false),
})

export { forgejoReleaseAssetUploadOptionsSchema }
export type ForgejoReleaseAssetUploadOptions = a.InferOutput<typeof forgejoReleaseAssetUploadOptionsSchema>
