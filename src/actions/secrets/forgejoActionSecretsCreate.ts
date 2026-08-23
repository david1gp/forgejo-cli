import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoActionSecretCreate } from "./forgejoActionSecretCreate.js"

export function forgejoActionSecretsCreate(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
  input: unknown,
  dataInput?: unknown,
): Promise<ForgejoResult<null>> {
  return forgejoActionSecretCreate(transport, repositoryInput, input, dataInput)
}
