import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoPullRequestEditOptionsSchema,
  type ForgejoPullRequestEditOptions,
} from "./forgejoPullRequestEditOptionsSchema.js"
import { forgejoPullRequestPathCreate } from "./forgejoPullRequestPathCreate.js"
import { forgejoPullRequestReferenceResolve } from "./forgejoPullRequestReferenceResolve.js"
import { forgejoPullRequestResponseParse } from "./forgejoPullRequestResponseParse.js"
import type { ForgejoPullRequest } from "./forgejoPullRequestSchema.js"

export async function forgejoPullRequestEdit(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoPullRequest>> {
  const op = "forgejoPullRequestEdit"
  const reference = await forgejoPullRequestReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const parsed = a.safeParse(forgejoPullRequestEditOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoPullRequestEditOptions = parsed.output
  const response = await transport.request({
    path: forgejoPullRequestPathCreate(reference.data.repository, reference.data.pullRequest.number).replace(
      "/pulls/",
      "/issues/",
    ),
    method: "PATCH",
    body: options,
  })
  if (!response.success) return response
  return forgejoPullRequestResponseParse(response.data.data, op, reference.data.repository)
}
