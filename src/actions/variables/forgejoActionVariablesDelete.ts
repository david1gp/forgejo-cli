import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoActionVariableDelete } from "./forgejoActionVariableDelete.js"

export function forgejoActionVariablesDelete(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  nameInput: unknown,
): Promise<ForgejoResult<null>> {
  return forgejoActionVariableDelete(transport, repositoryInput, nameInput)
}
