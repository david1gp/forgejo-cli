import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoActionVariableList } from "./forgejoActionVariableList.js"
import type { ForgejoActionVariable } from "./forgejoActionVariableSchema.js"

export function forgejoActionVariablesList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoActionVariable[]>> {
  return forgejoActionVariableList(transport, repositoryInput)
}
