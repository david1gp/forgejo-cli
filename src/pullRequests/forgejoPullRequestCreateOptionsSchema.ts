import * as a from "valibot"

const forgejoPullRequestCreateOptionsSchema = a.object({
  title: a.pipe(a.string(), a.trim(), a.minLength(1)),
  body: a.optional(a.nullable(a.string())),
  base: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  head: a.pipe(a.string(), a.trim(), a.minLength(1)),
})

export { forgejoPullRequestCreateOptionsSchema }
export type ForgejoPullRequestCreateOptions = a.InferOutput<typeof forgejoPullRequestCreateOptionsSchema>
