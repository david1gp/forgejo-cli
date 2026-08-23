import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { type ForgejoConfiguration, forgejoConfigurationSchema } from "./forgejoConfigurationSchema.js"

export function forgejoConfigurationParse(input: unknown): ForgejoResult<ForgejoConfiguration> {
  const op = "forgejoConfigurationParse"
  const parsed = a.safeParse(forgejoConfigurationSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
