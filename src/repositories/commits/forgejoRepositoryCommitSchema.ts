import * as a from "valibot"

const forgejoRepositoryCommitSchema = a.looseObject({
  sha: a.optional(a.nullable(a.string())),
  url: a.optional(a.nullable(a.string())),
  html_url: a.optional(a.nullable(a.string())),
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
})

export { forgejoRepositoryCommitSchema }
export type ForgejoRepositoryCommit = a.InferOutput<typeof forgejoRepositoryCommitSchema>
