import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { type ForgejoPullRequestNumber } from "./forgejoPullRequestNumberSchema.js"

const forgejoPullRequestNumberInputSchema = a.pipe(
  a.string(),
  a.regex(/^\^?\d+$/),
  a.transform(
    (input): ForgejoPullRequestNumber => ({
      number: Number(input.replace(/^\^/, "")),
      parent: input.startsWith("^"),
    }),
  ),
  a.check(
    (input: ForgejoPullRequestNumber) => Number.isSafeInteger(input.number),
    "Pull request number must be a safe integer",
  ),
)

export function forgejoPullRequestNumberParse(input: unknown): ForgejoResult<ForgejoPullRequestNumber> {
  const op = "forgejoPullRequestNumberParse"
  if (typeof input !== "string") return createResultError(op, "Pull request number must be a string")

  const parsed = a.safeParse(forgejoPullRequestNumberInputSchema, input.trim())
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), input)
  return createResult(parsed.output)
}
