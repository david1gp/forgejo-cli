import * as a from "valibot"

const forgejoPullRequestCommitsListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  all: a.optional(a.boolean()),
})

export { forgejoPullRequestCommitsListOptionsSchema }
export type ForgejoPullRequestCommitsListOptions = a.InferOutput<typeof forgejoPullRequestCommitsListOptionsSchema>
