import * as a from "valibot"

const forgejoPullRequestEditOptionsSchema = a.object({
  title: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  body: a.optional(a.nullable(a.string())),
  state: a.optional(a.picklist(["open", "closed"] as const)),
  assignees: a.optional(a.array(a.string())),
})

export { forgejoPullRequestEditOptionsSchema }
export type ForgejoPullRequestEditOptions = a.InferOutput<typeof forgejoPullRequestEditOptionsSchema>
