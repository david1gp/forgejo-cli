import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoActionVariableCreate } from "./forgejoActionVariableCreate.js"

export function forgejoActionVariablesCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  input: unknown,
  dataInput?: unknown,
  forceInput?: unknown,
): Promise<ForgejoResult<null>> {
  return forgejoActionVariableCreate(transport, repositoryInput, input, dataInput, forceInput)
}
