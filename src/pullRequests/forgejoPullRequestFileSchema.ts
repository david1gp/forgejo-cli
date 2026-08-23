import * as a from "valibot"

const forgejoPullRequestFileSchema = a.looseObject({
  sha: a.optional(a.nullable(a.string())),
  filename: a.optional(a.nullable(a.string())),
  status: a.optional(a.nullable(a.string())),
  additions: a.optional(a.nullable(a.number())),
  deletions: a.optional(a.nullable(a.number())),
  changes: a.optional(a.nullable(a.number())),
  blob_url: a.optional(a.nullable(a.string())),
  raw_url: a.optional(a.nullable(a.string())),
  contents_url: a.optional(a.nullable(a.string())),
  patch: a.optional(a.nullable(a.string())),
})

export { forgejoPullRequestFileSchema }
export type ForgejoPullRequestFile = a.InferOutput<typeof forgejoPullRequestFileSchema>
