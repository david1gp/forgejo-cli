import * as a from "valibot"

const forgejoPullRequestFilesListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  all: a.optional(a.boolean()),
})

export { forgejoPullRequestFilesListOptionsSchema }
export type ForgejoPullRequestFilesListOptions = a.InferOutput<typeof forgejoPullRequestFilesListOptionsSchema>
