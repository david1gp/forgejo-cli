import * as a from "valibot"

const forgejoPullRequestNumberSchema = a.object({
  number: a.pipe(a.number(), a.integer(), a.minValue(0), a.safeInteger()),
  parent: a.boolean(),
})

export { forgejoPullRequestNumberSchema }
export type ForgejoPullRequestNumber = a.InferOutput<typeof forgejoPullRequestNumberSchema>
