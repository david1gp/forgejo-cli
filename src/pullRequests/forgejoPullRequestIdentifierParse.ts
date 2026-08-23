import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoRepositoryIdentifierParse } from "../repositories/forgejoRepositoryIdentifierParse.js"
import {
  type ForgejoPullRequestIdentifier,
  forgejoPullRequestIdentifierSchema,
} from "./forgejoPullRequestIdentifierSchema.js"
import { forgejoPullRequestNumberParse } from "./forgejoPullRequestNumberParse.js"

export function forgejoPullRequestIdentifierParse(input: unknown): ForgejoResult<ForgejoPullRequestIdentifier> {
  const op = "forgejoPullRequestIdentifierParse"
  if (typeof input !== "string") return createResultError(op, "Pull request identifier must be a string")

  const value = input.trim()
  const separator = value.lastIndexOf("#")
  const repositoryInput = separator === -1 ? undefined : value.slice(0, separator)
  const numberInput = separator === -1 ? value : value.slice(separator + 1)
  const number = forgejoPullRequestNumberParse(numberInput)
  if (!number.success) return number

  const repository = repositoryInput === undefined ? undefined : forgejoRepositoryIdentifierParse(repositoryInput)
  if (repository && !repository.success) return repository

  const parsed = a.safeParse(forgejoPullRequestIdentifierSchema, {
    repo: repository?.data,
    number: number.data.number,
    parent: number.data.parent,
  })
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), input)
  return createResult(parsed.output)
}
