import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import { forgejoOrganizationLabelsList } from "./forgejoOrganizationLabelsList.js"

const forgejoOrganizationLabelIdSchema = a.pipe(a.number(), a.integer(), a.minValue(1))

export async function forgejoOrganizationLabelIdResolve(
  transport: Parameters<typeof forgejoOrganizationLabelsList>[0],
  organizationInput: unknown,
  labelInput: unknown,
): Promise<ForgejoResult<number>> {
  const op = "forgejoOrganizationLabelIdResolve"
  const id = a.safeParse(forgejoOrganizationLabelIdSchema, labelInput)
  if (id.success) return createResult(id.output)
  if (typeof labelInput !== "string") return createResultError(op, a.summarize(id.issues))
  const labels = await forgejoOrganizationLabelsList(transport, organizationInput)
  if (!labels.success) return labels
  const label = labels.data.find((item) => item.name === labelInput)
  if (!label?.id) return createResultError(op, `Label ${labelInput} was not found`)
  return createResult(label.id)
}
