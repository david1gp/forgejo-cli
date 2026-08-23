import * as a from "valibot"

const forgejoPullRequestCommitSchema = a.looseObject({
  sha: a.optional(a.nullable(a.string())),
  created: a.optional(a.nullable(a.string())),
  created_at: a.optional(a.nullable(a.string())),
  commit: a.optional(
    a.nullable(
      a.looseObject({
        message: a.optional(a.nullable(a.string())),
        author: a.optional(
          a.nullable(
            a.looseObject({
              name: a.optional(a.nullable(a.string())),
              email: a.optional(a.nullable(a.string())),
              date: a.optional(a.nullable(a.string())),
            }),
          ),
        ),
      }),
    ),
  ),
  stats: a.optional(
    a.nullable(
      a.looseObject({
        total: a.optional(a.nullable(a.number())),
        additions: a.optional(a.nullable(a.number())),
        deletions: a.optional(a.nullable(a.number())),
      }),
    ),
  ),
})

export { forgejoPullRequestCommitSchema }
export type ForgejoPullRequestCommit = a.InferOutput<typeof forgejoPullRequestCommitSchema>
