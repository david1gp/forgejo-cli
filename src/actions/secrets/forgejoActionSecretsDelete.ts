import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoActionSecretDelete } from "./forgejoActionSecretDelete.js"

export function forgejoActionSecretsDelete(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  nameInput: unknown,
): Promise<ForgejoResult<null>> {
  return forgejoActionSecretDelete(transport, repositoryInput, nameInput)
}
