import * as a from "valibot"

const forgejoReleaseReferenceSchema = a.union([
  a.pipe(a.number(), a.integer(), a.minValue(1)),
  a.pipe(a.string(), a.trim(), a.minLength(1)),
  a.object({ id: a.pipe(a.number(), a.integer(), a.minValue(1)) }),
  a.object({ tag: a.pipe(a.string(), a.trim(), a.minLength(1)) }),
  a.object({ name: a.pipe(a.string(), a.trim(), a.minLength(1)) }),
])

export { forgejoReleaseReferenceSchema }
export type ForgejoReleaseReference = a.InferOutput<typeof forgejoReleaseReferenceSchema>
