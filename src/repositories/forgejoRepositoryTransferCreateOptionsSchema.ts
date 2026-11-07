import * as a from "valibot"

const forgejoRepositoryTransferCreateOptionsSchema = a.object({
  newOwner: a.pipe(a.string(), a.trim(), a.minLength(1)),
  teamIds: a.optional(a.array(a.pipe(a.number(), a.integer(), a.minValue(1)))),
})

export { forgejoRepositoryTransferCreateOptionsSchema }
export type ForgejoRepositoryTransferCreateOptions = a.InferOutput<typeof forgejoRepositoryTransferCreateOptionsSchema>
