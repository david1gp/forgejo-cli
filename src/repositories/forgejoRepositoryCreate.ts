import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import {
  forgejoRepositoryCreateOptionsSchema,
  type ForgejoRepositoryCreateOptions,
} from "./forgejoRepositoryCreateOptionsSchema.js"
import { forgejoRepositoryResponseParse } from "./forgejoRepositoryResponseParse.js"
import type { ForgejoRepository } from "./forgejoRepositorySchema.js"

export async function forgejoRepositoryCreate(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoRepository>> {
  const op = "forgejoRepositoryCreate"
  const parsed = a.safeParse(forgejoRepositoryCreateOptionsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoRepositoryCreateOptions = parsed.output
  const { organization, autoInit, defaultBranch, gitignores, issueLabels, trustModel, objectFormatName, ...rest } =
    options
  const body = {
    ...rest,
    ...(autoInit === undefined ? {} : { auto_init: autoInit }),
    ...(defaultBranch === undefined ? {} : { default_branch: defaultBranch }),
    ...(gitignores === undefined ? {} : { gitignores }),
    ...(issueLabels === undefined ? {} : { issue_labels: issueLabels }),
    ...(trustModel === undefined ? {} : { trust_model: trustModel }),
    ...(objectFormatName === undefined ? {} : { object_format_name: objectFormatName }),
  }
  const response = await transport.request({
    path: organization === undefined ? "/api/v1/user/repos" : `/api/v1/orgs/${encodeURIComponent(organization)}/repos`,
    method: "POST",
    body,
  })
  if (!response.success) return response
  const repository = forgejoRepositoryResponseParse(response.data.data, op)
  if (!repository.success) return repository
  return createResult(repository.data)
}
