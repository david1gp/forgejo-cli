import * as a from "valibot"

const forgejoPullRequestReviewsListOptionsSchema = a.object({
  includeStale: a.optional(a.boolean()),
  all: a.optional(a.boolean()),
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
})

export { forgejoPullRequestReviewsListOptionsSchema }
export type ForgejoPullRequestReviewsListOptions = a.InferOutput<typeof forgejoPullRequestReviewsListOptionsSchema>
