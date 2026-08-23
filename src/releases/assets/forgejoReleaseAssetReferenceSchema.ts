import * as a from "valibot"

const forgejoReleaseAssetReferenceSchema = a.union([
  a.pipe(a.number(), a.integer(), a.minValue(1)),
  a.pipe(a.string(), a.trim(), a.minLength(1)),
  a.object({ id: a.pipe(a.number(), a.integer(), a.minValue(1)) }),
  a.object({ name: a.pipe(a.string(), a.trim(), a.minLength(1)) }),
])

export { forgejoReleaseAssetReferenceSchema }
export type ForgejoReleaseAssetReference = a.InferOutput<typeof forgejoReleaseAssetReferenceSchema>
