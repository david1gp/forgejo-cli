import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryLabelReferenceParse } from "./forgejoRepositoryLabelReferenceParse.js"
import { forgejoRepositoryLabelsGet } from "./forgejoRepositoryLabelsGet.js"

export async function forgejoRepositoryLabelIdResolve(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  labelInput: unknown,
): Promise<ForgejoResult<number>> {
  const op = "forgejoRepositoryLabelIdResolve"
  const label = forgejoRepositoryLabelReferenceParse(labelInput)
  if (!label.success) return createResultError(op, label.errorMessage)
  if (typeof label.data === "number") return createResult(label.data)
  const labels = await forgejoRepositoryLabelsGet(transport, repositoryInput, { includeArchived: true })
  if (!labels.success) return createResultError(op, labels.errorMessage)
  const match = labels.data.find((candidate) => candidate.name === label.data)
  if (match?.id === undefined || match.id === null) return createResultError(op, "Repository label was not found")
  return createResult(match.id)
}
