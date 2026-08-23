import * as a from "valibot"
import { createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryReferenceParse } from "../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoIssueCreateOptionsSchema, type ForgejoIssueCreateOptions } from "./forgejoIssueCreateOptionsSchema.js"
import { forgejoIssuePathCreate } from "./forgejoIssuePathCreate.js"
import { forgejoIssueResponseParse } from "./forgejoIssueResponseParse.js"
import type { ForgejoIssue } from "./forgejoIssueSchema.js"

export async function forgejoIssueCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  optionsInput: unknown,
): Promise<ForgejoResult<ForgejoIssue>> {
  const op = "forgejoIssueCreate"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const parsed = a.safeParse(forgejoIssueCreateOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), optionsInput as string)
  const options: ForgejoIssueCreateOptions = parsed.output
  const { dueDate, ref, ...rest } = options
  const body = {
    ...rest,
    ...(dueDate === undefined ? {} : { due_date: dueDate }),
    ...(ref === undefined ? {} : { ref }),
  }
  const response = await transport.request({
    path: forgejoIssuePathCreate(repository.data),
    method: "POST",
    body,
  })
  if (!response.success) return response
  return forgejoIssueResponseParse(response.data.data, op, repository.data)
}
