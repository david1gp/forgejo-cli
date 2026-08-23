import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoIssueReferenceParse } from "./forgejoIssueReferenceParse.js"
import type { ForgejoIssueIdentifier } from "./forgejoIssueIdentifierSchema.js"

export function forgejoIssueTargetParse(input: unknown): ForgejoResult<ForgejoIssueIdentifier[]> {
  const op = "forgejoIssueTargetParse"
  const list = a.safeParse(a.array(a.unknown()), input)
  const inputs = list.success ? list.output : [input]
  if (inputs.length === 0) return createResultError(op, "At least one issue target is required")
  const targets: ForgejoIssueIdentifier[] = []
  for (const item of inputs) {
    const target = forgejoIssueReferenceParse(item)
    if (!target.success) return createResultError(op, target.errorMessage)
    targets.push(target.data)
  }
  return createResult(targets)
}
