import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoVersionGet } from "./forgejoVersionGet.js"
import type { ForgejoVersion } from "./forgejoVersionSchema.js"

/** Retrieves Forgejo server version information using the supplied transport. */
export async function forgejoAuthVersion(transport: ForgejoRestTransport): Promise<ForgejoResult<ForgejoVersion>> {
  return forgejoVersionGet(transport)
}
