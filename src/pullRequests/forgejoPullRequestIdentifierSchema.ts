import * as a from "valibot"
import { forgejoRepositoryIdentifierSchema } from "../repositories/forgejoRepositoryIdentifierSchema.js"

const forgejoPullRequestIdentifierSchema = a.object({
  repo: a.optional(forgejoRepositoryIdentifierSchema),
  number: a.pipe(a.number(), a.integer(), a.minValue(0), a.safeInteger()),
  parent: a.boolean(),
})

export { forgejoPullRequestIdentifierSchema }
export type ForgejoPullRequestIdentifier = a.InferOutput<typeof forgejoPullRequestIdentifierSchema>
