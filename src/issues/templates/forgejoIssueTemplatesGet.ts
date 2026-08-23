import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryReferenceParse } from "../../repositories/forgejoRepositoryReferenceParse.js"
import { forgejoIssuePathCreate } from "../forgejoIssuePathCreate.js"
import { forgejoIssueTemplateSchema, type ForgejoIssueTemplate } from "./forgejoIssueTemplateSchema.js"

export async function forgejoIssueTemplatesGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoIssueTemplate[]>> {
  const op = "forgejoIssueTemplatesGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const response = await transport.request({
    path: `${forgejoIssuePathCreate(repository.data)}/issue_templates`,
  })
  if (!response.success) return response
  const templates = a.safeParse(a.array(forgejoIssueTemplateSchema), response.data.data)
  if (!templates.success) return createResultError(op, a.summarize(templates.issues))
  return createResult(templates.output)
}
