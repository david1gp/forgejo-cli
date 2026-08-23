import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoRepositoryIdentifierParse } from "../repositories/forgejoRepositoryIdentifierParse.js"
import { type ForgejoIssueIdentifier, forgejoIssueIdentifierSchema } from "./forgejoIssueIdentifierSchema.js"

const forgejoIssueNumberInputSchema = a.pipe(
  a.string(),
  a.regex(/^\d+$/),
  a.transform(Number),
  a.safeInteger("Issue number must be a safe integer"),
)

export function forgejoIssueIdentifierParse(input: unknown): ForgejoResult<ForgejoIssueIdentifier> {
  const op = "forgejoIssueIdentifierParse"
  if (typeof input !== "string") return createResultError(op, "Issue identifier must be a string")

  const value = input.trim()
  const separator = value.lastIndexOf("#")
  const repositoryInput = separator === -1 ? undefined : value.slice(0, separator)
  const numberInput = separator === -1 ? value : value.slice(separator + 1)
  const number = a.safeParse(forgejoIssueNumberInputSchema, numberInput)
  if (!number.success) return createResultError(op, a.summarize(number.issues), input)

  const repository = repositoryInput === undefined ? undefined : forgejoRepositoryIdentifierParse(repositoryInput)
  if (repository && !repository.success) return repository

  const parsed = a.safeParse(forgejoIssueIdentifierSchema, { repo: repository?.data, number: number.output })
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), input)
  return createResult(parsed.output)
}
