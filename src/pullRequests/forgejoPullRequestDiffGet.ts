import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestPathCreate } from "./forgejoPullRequestPathCreate.js"
import { forgejoPullRequestReferenceResolve } from "./forgejoPullRequestReferenceResolve.js"
import {
  forgejoPullRequestDiffOptionsSchema,
  type ForgejoPullRequestDiffOptions,
} from "./forgejoPullRequestDiffOptionsSchema.js"

export async function forgejoPullRequestDiffGet(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<string>> {
  const op = "forgejoPullRequestDiffGet"
  const reference = await forgejoPullRequestReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const parsed = a.safeParse(forgejoPullRequestDiffOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoPullRequestDiffOptions = parsed.output
  const format = options.format ?? "diff"
  const response = await transport.request({
    path: `${forgejoPullRequestPathCreate(reference.data.repository, reference.data.pullRequest.number)}.${format}`,
    responseType: "text",
  })
  if (!response.success) return response
  if (typeof response.data.data !== "string") return createResultError(op, "Forgejo diff response is not text")
  return createResult(response.data.data)
}
