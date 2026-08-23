import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoActionSecretList } from "./forgejoActionSecretList.js"
import type { ForgejoActionSecret } from "./forgejoActionSecretSchema.js"

export function forgejoActionSecretsList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoActionSecret[]>> {
  return forgejoActionSecretList(transport, repositoryInput)
}
