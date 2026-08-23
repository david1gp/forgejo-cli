import * as a from "valibot"
import { forgejoRepositoryIdentifierSchema } from "../repositories/forgejoRepositoryIdentifierSchema.js"

const forgejoIssueNumberSchema = a.pipe(
  a.number(),
  a.integer(),
  a.minValue(0),
  a.safeInteger("Issue number must be a safe integer"),
)

const forgejoIssueIdentifierSchema = a.object({
  repo: a.optional(forgejoRepositoryIdentifierSchema),
  number: forgejoIssueNumberSchema,
})

export { forgejoIssueIdentifierSchema }
export type ForgejoIssueIdentifier = a.InferOutput<typeof forgejoIssueIdentifierSchema>
