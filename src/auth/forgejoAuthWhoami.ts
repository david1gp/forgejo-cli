import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserCurrentGet } from "../users/forgejoUserCurrentGet.js"
import type { ForgejoUser } from "../users/forgejoUserSchema.js"

/** Retrieves the authenticated user; the supplied transport must carry credentials. */
export async function forgejoAuthWhoami(transport: ForgejoRestTransport): Promise<ForgejoResult<ForgejoUser>> {
  return forgejoUserCurrentGet(transport)
}
